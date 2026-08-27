"""RetrievalService — the 'R' in RAG, and the seam the chatbot will sit on.

This is where the knowledge base ends. It takes a question, finds the
passages most likely to answer it, and returns them with their sources
attached. It does not build a prompt, call an LLM, or generate anything.

That boundary is the point. When the chatbot is built it becomes a caller of
this service:

    question → RetrievalService.search() → context + sources
                                         → prompt → LLM → answer + citations

Keeping generation out means the knowledge base can be re-indexed, re-chunked
or moved to a different embedding model without touching the chatbot, and the
chatbot can change model or prompt without touching ingestion.

`sources` is returned alongside the raw hits already de-duplicated by
document, because "which documents did this answer come from" is the question
a citation list is answering, and every caller would otherwise write the same
grouping loop.
"""

import logging
from dataclasses import dataclass

from ..config import search_config
from ..embeddings.service import EmbeddingService
from ..vector_store.base import SearchHit
from ..vector_store.service import get_vector_store

logger = logging.getLogger('jaaz.knowledge_base')


@dataclass(frozen=True)
class Source:
    document_id: str
    document_name: str
    # Best score among that document's matching chunks — the natural way to
    # order a citation list.
    score: float
    chunk_count: int


@dataclass(frozen=True)
class RetrievalResult:
    query: str
    hits: list[SearchHit]
    sources: list[Source]
    model: str

    @property
    def is_empty(self) -> bool:
        return not self.hits


class RetrievalService:
    def __init__(self, embedding_service=None, vector_store=None):
        self._embeddings = embedding_service or EmbeddingService()
        self._store = vector_store or get_vector_store()

    def search(self, query: str, *, top_k=None, document_ids=None,
               min_score=None) -> RetrievalResult:
        config = search_config()
        query = (query or '').strip()

        if not query:
            return RetrievalResult(query='', hits=[], sources=[],
                                   model=self._embeddings.model)

        # Clamp rather than reject: an out-of-range top_k from a caller is
        # not worth failing a search over, but an unbounded one is a way to
        # ask the server to serialise the entire knowledge base.
        requested = top_k or config.default_top_k
        limit = max(1, min(requested, config.max_top_k))

        # A store that owns the embedding model embeds the query itself.
        # ai_service does, and it also does the hybrid search and reranking
        # that a pre-computed dense vector could not express.
        search_text = getattr(self._store, 'search_text', None)
        if callable(search_text):
            hits = search_text(query, top_k=limit, document_ids=document_ids)
        else:
            query_vector = self._embeddings.embed_query(query)
            hits = self._store.search(
                query_vector,
                model=self._embeddings.model,
                top_k=limit,
                min_score=config.min_score if min_score is None else min_score,
                document_ids=document_ids,
            )

        logger.info(
            'Retrieval query_length=%s top_k=%s hits=%s model=%s',
            len(query),
            limit,
            len(hits),
            self._embeddings.model,
        )

        return RetrievalResult(
            query=query,
            hits=hits,
            sources=_group_sources(hits),
            model=self._embeddings.model,
        )


def _group_sources(hits):
    ordered = {}
    for hit in hits:
        source = ordered.get(hit.document_id)
        if source is None:
            ordered[hit.document_id] = {
                'name': hit.document_name,
                'score': hit.score,
                'count': 1,
            }
        else:
            source['count'] += 1
            source['score'] = max(source['score'], hit.score)

    return [
        Source(
            document_id=document_id,
            document_name=values['name'],
            score=values['score'],
            chunk_count=values['count'],
        )
        for document_id, values in sorted(
            ordered.items(), key=lambda item: item[1]['score'], reverse=True
        )
    ]
