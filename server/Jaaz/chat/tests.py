"""Tests for the chat API.

ai_service is faked at the HTTP boundary — these tests are about what Django
is responsible for: authentication, conversation ownership, what gets
persisted, and what is forwarded. Retrieval and generation quality are
ai_service's own suite.

The ownership tests are the ones that matter most. A conversation is a
person's private history, and the failure mode is reading someone else's.
"""

import json
from unittest.mock import patch

from django.contrib.auth.hashers import Argon2PasswordHasher
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from account.models import AccountProfile, AccountStatus
from chat.models import Conversation, Message, MessageRole
from chat.services import derive_title

PASSWORD = 'correct-horse-battery-staple'

CONVERSATIONS = '/api/chat/conversations/'


class FastArgon2Hasher(Argon2PasswordHasher):
    """Argon2id with the cost turned down. See knowledge_base/tests/support.py."""

    memory_cost = 64
    time_cost = 1
    parallelism = 1


ANSWER = {
    'answer': 'The warranty is thirty-six months. [1]',
    'sources': [
        {
            'documentId': 'doc-1', 'documentName': 'Warranty Policy',
            'chunkId': 'doc-1:0', 'chunkIndex': 0, 'page': 2, 'pages': [2],
            'heading': None, 'citationNumber': 1, 'score': 0.87,
            'excerpt': 'Every installation carries a thirty-six month warranty.',
        }
    ],
    'metadata': {
        'provider': 'gemini', 'model': 'gemini-2.0-flash', 'grounded': True,
        'queryRewritten': False, 'retrievalCount': 8, 'contextChunkCount': 4,
        'retrievalMs': 120, 'generationMs': 900, 'totalMs': 1020,
        'promptTokens': 900, 'completionTokens': 40,
        # Not in the allow-list; must not be persisted.
        'internalPromptText': 'SYSTEM: you are...',
    },
}


@override_settings(PASSWORD_HASHERS=['chat.tests.FastArgon2Hasher'])
class ChatTestCase(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = self._make_user('member@example.com')
        self.other = self._make_user('other@example.com')
        self.sign_in(self.user)

    def tearDown(self):
        cache.clear()

    @staticmethod
    def _make_user(email):
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.create_user(
            username=email.split('@')[0], email=email, password=PASSWORD
        )
        AccountProfile.objects.create(user=user, status=AccountStatus.ACTIVE)
        return user

    def sign_in(self, user):
        response = self.client.post(
            '/api/auth/login/',
            {'email': user.email, 'password': PASSWORD},
            format='json',
        )
        self.assertEqual(response.status_code, 200, response.content)

    def new_conversation(self, user=None):
        return Conversation.objects.create(user=user or self.user)

    def ask_url(self, conversation, suffix='messages/'):
        return f'{CONVERSATIONS}{conversation.pk}/{suffix}'


class AccessTests(ChatTestCase):
    def test_an_anonymous_user_cannot_list_conversations(self):
        self.client.cookies.clear()
        self.assertEqual(self.client.get(CONVERSATIONS).status_code, 401)

    def test_an_anonymous_user_cannot_ask(self):
        conversation = self.new_conversation()
        self.client.cookies.clear()
        response = self.client.post(
            self.ask_url(conversation), {'message': 'hello'}, format='json'
        )
        self.assertEqual(response.status_code, 401)

    def test_any_authenticated_user_may_chat(self):
        """Not just administrators. The knowledge base is the organisation's."""
        self.assertFalse(self.user.is_staff)
        self.assertEqual(self.client.get(CONVERSATIONS).status_code, 200)

    def test_a_conversation_belonging_to_someone_else_is_not_listed(self):
        self.new_conversation(user=self.other)
        body = self.client.get(CONVERSATIONS).json()
        self.assertEqual(body['results'], [])

    def test_a_conversation_belonging_to_someone_else_is_404_not_403(self):
        """403 would confirm that it exists."""
        theirs = self.new_conversation(user=self.other)
        response = self.client.get(f'{CONVERSATIONS}{theirs.pk}/')
        self.assertEqual(response.status_code, 404)

    def test_a_conversation_belonging_to_someone_else_cannot_be_deleted(self):
        theirs = self.new_conversation(user=self.other)
        self.assertEqual(
            self.client.delete(f'{CONVERSATIONS}{theirs.pk}/').status_code, 404
        )
        self.assertTrue(Conversation.objects.filter(pk=theirs.pk).exists())

    def test_a_conversation_belonging_to_someone_else_cannot_be_asked(self):
        theirs = self.new_conversation(user=self.other)
        response = self.client.post(
            self.ask_url(theirs), {'message': 'hello'}, format='json'
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Message.objects.filter(conversation=theirs).count(), 0)


class ConversationTests(ChatTestCase):
    def test_creating_a_conversation(self):
        response = self.client.post(CONVERSATIONS, {}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Conversation.objects.filter(user=self.user).count(), 1)

    def test_listing_returns_newest_first(self):
        from datetime import timedelta

        from django.utils import timezone

        first = self.new_conversation()
        second = self.new_conversation()
        # Set the timestamps explicitly. Created back to back they land in
        # the same instant, and the test would then be asserting on a
        # tiebreaker rather than on recency.
        Conversation.objects.filter(pk=first.pk).update(
            updated_at=timezone.now() - timedelta(hours=1)
        )
        Conversation.objects.filter(pk=second.pk).update(
            updated_at=timezone.now()
        )

        results = self.client.get(CONVERSATIONS).json()['results']
        self.assertEqual(results[0]['id'], str(second.pk))
        self.assertEqual(results[1]['id'], str(first.pk))

    def test_a_stored_citation_keeps_the_reference_and_drops_the_passage(self):
        """What `sources` persists.

        REGRESSION. The retrieved passage text arrived in `excerpt` and was
        written to the message row unfiltered, while the comment beside it
        said citations only. That copies the corpus into the message table
        one passage at a time, and leaves a deleted document quoted inside
        every old conversation that cited it.
        """
        from chat.services import _safe_sources

        stored = _safe_sources(ANSWER['sources'])

        self.assertEqual(len(stored), 1)
        self.assertNotIn('excerpt', stored[0])
        # Everything needed to find the passage again survives.
        for field in ('documentId', 'documentName', 'chunkId', 'page',
                      'citationNumber'):
            self.assertIn(field, stored[0])
        self.assertEqual(stored[0]['documentName'], 'Warranty Policy')

    def test_stored_citations_reject_anything_unexpected(self):
        from chat.services import _safe_sources

        self.assertEqual(_safe_sources('not a list'), [])
        self.assertEqual(_safe_sources(None), [])
        self.assertEqual(_safe_sources([None, 'x']), [])

    def test_the_listing_query_is_ordered_even_though_it_aggregates(self):
        """The list view's SQL must carry an ORDER BY.

        REGRESSION. The view annotates a message count, which makes the query
        an aggregate, and Django does not apply a model's `Meta.ordering` to a
        query that groups. The SQL came out with no ORDER BY at all and
        Postgres returned conversations in whatever order it found them — so
        the sidebar reshuffled between page loads, and this suite failed about
        half the time for what looked like no reason.

        Asserting on the compiled SQL rather than on two rows, because two
        rows in the right order is exactly what an unordered query produces
        half the time.
        """
        from django.db.models import Count

        from chat.services import ConversationService

        query = str(
            ConversationService(self.user)
            .list()
            .annotate(message_count=Count('messages'))
            .query
        )

        self.assertIn('ORDER BY', query)
        self.assertIn('"updated_at" DESC', query)

    def test_deleting_a_conversation_removes_its_messages(self):
        conversation = self.new_conversation()
        Message.objects.create(
            conversation=conversation, role=MessageRole.USER, content='hi'
        )

        self.assertEqual(
            self.client.delete(f'{CONVERSATIONS}{conversation.pk}/').status_code,
            204,
        )
        self.assertEqual(Message.objects.count(), 0)

    def test_a_title_is_derived_from_the_first_question(self):
        self.assertEqual(
            derive_title('What is the warranty period?'),
            'What is the warranty period?',
        )

    def test_a_long_title_is_cut_on_a_word_boundary(self):
        title = derive_title('word ' * 40)
        self.assertTrue(title.endswith('…'))
        self.assertLessEqual(len(title), 62)
        self.assertNotIn('  ', title)


@patch('chat.views.AiServiceClient')
class AskTests(ChatTestCase):
    def test_a_question_is_answered_and_both_turns_are_stored(self, client_class):
        client_class.return_value.chat.return_value = ANSWER
        conversation = self.new_conversation()

        response = self.client.post(
            self.ask_url(conversation),
            {'message': 'What is the warranty?'}, format='json',
        )

        self.assertEqual(response.status_code, 200)
        roles = list(conversation.messages.values_list('role', flat=True))
        self.assertEqual(roles, ['user', 'assistant'])

    def test_the_answer_keeps_its_citations(self, client_class):
        client_class.return_value.chat.return_value = ANSWER
        conversation = self.new_conversation()

        body = self.client.post(
            self.ask_url(conversation), {'message': 'warranty'}, format='json'
        ).json()

        sources = body['message']['sources']
        self.assertEqual(sources[0]['documentName'], 'Warranty Policy')
        self.assertEqual(sources[0]['page'], 2)

    def test_unexpected_metadata_is_not_persisted(self, client_class):
        """An allow-list, so a future ai_service field is not stored silently.

        `internalPromptText` in the fixture is exactly the kind of thing that
        must not end up in a database row that is later sent to a browser.
        """
        client_class.return_value.chat.return_value = ANSWER
        conversation = self.new_conversation()

        self.client.post(self.ask_url(conversation),
                         {'message': 'warranty'}, format='json')

        stored = conversation.messages.get(role=MessageRole.ASSISTANT)
        self.assertIn('provider', stored.metadata)
        self.assertNotIn('internalPromptText', stored.metadata)

    def test_the_conversation_title_is_set_from_the_first_question(
        self, client_class
    ):
        client_class.return_value.chat.return_value = ANSWER
        conversation = self.new_conversation()

        self.client.post(self.ask_url(conversation),
                         {'message': 'How long is the warranty?'}, format='json')

        conversation.refresh_from_db()
        self.assertEqual(conversation.title, 'How long is the warranty?')

    def test_history_is_forwarded_without_the_current_question(
        self, client_class
    ):
        """Otherwise the model sees the question twice, once as its own context."""
        client_class.return_value.chat.return_value = ANSWER
        conversation = self.new_conversation()
        Message.objects.create(conversation=conversation,
                               role=MessageRole.USER, content='First question')
        Message.objects.create(conversation=conversation,
                               role=MessageRole.ASSISTANT, content='First answer')

        self.client.post(self.ask_url(conversation),
                         {'message': 'Second question'}, format='json')

        payload = client_class.return_value.chat.call_args[0][0]
        self.assertEqual(payload['message'], 'Second question')
        self.assertEqual(len(payload['history']), 2)
        self.assertNotIn(
            'Second question', [m['content'] for m in payload['history']]
        )

    def test_the_question_survives_a_generation_failure(self, client_class):
        """So the user can retry rather than retype."""
        from chat.client import AiServiceError

        client_class.return_value.chat.side_effect = AiServiceError()
        conversation = self.new_conversation()

        response = self.client.post(
            self.ask_url(conversation), {'message': 'warranty'}, format='json'
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(conversation.messages.count(), 1)
        self.assertEqual(conversation.messages.first().role, 'user')

    def test_a_service_failure_does_not_leak_internals(self, client_class):
        from chat.client import AiServiceError

        client_class.return_value.chat.side_effect = AiServiceError()
        conversation = self.new_conversation()

        body = self.client.post(
            self.ask_url(conversation), {'message': 'warranty'}, format='json'
        ).content.decode()

        for leak in ('Traceback', 'qdrant', 'api_key', 'gemini', 'localhost:8001'):
            self.assertNotIn(leak, body.lower())

    def test_an_empty_question_is_rejected(self, client_class):
        conversation = self.new_conversation()
        response = self.client.post(
            self.ask_url(conversation), {'message': '   '}, format='json'
        )
        self.assertEqual(response.status_code, 400)
        client_class.return_value.chat.assert_not_called()

    def test_an_overlong_question_is_rejected(self, client_class):
        conversation = self.new_conversation()
        response = self.client.post(
            self.ask_url(conversation), {'message': 'x' * 20_000}, format='json'
        )
        self.assertEqual(response.status_code, 400)

    def test_the_user_identity_is_sent_to_the_ai_service(self, client_class):
        client_class.return_value.chat.return_value = ANSWER
        conversation = self.new_conversation()

        self.client.post(self.ask_url(conversation),
                         {'message': 'warranty'}, format='json')

        # The identity is passed as the `user` kwarg, from request.user —
        # never from anything the browser sent.
        _, kwargs = client_class.return_value.chat.call_args
        self.assertEqual(kwargs['user'], self.user)


@patch('chat.views.AiServiceClient')
class StreamTests(ChatTestCase):
    @staticmethod
    def sse_frames():
        complete = json.dumps({
            'answer': ANSWER['answer'],
            'sources': ANSWER['sources'],
            'metadata': ANSWER['metadata'],
        })
        return [
            b'event: message_start\ndata: {"conversationId":"c"}\n\n',
            b'event: sources\ndata: {"sources":[]}\n\n',
            b'event: token\ndata: {"delta":"The warranty "}\n\n',
            b'event: token\ndata: {"delta":"is thirty-six months."}\n\n',
            f'event: message_complete\ndata: {complete}\n\n'.encode(),
        ]

    def test_the_stream_accepts_the_header_a_browser_actually_sends(
        self, client_class
    ):
        """`Accept: text/event-stream` must not be refused.

        REGRESSION. DRF negotiates content before the handler runs, and the
        project registers JSONRenderer only — so a client asking for the
        media type this endpoint genuinely returns got 406 Not Acceptable and
        never reached the view.

        Every existing test missed it because Django's test client sends no
        Accept header, and the Python script used to exercise the API sent
        `*/*`. Both match JSONRenderer and pass. Only a real SSE client,
        asking correctly, failed. So this test states the header explicitly.
        """
        client_class.return_value.stream_chat.return_value = iter(self.sse_frames())
        conversation = self.new_conversation()

        response = self.client.post(
            self.ask_url(conversation, 'messages/stream/'),
            {'message': 'What is the warranty?'},
            format='json',
            HTTP_ACCEPT='text/event-stream',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/event-stream')
        b''.join(response.streaming_content)

    def test_the_stream_still_serves_a_client_that_asks_for_json(self, client_class):
        """The relay is unchanged for a caller that negotiates JSON.

        JSONRenderer is listed first so that a failure *before* streaming
        starts still comes back in the API's ordinary error envelope.
        """
        client_class.return_value.stream_chat.return_value = iter(self.sse_frames())
        conversation = self.new_conversation()

        response = self.client.post(
            self.ask_url(conversation, 'messages/stream/'),
            {'message': 'What is the warranty?'},
            format='json',
            HTTP_ACCEPT='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/event-stream')
        b''.join(response.streaming_content)

    def test_the_stream_is_relayed_to_the_browser(self, client_class):
        client_class.return_value.stream_chat.return_value = iter(self.sse_frames())
        conversation = self.new_conversation()

        response = self.client.post(
            self.ask_url(conversation, 'messages/stream/'),
            {'message': 'warranty'}, format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/event-stream')
        self.assertEqual(response['X-Accel-Buffering'], 'no')

        body = b''.join(response.streaming_content).decode()
        self.assertIn('event: token', body)
        self.assertIn('The warranty ', body)

    def test_the_answer_is_persisted_from_the_completion_frame(
        self, client_class
    ):
        """Persisted from the server's view, not the browser's report."""
        client_class.return_value.stream_chat.return_value = iter(self.sse_frames())
        conversation = self.new_conversation()

        response = self.client.post(
            self.ask_url(conversation, 'messages/stream/'),
            {'message': 'warranty'}, format='json',
        )
        b''.join(response.streaming_content)

        stored = conversation.messages.get(role=MessageRole.ASSISTANT)
        self.assertEqual(stored.content, ANSWER['answer'])
        self.assertEqual(stored.sources[0]['documentName'], 'Warranty Policy')

    def test_a_stream_failure_becomes_an_error_frame(self, client_class):
        from chat.client import AiServiceError

        def failing():
            yield b'event: message_start\ndata: {}\n\n'
            raise AiServiceError()

        client_class.return_value.stream_chat.return_value = failing()
        conversation = self.new_conversation()

        response = self.client.post(
            self.ask_url(conversation, 'messages/stream/'),
            {'message': 'warranty'}, format='json',
        )
        body = b''.join(response.streaming_content).decode()

        self.assertIn('event: error', body)
        self.assertNotIn('Traceback', body)

    def test_nothing_is_persisted_when_the_stream_never_completes(
        self, client_class
    ):
        def truncated():
            yield b'event: token\ndata: {"delta":"partial"}\n\n'

        client_class.return_value.stream_chat.return_value = truncated()
        conversation = self.new_conversation()

        response = self.client.post(
            self.ask_url(conversation, 'messages/stream/'),
            {'message': 'warranty'}, format='json',
        )
        b''.join(response.streaming_content)

        # The question is stored; a half-written answer is not.
        self.assertEqual(conversation.messages.count(), 1)


@patch('chat.views.AiServiceClient')
class RegenerateTests(ChatTestCase):
    def test_regenerating_replaces_the_previous_answer(self, client_class):
        client_class.return_value.chat.return_value = ANSWER
        conversation = self.new_conversation()
        Message.objects.create(conversation=conversation,
                               role=MessageRole.USER, content='warranty?')
        Message.objects.create(conversation=conversation,
                               role=MessageRole.ASSISTANT, content='old answer')

        response = self.client.post(
            f'{CONVERSATIONS}{conversation.pk}/regenerate/', {}, format='json'
        )

        self.assertEqual(response.status_code, 200)
        contents = list(conversation.messages.values_list('content', flat=True))
        self.assertEqual(len(contents), 2)
        self.assertNotIn('old answer', contents)

    def test_regenerating_reuses_the_last_question(self, client_class):
        client_class.return_value.chat.return_value = ANSWER
        conversation = self.new_conversation()
        Message.objects.create(conversation=conversation,
                               role=MessageRole.USER, content='warranty?')

        self.client.post(f'{CONVERSATIONS}{conversation.pk}/regenerate/',
                         {}, format='json')

        payload = client_class.return_value.chat.call_args[0][0]
        self.assertEqual(payload['message'], 'warranty?')

    def test_regenerating_an_empty_conversation_is_a_conflict(self, client_class):
        conversation = self.new_conversation()
        response = self.client.post(
            f'{CONVERSATIONS}{conversation.pk}/regenerate/', {}, format='json'
        )
        self.assertEqual(response.status_code, 409)
