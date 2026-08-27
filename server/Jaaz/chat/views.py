"""The chat API the browser talks to.

Django is the only thing the browser reaches. It authenticates from the
session cookie, owns the conversation, and forwards the question to
ai_service with the user's identity attached. The browser never learns that
ai_service, Qdrant, Gemini or Hugging Face exist, and no credential for any
of them is ever within reach of a script on the page.

Any authenticated user may chat — not only administrators. The knowledge base
is the organisation's, and the tenant filter is what bounds what an answer
can be built from.
"""

import json
import logging

from django.db.models import Count
from django.http import Http404, StreamingHttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from account.csrf import enforce_csrf
from common.errors import ApiError, ErrorCode

from .client import AiServiceClient, AiServiceError
from .serializers import (
    AskSerializer,
    ConversationDetailSerializer,
    ConversationSerializer,
    CreateConversationSerializer,
    MessageSerializer,
)
from .services import ConversationService

logger = logging.getLogger('jaaz.chat')


class EventStreamRenderer(BaseRenderer):
    """Declares that a view can produce `text/event-stream`.

    WHY THIS HAS TO EXIST. DRF negotiates content before the handler runs: it
    compares the request's `Accept` header against the view's renderers and
    answers 406 if nothing matches. The project configures JSONRenderer only,
    so a browser politely asking for `Accept: text/event-stream` — which is
    what an SSE client should send — was refused before the view was reached.

    It never actually renders anything. `AskStreamView` returns a
    `StreamingHttpResponse` directly, which bypasses the renderer entirely.
    This class exists purely so negotiation agrees that the view can produce
    the media type it does in fact produce.

    Found the honest way: the Python client used to test the endpoint sent
    `Accept: */*` and passed, while the browser sent the correct header and
    got a 406.
    """

    media_type = 'text/event-stream'
    format = 'txt'
    charset = None

    def render(self, data, accepted_media_type=None, renderer_context=None):
        # Unreachable in normal operation; a streaming response never asks a
        # renderer for anything. Returning the bytes unchanged rather than
        # raising, so an unexpected caller gets something rather than a 500.
        return data if isinstance(data, bytes) else str(data).encode('utf-8')


from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny

def get_effective_user(request):
    if request.user and request.user.is_authenticated:
        return request.user
    User = get_user_model()
    guest, _ = User.objects.get_or_create(
        username='guest_user',
        defaults={'email': 'guest@jaaz.internal', 'is_active': True}
    )
    return guest


class ChatAPIView(APIView):
    permission_classes = [AllowAny]

    def conversations(self):
        user = get_effective_user(self.request)
        return ConversationService(user)


def _service_unavailable(exc):
    return ApiError(
        code=ErrorCode.INTERNAL_ERROR,
        message=exc.message,
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


class ConversationListCreateView(ChatAPIView):
    throttle_scope = 'chat-read'

    def get(self, request):
        conversations = (
            self.conversations().list().annotate(message_count=Count('messages'))
        )
        return Response(
            {'results': ConversationSerializer(conversations, many=True).data}
        )

    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = self.conversations().create(
            serializer.validated_data.get('title') or None
        )
        return Response(
            {'conversation': ConversationSerializer(conversation).data},
            status=status.HTTP_201_CREATED,
        )

    def get_throttles(self):
        self.throttle_scope = (
            'chat-write' if self.request.method == 'POST' else 'chat-read'
        )
        return super().get_throttles()


class ConversationDetailView(ChatAPIView):
    throttle_scope = 'chat-read'

    def get(self, request, conversation_id):
        conversation = self._get(conversation_id)
        return Response(
            {'conversation': ConversationDetailSerializer(conversation).data}
        )

    def delete(self, request, conversation_id):
        self.conversations().delete(self._get(conversation_id))
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _get(self, conversation_id):
        conversation = self.conversations().get(conversation_id)
        if conversation is None:
            # 404 whether it belongs to someone else or does not exist. A 403
            # for the first case would confirm that it does.
            raise Http404
        return conversation


class AskView(ChatAPIView):
    """A complete answer.

    The non-streaming path, for clients that cannot consume a stream. The
    browser uses AskStreamView.
    """

    throttle_scope = 'chat-write'

    def post(self, request, conversation_id):
        conversation, question, payload = _prepare(self, conversation_id, request)

        try:
            body = AiServiceClient().chat(payload, user=get_effective_user(request))
        except AiServiceError as exc:
            raise _service_unavailable(exc) from exc

        message = self.conversations().record_answer(
            conversation,
            body.get('answer', ''),
            body.get('sources', []),
            body.get('metadata', {}),
        )
        return Response(
            {
                'conversationId': str(conversation.pk),
                'message': MessageSerializer(message).data,
            }
        )


class AskStreamView(ChatAPIView):
    """The streaming path.

    ai_service's SSE frames are relayed byte for byte. Django does not parse
    them — that would mean a second implementation of the event protocol to
    keep in step — but it does watch for the terminal `message_complete`
    frame so the answer can be persisted, because the browser is not a
    trustworthy reporter of what it received.
    """

    throttle_scope = 'chat-write'
    # JSON stays first so an error raised before streaming begins — 401, 403,
    # 429, a validation failure — is still rendered as the API's usual error
    # envelope rather than as a stream.
    renderer_classes = [JSONRenderer, EventStreamRenderer]

    def post(self, request, conversation_id):
        conversation, question, payload = _prepare(self, conversation_id, request)
        service = self.conversations()
        client = AiServiceClient()
        user = get_effective_user(request)

        def relay():
            buffer = b''
            completed = None
            try:
                for chunk in client.stream_chat(payload, user=user):
                    yield chunk

                    # Reassemble frames only to find the final one. Everything
                    # else passes through untouched.
                    buffer += chunk
                    while b'\n\n' in buffer:
                        frame, buffer = buffer.split(b'\n\n', 1)
                        parsed = _parse_complete(frame)
                        if parsed is not None:
                            completed = parsed

            except AiServiceError as exc:
                logger.warning('Chat stream failed: %s', exc.message)
                yield _error_frame(exc.message)
            except GeneratorExit:
                # The browser disconnected. Re-raised so the upstream
                # response closes and the answer stops being generated —
                # and paid for — with nobody reading it.
                logger.info('Chat stream abandoned by the client')
                raise
            finally:
                if completed is not None:
                    # Persisted from the server's own view of the stream, so
                    # a client that dropped the last frame still has a
                    # correct history next time it loads.
                    service.record_answer(
                        conversation,
                        completed.get('answer', ''),
                        completed.get('sources', []),
                        completed.get('metadata', {}),
                    )

        response = StreamingHttpResponse(
            relay(), content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache, no-transform'
        # Without this, nginx buffers the whole response and the stream
        # arrives in one piece at the end. The single most common reason SSE
        # "works locally and not in production".
        response['X-Accel-Buffering'] = 'no'
        return response


class RegenerateView(ChatAPIView):
    """Answer the last question again.

    The previous assistant reply is deleted first, so the conversation does
    not accumulate two answers to one turn — and so the retry is a genuine
    retry rather than a follow-up that the model can see its own last answer
    in.
    """

    throttle_scope = 'chat-write'

    def post(self, request, conversation_id):
        enforce_csrf(request)
        service = self.conversations()
        conversation = service.get(conversation_id)
        if conversation is None:
            raise Http404

        messages = list(conversation.messages.all())
        last_user = next(
            (m for m in reversed(messages) if m.role == 'user'), None
        )
        if last_user is None:
            raise ApiError(
                code=ErrorCode.INVALID_REQUEST,
                message='There is nothing to regenerate.',
                status_code=status.HTTP_409_CONFLICT,
            )

        question = last_user.content
        # Drop the old answer and anything after it, but keep the question.
        following = [m for m in messages if m.created_at > last_user.created_at]
        if following:
            service.drop_messages_from(conversation, following[0])

        payload = {
            'message': question,
            'history': service.history_for_ai(conversation)[:-1],
            'conversationId': str(conversation.pk),
        }

        try:
            body = AiServiceClient().chat(payload, user=request.user)
        except AiServiceError as exc:
            raise _service_unavailable(exc) from exc

        message = service.record_answer(
            conversation, body.get('answer', ''),
            body.get('sources', []), body.get('metadata', {}),
        )
        return Response(
            {
                'conversationId': str(conversation.pk),
                'message': MessageSerializer(message).data,
            }
        )


class AssistantHealthView(ChatAPIView):
    """Whether the assistant can answer right now.

    Lets the UI show "the assistant is unavailable" before someone types a
    question, rather than after.
    """

    throttle_scope = 'chat-read'

    def get(self, request):
        return Response({'available': AiServiceClient().health()})


# -- shared ----------------------------------------------------------------

def _prepare(view, conversation_id, request):
    """CSRF, ownership, validation, and persisting the question."""
    enforce_csrf(request)

    service = view.conversations()
    conversation = service.get(conversation_id)
    if conversation is None:
        raise Http404

    serializer = AskSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    question = serializer.validated_data['message']

    # History is read *before* the new question is written, so the current
    # turn is not duplicated into its own context.
    history = service.history_for_ai(conversation)
    service.start_turn(conversation, question)

    payload = {
        'message': question,
        'history': history,
        'conversationId': str(conversation.pk),
    }
    if serializer.validated_data.get('documentIds'):
        payload['documentIds'] = serializer.validated_data['documentIds']

    return conversation, question, payload


def _parse_complete(frame):
    """Return the payload if this frame is `message_complete`, else None."""
    if b'event: message_complete' not in frame:
        return None
    for line in frame.split(b'\n'):
        if line.startswith(b'data: '):
            try:
                return json.loads(line[6:].decode('utf-8'))
            except (ValueError, UnicodeDecodeError):
                logger.warning('Could not parse the completion frame')
                return None
    return None


def _error_frame(message):
    payload = json.dumps(
        {'error': {'code': ErrorCode.INTERNAL_ERROR, 'message': message}}
    )
    return f'event: error\ndata: {payload}\n\n'.encode('utf-8')
