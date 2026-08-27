"""Embedding and indexing one document's chunks.

The write half of the knowledge base. Django extracts text and splits it —
it holds the file bytes and already has a tested pipeline for that — and
hands the chunks here. This service embeds them (dense and sparse) and writes
them to Qdrant.

IDEMPOTENT BY CONSTRUCTION. Point ids are derived from
(tenant, document, chunk index), and `upsert_document` deletes the document's
existing points before writing. Running this twice for the same document
leaves exactly one copy; running it after a re-chunk that produced fewer
pieces leaves no orphaned tail still answering queries.

BOUNDED CONCURRENCY. A semaphore caps how many documents are embedded at
once. Without it, ten simultaneous uploads of a large PDF would issue
hundreds of parallel inference calls — enough to hit a rate limit with the
hosted provider, or to exhaust memory with the local one. The limit is on
documents rather than chunks because the embedding service already batches
chunks internally.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from app.core.logging import Stopwatch, get_logger
from app.modules.embeddings.service import EmbeddingService
from app.modules.vector_store.base import VectorStore
from app.shared.types import DocumentIndexRequest

logger = get_logger(__name__)

DEFAULT_MAX_CONCURRENT_DOCUMENTS = 2


@dataclass(frozen=True)
class IndexResult:
    document_id: str
    indexed_chunks: int
    embedding_model: str
    dimensions: int
    embedding_ms: int
    index_ms: int


class IndexingService:
    def __init__(
        self,
        embeddings: EmbeddingService,
        vector_store: VectorStore,
        *,
        max_concurrent_documents: int = DEFAULT_MAX_CONCURRENT_DOCUMENTS,
    ) -> None:
        self._embeddings = embeddings
        self._store = vector_store
        self._gate = asyncio.Semaphore(max(1, max_concurrent_documents))

    async def index_document(self, request: DocumentIndexRequest) -> IndexResult:
        async with self._gate:
            return await self._index(request)

    async def _index(self, request: DocumentIndexRequest) -> IndexResult:
        logger.info(
            "Indexing started",
            extra={"document_id": request.document_id,
                   "tenant_id": request.tenant_id,
                   "chunks": len(request.chunks)},
        )

        with Stopwatch() as embedding_timer:
            encoded = await self._embeddings.encode_chunks(
                [chunk.content for chunk in request.chunks]
            )

        with Stopwatch() as index_timer:
            written = await self._store.upsert_document(
                request, encoded.dense, encoded.sparse
            )

        logger.info(
            "Indexing complete",
            extra={"document_id": request.document_id,
                   "chunks": written,
                   "embedding_model": encoded.model,
                   "embedding_ms": embedding_timer.milliseconds,
                   "index_ms": index_timer.milliseconds},
        )

        return IndexResult(
            document_id=request.document_id,
            indexed_chunks=written,
            embedding_model=encoded.model,
            dimensions=encoded.dimensions,
            embedding_ms=embedding_timer.milliseconds,
            index_ms=index_timer.milliseconds,
        )

    async def delete_document(self, tenant_id: str, document_id: str) -> None:
        await self._store.delete_document(tenant_id, document_id)
