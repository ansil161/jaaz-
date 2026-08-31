"""Wire types used by more than one API surface.

`shared/types.py` holds the domain nouns; this holds their camelCase
projections for the ones that appear in more than one response. A wire type
used by exactly one endpoint stays with that endpoint's module — this file is
for the ones that would otherwise force one module to import another's
schemas.

`SourceOut` is the case that forced it: a citation is returned by both the
chat endpoints and the retrieval endpoint, and `retrieval` importing it from
`chat` is precisely the coupling `shared/` exists to prevent.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from .types import Source


# A citation, as the frontend renders it. Documented as a comment rather
# than a docstring: pydantic publishes a model's docstring as the OpenAPI
# schema description, and this one is part of a contract Django consumes.
class SourceOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="documentId")
    document_name: str = Field(alias="documentName")
    chunk_id: str = Field(alias="chunkId")
    chunk_index: int = Field(alias="chunkIndex")
    page: int | None = None
    pages: list[int] = Field(default_factory=list)
    heading: str | None = None
    citation_number: int = Field(alias="citationNumber")
    score: float
    excerpt: str

    @classmethod
    def of(cls, source: Source) -> SourceOut:
        # Built field by field rather than `model_validate(source.model_dump())`:
        # the domain type uses snake_case and this one is alias-first, and
        # relying on pydantic to bridge the two silently depends on validation
        # flags that changed between minor versions.
        return cls(
            documentId=source.document_id,
            documentName=source.document_name,
            chunkId=source.chunk_id,
            chunkIndex=source.chunk_index,
            page=source.page,
            pages=list(source.pages),
            heading=source.heading,
            citationNumber=source.citation_number,
            score=source.score,
            excerpt=source.excerpt,
        )
