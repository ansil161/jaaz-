"""Who is allowed to see which vectors.

This is the data-isolation boundary, and it is deliberately the only way to
express a query filter. `SearchFilter.for_caller` is built from the identity
Django vouched for; nothing constructs one from a request body, so a client
cannot widen its own scope by sending a different tenant.

`tenant_id` is always applied. It is not optional, not defaulted to a
wildcard, and not skippable — the failure mode of a missing tenant filter is
one customer reading another's documents, which is the worst thing this
service could do.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.core.security import CallerIdentity


@dataclass(frozen=True)
class SearchFilter:
    """Metadata constraints applied to every Qdrant query."""

    tenant_id: str
    knowledge_base_id: str | None = None
    # None means "any document this tenant owns". An empty tuple means
    # "no documents at all" and is honoured as such — an empty allow-list is
    # a real answer, not a missing one.
    document_ids: tuple[str, ...] | None = None
    document_types: tuple[str, ...] = ()
    language: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def for_caller(
        cls,
        caller: CallerIdentity,
        *,
        knowledge_base_id: str | None = None,
        document_ids: tuple[str, ...] | None = None,
        document_types: tuple[str, ...] = (),
    ) -> SearchFilter:
        """Build the filter for an authenticated caller.

        A `document_ids` argument from the request narrows the caller's own
        allow-list; it can never widen it. The intersection is taken rather
        than the union, so a client asking for a document it may not see
        gets nothing instead of an error that confirms the document exists.
        """
        allowed = caller.allowed_document_ids

        if document_ids is None:
            effective = allowed
        elif allowed is None:
            effective = tuple(document_ids)
        else:
            effective = tuple(
                document for document in document_ids if document in set(allowed)
            )

        return cls(
            tenant_id=caller.tenant_id,
            knowledge_base_id=knowledge_base_id,
            document_ids=effective,
            document_types=tuple(document_types),
        )

    @property
    def matches_nothing(self) -> bool:
        """True when the filter can only ever return an empty result.

        Checked before a query is issued: an empty allow-list is a round trip
        whose answer is already known.
        """
        return self.document_ids is not None and len(self.document_ids) == 0


# Payload keys. Written once here so the indexer and the searcher cannot
# disagree about a field name — a mismatch would silently return nothing.
class PayloadField:
    TENANT_ID = "tenant_id"
    KNOWLEDGE_BASE_ID = "knowledge_base_id"
    DOCUMENT_ID = "document_id"
    DOCUMENT_NAME = "document_name"
    DOCUMENT_TYPE = "document_type"
    LANGUAGE = "language"
    CHUNK_ID = "chunk_id"
    CHUNK_INDEX = "chunk_index"
    CONTENT = "content"
    TOKEN_COUNT = "token_count"  # noqa: S105 — a payload field name
    METADATA = "metadata"


# Fields Qdrant should index for filtering. Without a payload index, a filter
# is a linear scan of the collection on every query.
INDEXED_KEYWORD_FIELDS = (
    PayloadField.TENANT_ID,
    PayloadField.KNOWLEDGE_BASE_ID,
    PayloadField.DOCUMENT_ID,
    PayloadField.DOCUMENT_TYPE,
    PayloadField.LANGUAGE,
)
