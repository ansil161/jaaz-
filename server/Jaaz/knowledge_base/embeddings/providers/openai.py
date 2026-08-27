"""OpenAI-compatible embedding provider.

Speaks the `POST /embeddings` shape, so it also serves Azure OpenAI, Together,
vLLM, Ollama's compatibility endpoint and anything else that implements it —
point EMBEDDING_API_BASE at the host and set the model name.

Uses `urllib` from the standard library rather than adding an HTTP client.
The request is one POST with a JSON body; a dependency would buy nothing but
a smaller retry loop.

The API key is read from configuration, sent in one header, and never
logged, echoed in an exception, or returned by any endpoint.
"""

import json
import logging
import time
import urllib.error
import urllib.request

from ..base import EmbeddingError

logger = logging.getLogger('jaaz.knowledge_base')

DEFAULT_MODEL = 'text-embedding-3-small'

# Worth waiting out: rate limits, timeouts, and transient upstream failures.
_RETRYABLE_STATUS = frozenset({408, 409, 425, 429, 500, 502, 503, 504})


class OpenAIEmbeddingProvider:
    name = 'openai'

    def __init__(self, *, api_key, api_base, model=None, dimensions=None,
                 timeout=30, max_retries=3):
        if not api_key:
            # Fail at construction, not at the first document. A missing key
            # is a deployment mistake and should surface when the process
            # starts processing, with a message that says which variable.
            raise EmbeddingError(
                'The embedding provider is not configured. Set EMBEDDING_API_KEY.',
                retryable=False,
            )
        self._api_key = api_key
        self._api_base = api_base.rstrip('/')
        self._timeout = timeout
        self._max_retries = max_retries
        self.model = model or DEFAULT_MODEL
        # text-embedding-3-* accept a `dimensions` parameter; when it is not
        # set the provider's native width is used and is learned from the
        # first response.
        self._requested_dimensions = dimensions
        self.dimensions = dimensions or 0

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        payload = {'model': self.model, 'input': texts}
        if self._requested_dimensions:
            payload['dimensions'] = self._requested_dimensions

        body = self._post('/embeddings', payload)
        vectors = self._read_vectors(body, expected=len(texts))

        if not self.dimensions:
            self.dimensions = len(vectors[0])
        return vectors

    # -- internals ------------------------------------------------------

    def _read_vectors(self, body, expected):
        try:
            entries = body['data']
        except (KeyError, TypeError) as exc:
            raise EmbeddingError(
                'The embedding service returned an unexpected response.',
                retryable=True,
            ) from exc

        if len(entries) != expected:
            raise EmbeddingError(
                'The embedding service returned an incomplete response.',
                retryable=True,
            )

        # The API documents `index` on each entry; sorting by it rather than
        # trusting array order is what guarantees a vector stays attached to
        # the chunk it was produced from.
        try:
            ordered = sorted(entries, key=lambda entry: entry['index'])
            vectors = [entry['embedding'] for entry in ordered]
        except (KeyError, TypeError) as exc:
            raise EmbeddingError(
                'The embedding service returned an unexpected response.',
                retryable=True,
            ) from exc

        widths = {len(vector) for vector in vectors}
        if len(widths) != 1:
            raise EmbeddingError(
                'The embedding service returned vectors of inconsistent size.',
                retryable=False,
            )
        return vectors

    def _post(self, path, payload):
        request = urllib.request.Request(
            f'{self._api_base}{path}',
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self._api_key}',
            },
            method='POST',
        )

        last_error = None
        for attempt in range(1, self._max_retries + 1):
            try:
                with urllib.request.urlopen(request, timeout=self._timeout) as response:
                    return json.loads(response.read().decode('utf-8'))

            except urllib.error.HTTPError as exc:
                # exc.read() is the provider's error body. It can quote the
                # request, so it is logged and never surfaced.
                detail = exc.read(2048).decode('utf-8', 'replace')
                logger.warning(
                    'Embedding request failed with HTTP %s (attempt %s/%s): %s',
                    exc.code,
                    attempt,
                    self._max_retries,
                    detail,
                )
                if exc.code not in _RETRYABLE_STATUS:
                    raise EmbeddingError(
                        self._message_for(exc.code), retryable=False
                    ) from exc
                last_error = exc

            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
                logger.warning(
                    'Embedding request failed (attempt %s/%s): %s',
                    attempt,
                    self._max_retries,
                    exc.__class__.__name__,
                )
                last_error = exc

            if attempt < self._max_retries:
                # Exponential backoff. A rate limit that is retried
                # immediately is a rate limit that stays hit.
                time.sleep(min(2 ** attempt, 10))

        raise EmbeddingError(
            'The embedding service is not responding. Retry the document shortly.',
            retryable=True,
        ) from last_error

    @staticmethod
    def _message_for(status):
        if status in (401, 403):
            return 'The embedding service rejected our credentials.'
        if status == 404:
            return 'The configured embedding model was not found.'
        if status == 400:
            return 'The embedding service rejected the request.'
        return 'The embedding service returned an error.'
