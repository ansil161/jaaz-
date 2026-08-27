"""Vector store selection.

One function, so that `RAG_VECTOR_STORE=pgvector` is the entire change when a
second provider lands. Nothing else in the codebase constructs a store.
"""

from ..config import vector_store_name
from .providers.ai_service import AiServiceVectorStore
from .providers.postgres import PostgresVectorStore

_STORES = {
    # Vectors in a Postgres array, exact scan, no extension required. The
    # original implementation; still correct, and still the right choice for
    # a deployment that does not want a second service.
    PostgresVectorStore.name: PostgresVectorStore,
    # Delegates to ai_service, which owns the BGE model and Qdrant and does
    # hybrid retrieval with reranking. This one also embeds, so the processor
    # skips its own embedding stage.
    AiServiceVectorStore.name: AiServiceVectorStore,
}


def get_vector_store():
    name = vector_store_name()
    store = _STORES.get(name)
    if store is None:
        raise ValueError(
            f'Unknown vector store {name!r}. '
            f'Available: {", ".join(sorted(_STORES))}.'
        )
    return store()
