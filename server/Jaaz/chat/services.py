"""Conversation lifecycle and the chat orchestration Django is responsible for.

Django's job in a chat turn is narrow and worth stating: authenticate, load
the conversation the user owns, persist their question, forward it with the
history, persist the answer. Everything between "forward" and "answer" —
retrieval, prompting, generation, citations — belongs to ai_service.

Ownership is checked by querying `conversation.filter(user=...)`, never by
loading a conversation and then comparing its user to the caller. The two
look equivalent and are not: the second returns 403 for someone else's
conversation and 404 for one that does not exist, which confirms the
existence of conversations the caller may not see.
"""

import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import (
    CONVERSATION_ORDERING,
    Conversation,
    Message,
    MessageRole,
)

logger = logging.getLogger('jaaz.chat')

_TITLE_LENGTH = 60


def derive_title(question):
    """A readable sidebar label from the first question.

    Cut on a word boundary; a title ending mid-word reads like a bug.
    """
    text = ' '.join(question.split())
    if len(text) <= _TITLE_LENGTH:
        return text or 'New conversation'
    window = text[:_TITLE_LENGTH]
    space = window.rfind(' ')
    if space > _TITLE_LENGTH // 2:
        window = window[:space]
    return f'{window.rstrip()}…'


class ConversationService:
    """Reads and writes conversations for one authenticated user."""

    def __init__(self, user):
        self._user = user

    # -- queries ----------------------------------------------------------

    def list(self):
        """The user's conversations, newest activity first.

        `order_by` is explicit rather than inherited from `Meta.ordering`.
        The list view annotates this queryset with a message count, which
        makes it an aggregate query, and Django does not apply a model's
        default ordering to a query that groups — the SQL comes out with no
        ORDER BY and Postgres returns rows in whatever order it finds them.
        An explicit ordering survives the grouping; a default one does not.
        """
        return Conversation.objects.filter(user=self._user).order_by(
            *CONVERSATION_ORDERING
        )

    def get(self, conversation_id):
        """The user's conversation, or None.

        Scoped by user in the query itself — see the module docstring.
        """
        return Conversation.objects.filter(
            pk=conversation_id, user=self._user
        ).first()

    def messages(self, conversation):
        return conversation.messages.all()

    def history_for_ai(self, conversation):
        """Recent turns, in the shape ai_service expects.

        Trimmed here as well as there. ai_service applies its own context
        window, but serialising a thousand messages to send them across a
        network only to have them discarded is waste Django can avoid.
        """
        limit = settings.CHAT['MAX_HISTORY_MESSAGES']
        recent = list(
            conversation.messages.exclude(role=MessageRole.SYSTEM)
            .order_by('-created_at')[:limit]
        )
        recent.reverse()
        return [
            {'role': message.role, 'content': message.content}
            for message in recent
        ]

    # -- writes -----------------------------------------------------------

    @transaction.atomic
    def create(self, title=None):
        return Conversation.objects.create(
            user=self._user, title=title or 'New conversation'
        )

    @transaction.atomic
    def start_turn(self, conversation, question):
        """Persist the user's message before the answer is attempted.

        Deliberately committed first. If generation fails, times out, or the
        browser disconnects mid-answer, the question is still in the history
        — so the conversation reads correctly and the user can retry rather
        than retyping.
        """
        message = Message.objects.create(
            conversation=conversation,
            role=MessageRole.USER,
            content=question,
        )

        if conversation.messages.count() == 1:
            conversation.title = derive_title(question)

        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['title', 'updated_at'])
        return message

    @transaction.atomic
    def record_answer(self, conversation, answer, sources, metadata):
        message = Message.objects.create(
            conversation=conversation,
            role=MessageRole.ASSISTANT,
            content=answer,
            # Citations only, never the retrieved passages themselves.
            sources=_safe_sources(sources),
            metadata=_safe_metadata(metadata),
        )
        conversation.save(update_fields=['updated_at'])
        logger.info(
            'Answer recorded conversation=%s provider=%s chunks=%s',
            conversation.pk,
            (metadata or {}).get('provider'),
            (metadata or {}).get('contextChunkCount'),
        )
        return message

    @transaction.atomic
    def delete(self, conversation):
        conversation_id = conversation.pk
        conversation.delete()
        logger.info('Conversation deleted id=%s', conversation_id)

    @transaction.atomic
    def drop_messages_from(self, conversation, message):
        """Remove a message and everything after it.

        Used by regenerate: the assistant's reply and anything that followed
        it are discarded so the new answer continues from the same question,
        rather than the conversation growing two answers to one turn.
        """
        conversation.messages.filter(created_at__gte=message.created_at).delete()
        conversation.save(update_fields=['updated_at'])


# What a stored citation keeps: everything needed to *find* the passage
# again, and not the passage.
#
# `excerpt` is deliberately absent. ai_service returns it so the UI can show
# what an answer was built from while the answer is on screen, but persisting
# it would copy the corpus into the message table one passage at a time, and
# would mean a document deleted for a good reason lived on inside every old
# conversation that had cited it. The chunk id and page are enough to look
# the passage up in the knowledge base, where access is still checked.
_ALLOWED_SOURCE_FIELDS = frozenset({
    'documentId', 'documentName', 'chunkId', 'chunkIndex',
    'page', 'pages', 'heading', 'citationNumber', 'score',
})


def _safe_sources(sources):
    """Keep the citation, drop the passage.

    An allow-list, for the same reason `_safe_metadata` is one: this is
    stored and later returned to a browser, and a future version of
    ai_service adding a field to a source should not silently start
    persisting it.
    """
    if not isinstance(sources, list):
        return []
    return [
        {key: value for key, value in source.items()
         if key in _ALLOWED_SOURCE_FIELDS}
        for source in sources
        if isinstance(source, dict)
    ]


_ALLOWED_METADATA = frozenset({
    'provider', 'model', 'grounded', 'queryRewritten', 'retrievalCount',
    'contextChunkCount', 'retrievalMs', 'rerankMs', 'generationMs', 'totalMs',
    'promptTokens', 'completionTokens',
})


def _safe_metadata(metadata):
    """Keep the diagnostics, drop anything unexpected.

    An allow-list rather than a copy: this is stored and later returned to a
    browser, and a future version of ai_service adding a field to its
    metadata should not silently start persisting it.
    """
    if not isinstance(metadata, dict):
        return {}
    return {key: value for key, value in metadata.items() if key in _ALLOWED_METADATA}
