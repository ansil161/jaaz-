"""The HTTP client for ai_service.

Django's half of the trust boundary. It holds one shared token and sends the
authenticated user's identity alongside every request — that identity is what
ai_service turns into Qdrant filters, so it is the thing standing between one
tenant and another's documents. It comes from `request.user`, never from
anything the browser sent.

Streaming passes through untouched. Django does not parse the SSE frames, buffer
them, or re-encode them: it reads bytes from ai_service and writes them to the
browser. Parsing would mean a second implementation of the event protocol to
keep in step, and buffering would defeat the point of streaming.
"""

import logging

import requests
from django.conf import settings

logger = logging.getLogger('jaaz.chat')


class AiServiceError(Exception):
    """ai_service was unreachable or refused the request."""

    def __init__(self, message='The assistant is unavailable. Please try again.'):
        super().__init__(message)
        self.message = message


class AiServiceClient:
    def __init__(self, session=None):
        config = settings.AI_SERVICE
        self._base_url = config['URL'].rstrip('/')
        self._token = config['TOKEN']
        self._tenant_id = config['TENANT_ID']
        self._timeout = config['TIMEOUT_SECONDS']
        self._stream_timeout = config['STREAM_TIMEOUT_SECONDS']
        self._session = session or requests.Session()

    # -- public ----------------------------------------------------------

    def chat(self, payload, *, user):
        """A complete answer."""
        response = self._post('/api/v1/chat', payload, user=user,
                              timeout=self._timeout)
        return response.json()

    def stream_chat(self, payload, *, user):
        """Yield raw SSE bytes from ai_service, unmodified.

        `stream=True` plus `iter_content` means Django holds one chunk at a
        time rather than the whole answer. Closing the generator — which
        happens when the browser disconnects — closes this response too, so a
        cancelled answer stops being generated and stops being billed.
        """
        try:
            response = self._session.post(
                f'{self._base_url}/api/v1/chat/stream',
                json=payload,
                headers=self._headers(user),
                stream=True,
                timeout=self._stream_timeout,
            )
        except requests.RequestException as exc:
            logger.warning('ai_service stream could not be opened: %s',
                           type(exc).__name__)
            raise AiServiceError() from exc

        if response.status_code >= 400:
            detail = response.text[:500]
            response.close()
            logger.error('ai_service refused a stream (%s): %s',
                         response.status_code, detail)
            raise AiServiceError()

        try:
            # decode_unicode=False: these are already UTF-8 bytes in the SSE
            # framing ai_service produced. Decoding and re-encoding risks
            # splitting a multi-byte character across two chunks.
            for chunk in response.iter_content(chunk_size=None):
                if chunk:
                    yield chunk
        except requests.RequestException as exc:
            logger.warning('ai_service stream interrupted: %s',
                           type(exc).__name__)
            raise AiServiceError() from exc
        finally:
            response.close()

    def health(self):
        try:
            response = self._session.get(
                f'{self._base_url}/health/ready', timeout=5
            )
            return response.status_code == 200
        except requests.RequestException:
            return False

    # -- internals -------------------------------------------------------

    def _headers(self, user):
        return {
            'Authorization': f'Bearer {self._token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            # The identity ai_service trusts, because the token proved this
            # request came from the backend that authenticated it.
            'X-Jaaz-User-Id': str(user.pk),
            'X-Jaaz-Tenant-Id': self._tenant_id,
            'X-Jaaz-Is-Admin': 'true' if user.is_staff else 'false',
        }

    def _post(self, path, payload, *, user, timeout):
        try:
            response = self._session.post(
                f'{self._base_url}{path}', json=payload,
                headers=self._headers(user), timeout=timeout,
            )
        except requests.RequestException as exc:
            logger.warning('ai_service request failed: %s', type(exc).__name__)
            raise AiServiceError() from exc

        if response.status_code >= 400:
            # The body can echo the question. Logged, never re-raised.
            logger.error('ai_service rejected %s (%s): %s',
                         path, response.status_code, response.text[:500])
            raise AiServiceError()

        return response
