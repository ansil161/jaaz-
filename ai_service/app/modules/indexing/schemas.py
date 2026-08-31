"""Wire contracts for the knowledge-base endpoints.

Sent by Django's ingestion worker, never by a browser. camelCase on the way
in and out, matching the rest of the product's API.

These live beside the indexing service rather than with the chat schemas:
Django extracts and chunks — it owns the file bytes and already has a tested
pipeline for it — and this module embeds and indexes what it sends.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class IndexChunkIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    chunk_id: str = Field(alias="chunkId")
    chunk_index: int = Field(alias="chunkIndex")
    content: str
    token_count: int = Field(default=0, alias="tokenCount")
    metadata: dict[str, Any] = Field(default_factory=dict)


class IndexDocumentRequest(BaseModel):
    """What Django's knowledge-base worker sends after chunking a document.

    Django extracts and chunks — it owns the file bytes and already has a
    tested pipeline for it. This service embeds and indexes.
    """

    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="documentId")
    document_name: str = Field(alias="documentName")
    document_type: str = Field(default="", alias="documentType")
    knowledge_base_id: str = Field(default="default", alias="knowledgeBaseId")
    language: str = "en"
    chunks: list[IndexChunkIn] = Field(min_length=1, max_length=5_000)


class IndexDocumentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="documentId")
    indexed_chunks: int = Field(alias="indexedChunks")
    embedding_model: str = Field(alias="embeddingModel")
    dimensions: int


class DeleteDocumentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="documentId")
    deleted: bool = True
