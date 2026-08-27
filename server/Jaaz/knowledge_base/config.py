"""Typed views onto `settings.KNOWLEDGE_BASE`.

The pipeline reads its numbers through these rather than indexing a settings
dict at each call site. Two reasons: a typo in a dict key is a KeyError at
the worst possible moment, and a chunker that takes a `ChunkingConfig` can be
unit-tested with a value instead of `override_settings`.

Built fresh on each call. They are three attribute reads, and caching them
would make `override_settings` silently ineffective in tests.
"""

from dataclasses import dataclass

from django.conf import settings


@dataclass(frozen=True)
class UploadConfig:
    max_bytes: int
    min_bytes: int


@dataclass(frozen=True)
class ChunkingConfig:
    size: int
    overlap: int
    minimum: int
    maximum: int

    def __post_init__(self):
        # A misconfiguration here does not fail loudly at ingest time — it
        # quietly produces chunks that are useless to retrieve, or a chunker
        # that never advances. Catch it when the config is built.
        if self.size <= 0:
            raise ValueError('RAG_CHUNK_SIZE must be positive.')
        if self.overlap >= self.size:
            raise ValueError('RAG_CHUNK_OVERLAP must be smaller than RAG_CHUNK_SIZE.')
        if self.maximum < self.size:
            raise ValueError('RAG_MAX_CHUNK_SIZE must be at least RAG_CHUNK_SIZE.')
        if self.minimum > self.size:
            raise ValueError('RAG_MIN_CHUNK_SIZE must not exceed RAG_CHUNK_SIZE.')


@dataclass(frozen=True)
class EmbeddingConfig:
    provider: str
    model: str
    api_key: str | None
    api_base: str
    dimensions: int | None
    batch_size: int
    timeout: int
    max_retries: int


@dataclass(frozen=True)
class SearchConfig:
    default_top_k: int
    max_top_k: int
    min_score: float


@dataclass(frozen=True)
class ProcessingConfig:
    dispatch: str
    poll_seconds: int
    stale_after_minutes: int
    max_attempts: int


def _settings():
    return settings.KNOWLEDGE_BASE


def upload_config() -> UploadConfig:
    values = _settings()
    return UploadConfig(
        max_bytes=values['MAX_DOCUMENT_SIZE'],
        min_bytes=values['MIN_DOCUMENT_SIZE'],
    )


def chunking_config() -> ChunkingConfig:
    values = _settings()
    return ChunkingConfig(
        size=values['CHUNK_SIZE'],
        overlap=values['CHUNK_OVERLAP'],
        minimum=values['MIN_CHUNK_SIZE'],
        maximum=values['MAX_CHUNK_SIZE'],
    )


def embedding_config() -> EmbeddingConfig:
    values = _settings()
    return EmbeddingConfig(
        provider=values['EMBEDDING_PROVIDER'],
        model=values['EMBEDDING_MODEL'],
        api_key=values['EMBEDDING_API_KEY'],
        api_base=values['EMBEDDING_API_BASE'].rstrip('/'),
        dimensions=values['EMBEDDING_DIMENSIONS'],
        batch_size=values['EMBEDDING_BATCH_SIZE'],
        timeout=values['EMBEDDING_TIMEOUT'],
        max_retries=values['EMBEDDING_MAX_RETRIES'],
    )


def search_config() -> SearchConfig:
    values = _settings()
    return SearchConfig(
        default_top_k=values['SEARCH_TOP_K'],
        max_top_k=values['SEARCH_MAX_TOP_K'],
        min_score=values['SEARCH_MIN_SCORE'],
    )


def processing_config() -> ProcessingConfig:
    values = _settings()
    return ProcessingConfig(
        dispatch=values['TASK_DISPATCH'],
        poll_seconds=values['WORKER_POLL_SECONDS'],
        stale_after_minutes=values['STALE_PROCESSING_MINUTES'],
        max_attempts=values['MAX_PROCESSING_ATTEMPTS'],
    )


def vector_store_name() -> str:
    return _settings()['VECTOR_STORE']
