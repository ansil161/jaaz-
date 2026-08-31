"""Knowledge-base endpoints, called by Django's ingestion worker.

Not by a browser. These write to the vector store and are reachable only with
the service token.

WHY INDEXING IS SYNCHRONOUS HERE. The brief asks for a queue in front of
this. There already is one: Django's `process_documents` worker claims
documents with `SELECT … FOR UPDATE SKIP LOCKED`, extracts and chunks them,
and calls this endpoint. The user's HTTP request ended long before that. A
second queue behind the first would add a status-tracking problem — Django
could no longer tell a document it had marked READY from one still waiting in
this service's queue — for no latency the user experiences. See the README,
"Why one queue and not two".

Bulk work that genuinely needs a worker of its own — re-embedding the whole
collection after a model change — is `app/workers/jobs/reindex.py`.
"""

from __future__ import annotations

from fastapi import APIRouter, status

from app.api.dependencies import IndexCallerDep, ResourcesDep
from app.core.logging import bind_context, get_logger
from app.modules.indexing.schemas import (
    DeleteDocumentResponse,
    IndexDocumentRequest,
    IndexDocumentResponse,
)
from app.shared.types import ChunkMetadata, DocumentChunkInput, DocumentIndexRequest

logger = get_logger(__name__)

router = APIRouter(prefix="/knowledge-base", tags=["knowledge-base"])


@router.post(
    "/documents",
    response_model=IndexDocumentResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_200_OK,
)
async def index_document(
    payload: IndexDocumentRequest,
    caller: IndexCallerDep,
    resources: ResourcesDep,
) -> IndexDocumentResponse:
    """Embed and index a document's chunks, replacing anything stored for it."""
    bind_context(document_id=payload.document_id, tenant_id=caller.tenant_id)

    request = DocumentIndexRequest(
        # From the authenticated caller, never the body. A client cannot
        # write into another tenant's collection by asking to.
        tenant_id=caller.tenant_id,
        document_id=payload.document_id,
        document_name=payload.document_name,
        document_type=payload.document_type,
        knowledge_base_id=payload.knowledge_base_id,
        language=payload.language,
        chunks=[
            DocumentChunkInput(
                chunk_id=chunk.chunk_id,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                token_count=chunk.token_count,
                metadata=ChunkMetadata.model_validate(chunk.metadata or {}),
            )
            for chunk in payload.chunks
        ],
    )

    result = await resources.indexing.index_document(request)

    return IndexDocumentResponse(
        documentId=result.document_id,
        indexedChunks=result.indexed_chunks,
        embeddingModel=result.embedding_model,
        dimensions=result.dimensions,
    )


@router.delete(
    "/documents/{document_id}",
    response_model=DeleteDocumentResponse,
    response_model_by_alias=True,
)
async def delete_document(
    document_id: str, caller: IndexCallerDep, resources: ResourcesDep
) -> DeleteDocumentResponse:
    """Remove a document from the index.

    Idempotent: deleting something already gone succeeds. Django calls this
    when a document is deleted, and a delete that failed because the vectors
    were already absent would leave the two stores permanently disagreeing.
    """
    bind_context(document_id=document_id, tenant_id=caller.tenant_id)
    await resources.indexing.delete_document(caller.tenant_id, document_id)
    return DeleteDocumentResponse(documentId=document_id, deleted=True)
