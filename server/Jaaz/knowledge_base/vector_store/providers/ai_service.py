"""A vector store backed by ai_service, which owns Qdrant and the embeddings.

WHY THIS IS THE RIGHT SEAM. The `VectorStore` protocol was written with
exactly three operations because that is all a knowledge base needs. Swapping
Postgres-with-exact-scan for Qdrant-with-hybrid-search is therefore this file
and one settings line — the ingestion pipeline, the worker, the admin UI and
the document lifecycle are untouched.

WHY IT ALSO PROVIDES EMBEDDINGS. `provides_embeddings = True` tells the
processor to skip its own embedding step. ai_service holds the BGE model and
the Qdrant client; sending it chunk text once and letting it embed and index
in a single call is one round trip instead of two, and it means the model
lives in exactly one place. Django never learns what an embedding is.

WHY THE CALL IS SYNCHRONOUS. It is made from `process_documents`, which is
already a background worker. The user's HTTP request ended long before this
runs. A queue behind a queue would only add a state-tracking problem — see
the ai_service README.
"""

import logging

import requests
from django.conf import settings

from ...models import Document, DocumentStatus
from ..base import SearchHit

logger = logging.getLogger('jaaz.knowledge_base')


class AiServiceUnavailable(Exception):
    """ai_service could not be reached, or refused the request."""


class AiServiceVectorStore:
    name = 'ai_service'

    # The processor reads this and skips its own embedding stage.
    provides_embeddings = True

    def __init__(self, session=None):
        config = settings.AI_SERVICE
        self._base_url = config['URL'].rstrip('/')
        self._token = config['TOKEN']
        self._tenant_id = config['TENANT_ID']
        self._timeout = config['TIMEOUT_SECONDS']
        self._index_timeout = config['INDEX_TIMEOUT_SECONDS']
        # A Session, so the connection pool and TLS session are reused across
        # the documents a worker pass indexes.
        self._session = session or requests.Session()

    # -- writes ----------------------------------------------------------

    def upsert_document_chunks(self, document, chunks, vectors, *, model=None,
                               dimensions=None):
        """Send the chunks; ai_service embeds and indexes them.

        `vectors` is ignored and is None in practice — this store declares
        `provides_embeddings`, so the processor never computes any. The
        parameter stays in the signature because it is part of the protocol
        and a store that does not embed still needs it.
        """
        payload = {
            'documentId': str(document.id),
            'documentName': document.name,
            'documentType': _kind_key(document),
            'knowledgeBaseId': 'default',
            'language': 'en',
            'chunks': [
                {
                    'chunkId': f'{document.id}:{chunk.index}',
                    'chunkIndex': chunk.index,
                    'content': chunk.content,
                    'tokenCount': chunk.token_count,
                    'metadata': chunk.metadata,
                }
                for chunk in chunks
            ],
        }

        body = self._post(
            '/api/v1/knowledge-base/documents', payload,
            # Embedding a large document takes real time. This timeout is
            # generous because the caller is a worker, not a user.
            timeout=self._index_timeout,
        )

        indexed = int(body.get('indexedChunks', 0))
        logger.info(
            'Indexed document via ai_service id=%s chunks=%s model=%s dims=%s',
            document.id, indexed, body.get('embeddingModel'),
            body.get('dimensions'),
        )
        return indexed

    def delete_document(self, document_id):
        try:
            self._request(
                'DELETE',
                f'/api/v1/knowledge-base/documents/{document_id}',
                timeout=self._timeout,
            )
        except AiServiceUnavailable:
            # Deletion is called from the document-delete path, where the row
            # is already gone. Failing here would turn "the document is
            # deleted" into a 500. The orphaned vectors are logged and are
            # cleaned up by the next reindex.
            logger.exception(
                'Could not remove document %s from the vector index; '
                'it may remain searchable until the next reindex',
                document_id,
            )
            return 0
        return 1

    # -- reads -----------------------------------------------------------

    def search(self, query_vector, *, model, top_k, min_score=0.0,
               document_ids=None):
        """Not used by this store.

        The protocol's `search` takes a pre-computed query vector, which only
        makes sense when the caller owns the embedding model. Here ai_service
        does, so retrieval goes through `search_text` instead. Raising rather
        than silently returning nothing: a caller reaching this has a wiring
        bug, and an empty list would hide it.
        """
        raise NotImplementedError(
            'AiServiceVectorStore embeds queries itself; call search_text().'
        )

    def search_text(self, query, *, top_k=None, document_ids=None):
        """Hybrid retrieval, performed by ai_service.

        Dense and sparse search, RRF, and reranking all happen there. This
        returns the same `SearchHit` shape the Postgres store does, so the
        admin console's search does not know anything changed.
        """
        payload = {'query': query}
        if top_k:
            payload['topK'] = top_k
        if document_ids:
            payload['documentIds'] = [str(value) for value in document_ids]

        body = self._post('/api/v1/retrieval/search', payload,
                          timeout=self._timeout)

        return [
            SearchHit(
                chunk_id=hit['chunkId'],
                chunk_index=hit['chunkIndex'],
                content=hit.get('excerpt', ''),
                score=float(hit.get('score', 0.0)),
                document_id=hit['documentId'],
                document_name=hit['documentName'],
                metadata={
                    key: hit[key]
                    for key in ('page', 'pages', 'heading')
                    if hit.get(key) is not None
                },
            )
            for hit in body.get('hits', [])
        ]

    # -- diagnostics -----------------------------------------------------

    def health(self):
        try:
            response = self._session.get(
                f'{self._base_url}/health/ready', timeout=5
            )
            return response.status_code == 200
        except requests.RequestException:
            return False

    @staticmethod
    def stats():
        return {
            'documents': Document.objects.filter(
                status=DocumentStatus.READY
            ).count(),
            # Chunk counts live in Qdrant now. The document row still records
            # how many it produced, which is the number the console shows.
            'chunks': sum(
                Document.objects.filter(
                    status=DocumentStatus.READY
                ).values_list('chunk_count', flat=True)
            ),
        }

    # -- internals -------------------------------------------------------

    def _headers(self):
        return {
            'Authorization': f'Bearer {self._token}',
            'Content-Type': 'application/json',
            # ai_service trusts these because the token proved the caller is
            # this backend. They are what every Qdrant filter is built from.
            'X-Jaaz-Tenant-Id': self._tenant_id,
            'X-Jaaz-User-Id': 'knowledge-base-worker',
        }

    def _post(self, path, payload, *, timeout):
        return self._request('POST', path, json=payload, timeout=timeout)

    def _request(self, method, path, *, json=None, timeout):
        url = f'{self._base_url}{path}'
        try:
            response = self._session.request(
                method, url, json=json, headers=self._headers(), timeout=timeout
            )
        except requests.RequestException as exc:
            raise AiServiceUnavailable(
                'The AI service could not be reached.'
            ) from exc

        if response.status_code >= 400:
            # The body may quote the request. Logged, never re-raised.
            logger.error(
                'ai_service rejected %s %s with %s: %s',
                method, path, response.status_code, response.text[:500],
            )
            raise AiServiceUnavailable(
                'The AI service could not process the request.'
            )

        return response.json() if response.content else {}


def _kind_key(document):
    """The short type key ('pdf', 'docx', …) used as a retrieval filter."""
    from ...ingestion.detection import kind_for_content_type

    kind = kind_for_content_type(document.content_type)
    return kind.key if kind else ''
