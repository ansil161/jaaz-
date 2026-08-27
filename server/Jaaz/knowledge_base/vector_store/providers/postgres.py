"""Vectors in Postgres, without a vector extension.

WHY THIS EXISTS IN THIS FORM
----------------------------
`pgvector` is the right answer and is not installed on the target database
(PostgreSQL 18.3, which offers only pg_trgm and uuid-ossp). Installing a
server extension is a database-administration change, not an application
change, and is not something this codebase should do on someone's behalf.

So embeddings are stored in a native `double precision[]` column and search
is an exact scan: every candidate vector is compared to the query and the
best `top_k` are kept.

WHAT THAT COSTS
---------------
Exact search is O(number of chunks). It is genuinely fine into the low tens
of thousands of chunks — a few hundred documents — and it has one real
advantage over an approximate index: recall is perfect, so retrieval quality
here is a property of the embedding model alone.

Beyond that it will not hold, and the fix is pgvector, not tuning this. That
migration is: `CREATE EXTENSION vector`, add a `vector(N)` column alongside
`embedding`, backfill it, add an HNSW index, and write a second provider
implementing the same three methods. No caller changes, because no caller
knows how similarity is computed.

WHY THE MATH IS A DOT PRODUCT
-----------------------------
Every vector is L2-normalised by EmbeddingService before it arrives, so
cosine similarity reduces to a dot product and neither this module nor the
database ever computes a magnitude.
"""

import logging

from django.db import transaction

from ...models import Document, DocumentChunk, DocumentStatus
from ..base import SearchHit

logger = logging.getLogger('jaaz.knowledge_base')

# How many rows to pull per round trip during a scan. Large enough to keep
# the query count low, small enough that a big knowledge base does not
# materialise in memory at once.
_SCAN_BATCH = 500


def _dot(left, right):
    return sum(a * b for a, b in zip(left, right))


class PostgresVectorStore:
    name = 'postgres'

    # -- writes ---------------------------------------------------------

    @transaction.atomic
    def upsert_document_chunks(self, document, chunks, vectors, *, model,
                               dimensions) -> int:
        """Replace every chunk this document has with the ones supplied.

        Delete-then-insert inside one transaction, rather than matching up
        rows by index. A re-processed document can legitimately produce a
        different number of chunks — the chunker's configuration may have
        changed, or the file may have been re-uploaded — and an update-in-
        place would leave the tail of the previous run behind, still
        embedded, still retrievable, still citing a document that no longer
        says that.
        """
        if len(chunks) != len(vectors):
            raise ValueError('Each chunk must have exactly one vector.')

        DocumentChunk.objects.filter(document=document).delete()

        rows = [
            DocumentChunk(
                document=document,
                chunk_index=chunk.index,
                content=chunk.content,
                token_count=chunk.token_count,
                embedding=vector,
                embedding_model=model,
                embedding_dimensions=dimensions,
                metadata=chunk.metadata,
            )
            for chunk, vector in zip(chunks, vectors)
        ]
        DocumentChunk.objects.bulk_create(rows, batch_size=200)
        return len(rows)

    @transaction.atomic
    def delete_document(self, document_id) -> int:
        deleted, _ = DocumentChunk.objects.filter(document_id=document_id).delete()
        return deleted

    # -- reads ----------------------------------------------------------

    def search(self, query_vector, *, model, top_k, min_score=0.0,
               document_ids=None) -> list[SearchHit]:
        if not query_vector or top_k <= 0:
            return []

        queryset = (
            DocumentChunk.objects
            # Only from documents that finished processing. A chunk from a
            # document mid-reprocess is about to be deleted, and returning it
            # would cite a state that no longer exists.
            .filter(
                document__status=DocumentStatus.READY,
                embedding__isnull=False,
                # Same model, same coordinate space. Chunks embedded by a
                # previous model are invisible until re-processed.
                embedding_model=model,
                embedding_dimensions=len(query_vector),
            )
            .select_related('document')
            .only(
                'id',
                'chunk_index',
                'content',
                'embedding',
                'metadata',
                'document__id',
                'document__name',
            )
        )

        if document_ids:
            queryset = queryset.filter(document_id__in=document_ids)

        scored = []
        scanned = 0
        for chunk in queryset.iterator(chunk_size=_SCAN_BATCH):
            scanned += 1
            score = _dot(query_vector, chunk.embedding)
            if score < min_score:
                continue
            scored.append((score, chunk))

        # Sorting the survivors rather than keeping a heap: at this scale the
        # scan dominates, and a plain sort is easier to be sure is correct.
        scored.sort(key=lambda pair: pair[0], reverse=True)

        logger.debug(
            'Vector search scanned %s chunks, %s above threshold, returning %s',
            scanned,
            len(scored),
            min(top_k, len(scored)),
        )

        return [
            SearchHit(
                chunk_id=str(chunk.id),
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                score=round(float(score), 6),
                document_id=str(chunk.document_id),
                document_name=chunk.document.name,
                metadata=chunk.metadata or {},
            )
            for score, chunk in scored[:top_k]
        ]

    # -- housekeeping ---------------------------------------------------

    @staticmethod
    def stats():
        return {
            'documents': Document.objects.filter(status=DocumentStatus.READY).count(),
            'chunks': DocumentChunk.objects.filter(embedding__isnull=False).count(),
        }
