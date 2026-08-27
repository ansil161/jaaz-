"""EmbeddingService — the only thing the pipeline calls to get vectors.

Owns the three concerns that are the same whichever provider is underneath:

  * batching, so one document does not become four hundred HTTP requests;
  * L2 normalisation, so cosine similarity is a dot product everywhere
    downstream and the vector store never has to divide by a magnitude;
  * recording which model produced the vectors, because vectors from
    different models occupy different spaces and comparing them returns
    confident nonsense.

The provider is chosen by name from configuration. Adding one is a class
implementing EmbeddingProvider and an entry in `_build_provider`.
"""

import logging
import math
from dataclasses import dataclass

from ..config import EmbeddingConfig, embedding_config
from .base import EmbeddingError
from .providers.hashing import HashingEmbeddingProvider
from .providers.openai import OpenAIEmbeddingProvider

logger = logging.getLogger('jaaz.knowledge_base')

_DEFAULT_HASHING_DIMENSIONS = 256


@dataclass(frozen=True)
class EmbeddingBatch:
    vectors: list[list[float]]
    model: str
    dimensions: int


def _build_provider(config: EmbeddingConfig):
    if config.provider == 'hashing':
        return HashingEmbeddingProvider(
            dimensions=config.dimensions or _DEFAULT_HASHING_DIMENSIONS
        )

    if config.provider == 'openai':
        return OpenAIEmbeddingProvider(
            api_key=config.api_key,
            api_base=config.api_base,
            model=config.model or None,
            dimensions=config.dimensions,
            timeout=config.timeout,
            max_retries=config.max_retries,
        )

    raise EmbeddingError(
        f'Unknown embedding provider {config.provider!r}.', retryable=False
    )


class EmbeddingService:
    def __init__(self, provider=None, config: EmbeddingConfig | None = None):
        self._config = config or embedding_config()
        # Injectable so tests can pass a fake and never reach a network.
        self._provider = provider or _build_provider(self._config)

    @property
    def provider_name(self) -> str:
        return self._provider.name

    @property
    def model(self) -> str:
        return self._provider.model

    @property
    def dimensions(self) -> int:
        return self._provider.dimensions

    def embed_documents(self, texts: list[str]) -> EmbeddingBatch:
        """Embed chunk texts, in order.

        The returned vectors correspond positionally to `texts`. Callers zip
        the two together to attach each vector to its chunk, so a provider
        that lost or reordered results would mis-attribute citations — which
        is why the count is checked here as well as in the provider.
        """
        if not texts:
            return EmbeddingBatch([], self._provider.model, self._provider.dimensions)

        vectors = []
        batch_size = max(1, self._config.batch_size)

        for start in range(0, len(texts), batch_size):
            batch = texts[start:start + batch_size]
            produced = self._provider.embed_batch(batch)
            if len(produced) != len(batch):
                raise EmbeddingError(
                    'The embedding service returned an incomplete response.',
                    retryable=True,
                )
            vectors.extend(_normalize(vector) for vector in produced)

        dimensions = len(vectors[0])
        if any(len(vector) != dimensions for vector in vectors):
            raise EmbeddingError(
                'The embedding service returned vectors of inconsistent size.',
                retryable=False,
            )

        return EmbeddingBatch(
            vectors=vectors, model=self._provider.model, dimensions=dimensions
        )

    def embed_query(self, text: str) -> list[float]:
        """Embed a search query.

        Separate from `embed_documents` because it is one string and because
        some providers want a different prefix or instruction for queries
        than for passages. Keeping the call sites distinct means adding that
        later does not require finding every caller.
        """
        batch = self.embed_documents([text])
        if not batch.vectors:
            raise EmbeddingError('The query is empty.', retryable=False)
        return batch.vectors[0]


def _normalize(vector):
    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0.0:
        return list(vector)
    return [value / magnitude for value in vector]
