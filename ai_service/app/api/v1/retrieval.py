"""Retrieval without generation.

The query half of RAG, exposed on its own. Two callers want it:

  * the admin console's knowledge-base search, which existed before the
    chatbot and should keep working now that vectors live in Qdrant rather
    than Postgres;
  * anyone tuning retrieval, who needs to see what the pipeline would hand a
    model without paying for a completion to find out.

No LLM is involved. That is the point — it isolates retrieval quality from
generation quality, which are two different problems with two different
fixes.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from app.api.dependencies import ChatCallerDep, ResourcesDep
from app.modules.chat.schemas import SourceOut
from app.modules.rag import citations
from app.modules.retrieval.models import RetrievalQuery
from app.modules.vector_store.filters import SearchFilter

router = APIRouter(prefix="/retrieval", tags=["retrieval"])


class SearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    query: str = Field(min_length=1, max_length=2_000)
    top_k: int | None = Field(default=None, ge=1, le=50, alias="topK")
    document_ids: list[str] | None = Field(default=None, alias="documentIds")
    knowledge_base_id: str | None = Field(default=None, alias="knowledgeBaseId")


class SearchStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    dense_count: int = Field(alias="denseCount")
    sparse_count: int = Field(alias="sparseCount")
    fused_count: int = Field(alias="fusedCount")
    final_count: int = Field(alias="finalCount")
    retrieval_ms: int = Field(alias="retrievalMs")
    rerank_ms: int = Field(alias="rerankMs")


class SearchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    query: str
    model: str
    hits: list[SourceOut]
    stats: SearchStats


@router.post("/search", response_model=SearchResponse, response_model_by_alias=True)
async def search(
    payload: SearchRequest, caller: ChatCallerDep, resources: ResourcesDep
) -> SearchResponse:
    filters = SearchFilter.for_caller(
        caller,
        knowledge_base_id=payload.knowledge_base_id,
        document_ids=tuple(payload.document_ids) if payload.document_ids else None,
    )

    result = await resources.retrieval.retrieve(
        RetrievalQuery(text=payload.query, filters=filters, final_k=payload.top_k)
    )

    return SearchResponse(
        query=payload.query,
        model=resources.embeddings.model,
        hits=[
            SourceOut.of(source)
            for source in citations.provisional_sources(result.chunks)
        ],
        stats=SearchStats(
            denseCount=result.dense_count,
            sparseCount=result.sparse_count,
            fusedCount=result.fused_count,
            finalCount=len(result.chunks),
            retrievalMs=result.retrieval_ms,
            rerankMs=result.rerank_ms,
        ),
    )
