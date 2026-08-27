"""Retrieval inputs and outputs.

`RetrievalResult` carries the stage counts as well as the chunks. They are
what makes a bad answer diagnosable: "dense 30, sparse 0, fused 30, reranked
6" says the lexical half found nothing, which is a completely different
problem from "dense 0, sparse 30".
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.modules.vector_store.filters import SearchFilter
from app.shared.types import RetrievedChunk


@dataclass(frozen=True)
class RetrievalQuery:
    text: str
    filters: SearchFilter
    # None → fall back to the configured defaults. Present so an evaluation
    # run can sweep the parameters without mutating global settings.
    dense_top_k: int | None = None
    sparse_top_k: int | None = None
    rerank_top_k: int | None = None
    final_k: int | None = None


@dataclass
class RetrievalResult:
    chunks: list[RetrievedChunk] = field(default_factory=list)

    dense_count: int = 0
    sparse_count: int = 0
    fused_count: int = 0
    reranked_count: int = 0

    retrieval_ms: int = 0
    rerank_ms: int = 0

    @property
    def is_empty(self) -> bool:
        return not self.chunks

    def as_log_fields(self) -> dict[str, int]:
        return {
            "dense_count": self.dense_count,
            "sparse_count": self.sparse_count,
            "fused_count": self.fused_count,
            "reranked_count": self.reranked_count,
            "final_count": len(self.chunks),
            "retrieval_ms": self.retrieval_ms,
            "rerank_ms": self.rerank_ms,
        }
