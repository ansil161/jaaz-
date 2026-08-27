"""The vector store contract.

Three operations, because that is all a knowledge base needs: write a
document's vectors, remove them, and find the nearest ones to a query.

A search hit carries its source with it — document id, document name, chunk
index. That is not convenience, it is the requirement: a retrieved passage
that cannot say where it came from cannot be cited, and an answer built from
uncitable passages is indistinguishable from one that was invented.
"""

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class SearchHit:
    chunk_id: str
    chunk_index: int
    content: str
    score: float

    # Everything below is the citation.
    document_id: str
    document_name: str
    metadata: dict = field(default_factory=dict)


class VectorStore(Protocol):
    name: str

    def upsert_document_chunks(self, document, chunks, vectors, *, model,
                               dimensions) -> int:
        """Replace this document's stored vectors with these.

        Replace, not append. Re-processing a document must never leave the
        previous run's chunks alongside the new ones — see the processor for
        why that is the whole of the idempotency story.
        """
        ...

    def delete_document(self, document_id) -> int: ...

    def search(self, query_vector, *, model, top_k, min_score=0.0,
               document_ids=None) -> list[SearchHit]:
        """Nearest chunks to the query vector, best first.

        `model` is mandatory and is a filter, not a label: vectors produced
        by different models are not comparable, and silently ranking across
        both returns results that look plausible and are meaningless.
        """
        ...
