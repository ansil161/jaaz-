"""The knowledge-base HTTP surface.

Thin. Each view validates its input, calls one service method, and serializes
the result. No view extracts text, counts a token, or decides what a chunk
is — and no view decides who is allowed in beyond declaring the rule.

Every endpoint here inherits IsAuthenticated + IsAdmin from
`KnowledgeBaseAPIView`. Declaring it on a base class rather than relying on
the URL prefix means a view added to this module later cannot become public
by omission.
"""

import logging

from django.db.models import Count, Q
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from account.permissions import IsAdmin, IsAuthenticated

from ..config import upload_config
from ..models import Document, DocumentStatus
from ..services.documents import KnowledgeBaseService
from ..services.retrieval import RetrievalService
from .serializers import (
    DocumentChunkSerializer,
    DocumentSearchSerializer,
    DocumentSerializer,
    DocumentUploadSerializer,
    SearchHitSerializer,
    SourceSerializer,
    supported_formats,
)

logger = logging.getLogger('jaaz.knowledge_base')

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Whitelisted rather than passed through to `order_by`. An unchecked ordering
# parameter lets a caller sort by any column on the model, including ones the
# serializer deliberately does not expose, and infer their values from the
# resulting order.
ORDERING_FIELDS = {
    'name': 'name',
    '-name': '-name',
    'createdAt': 'created_at',
    '-createdAt': '-created_at',
    'updatedAt': 'updated_at',
    '-updatedAt': '-updated_at',
    'status': 'status',
    '-status': '-status',
    'fileSize': 'file_size',
    '-fileSize': '-file_size',
    'chunkCount': 'chunk_count',
    '-chunkCount': '-chunk_count',
}
DEFAULT_ORDERING = '-createdAt'


class KnowledgeBaseAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]


def _paginate(request, queryset):
    """Page a queryset and describe the page.

    Hand-rolled rather than DRF's paginator because the response envelope
    here is `{results, meta}` and the meta block also carries the status
    counts the list header needs — bending PageNumberPagination into that
    shape is more code than doing it directly.
    """
    try:
        page = max(1, int(request.query_params.get('page', 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = int(request.query_params.get('pageSize', DEFAULT_PAGE_SIZE))
    except (TypeError, ValueError):
        page_size = DEFAULT_PAGE_SIZE
    page_size = max(1, min(page_size, MAX_PAGE_SIZE))

    total = queryset.count()
    total_pages = max(1, -(-total // page_size))
    page = min(page, total_pages)
    start = (page - 1) * page_size

    return list(queryset[start:start + page_size]), {
        'page': page,
        'pageSize': page_size,
        'totalPages': total_pages,
        'totalCount': total,
    }


class DocumentListCreateView(KnowledgeBaseAPIView):
    """GET the document list. POST a new document."""

    parser_classes = [MultiPartParser]

    def get_throttles(self):
        # An upload is expensive in a way a list is not: disk, extraction
        # CPU, and a paid embedding call per chunk.
        self.throttle_scope = 'kb-upload' if self.request.method == 'POST' else 'kb-read'
        return super().get_throttles()

    def get(self, request):
        queryset = self._filtered(request)
        ordering = ORDERING_FIELDS.get(
            request.query_params.get('ordering'), ORDERING_FIELDS[DEFAULT_ORDERING]
        )
        queryset = queryset.select_related('created_by').order_by(ordering, 'id')

        documents, meta = _paginate(request, queryset)
        meta['counts'] = self._counts()
        meta['limits'] = {
            'maxFileSize': upload_config().max_bytes,
            **supported_formats(),
        }

        return Response(
            {'results': DocumentSerializer(documents, many=True).data, 'meta': meta}
        )

    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = KnowledgeBaseService().upload(
            serializer.validated_data['file'],
            uploaded_by=request.user,
            display_name=serializer.validated_data.get('name') or None,
        )

        return Response(
            {'document': DocumentSerializer(document).data},
            status=status.HTTP_201_CREATED,
        )

    # -- internals ------------------------------------------------------

    @staticmethod
    def _filtered(request):
        queryset = Document.objects.all()

        search = (request.query_params.get('search') or '').strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(original_filename__icontains=search)
            )

        # Repeatable: ?status=ready&status=failed
        statuses = [
            value
            for value in request.query_params.getlist('status')
            if value in DocumentStatus.values
        ]
        if statuses:
            queryset = queryset.filter(status__in=statuses)

        content_type = (request.query_params.get('contentType') or '').strip()
        if content_type:
            queryset = queryset.filter(content_type=content_type)

        return queryset

    @staticmethod
    def _counts():
        """One grouped query for the whole status summary, not six."""
        rows = Document.objects.values('status').annotate(total=Count('id'))
        counts = {value: 0 for value in DocumentStatus.values}
        for row in rows:
            counts[row['status']] = row['total']
        counts['all'] = sum(counts.values())
        return counts


class DocumentDetailView(KnowledgeBaseAPIView):
    throttle_scope = 'kb-read'

    def get(self, request, document_id):
        document = _get_document(document_id)
        return Response({'document': DocumentSerializer(document).data})

    def delete(self, request, document_id):
        document = _get_document(document_id)
        KnowledgeBaseService().delete(document)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_throttles(self):
        self.throttle_scope = (
            'kb-write' if self.request.method == 'DELETE' else 'kb-read'
        )
        return super().get_throttles()


class DocumentChunksView(KnowledgeBaseAPIView):
    """A preview of what a document was split into.

    The point of exposing this is that chunking is invisible otherwise: an
    administrator has no way to tell a document that produced forty sensible
    passages from one that produced four hundred fragments.
    """

    throttle_scope = 'kb-read'

    def get(self, request, document_id):
        document = _get_document(document_id)
        chunks, meta = _paginate(request, document.chunks.all())
        return Response(
            {
                'results': DocumentChunkSerializer(chunks, many=True).data,
                'meta': meta,
            }
        )


class DocumentRetryView(KnowledgeBaseAPIView):
    throttle_scope = 'kb-write'

    def post(self, request, document_id):
        document = KnowledgeBaseService().retry(_get_document(document_id))
        return Response({'document': DocumentSerializer(document).data})


class DocumentReprocessView(KnowledgeBaseAPIView):
    """Re-run ingestion for a document that already succeeded.

    Separate from retry because the precondition is the opposite one, and
    conflating them would mean a mis-click on a healthy document silently
    re-embedding it.
    """

    throttle_scope = 'kb-write'

    def post(self, request, document_id):
        document = KnowledgeBaseService().reprocess(_get_document(document_id))
        return Response({'document': DocumentSerializer(document).data})


class DocumentSearchView(KnowledgeBaseAPIView):
    """Retrieval, exposed so it can be seen working.

    This is the query half of RAG and nothing more: it returns passages and
    their sources, and never calls a language model. When the chatbot is
    built it will call RetrievalService directly rather than this endpoint —
    this exists so an administrator can check what the knowledge base would
    actually hand it.
    """

    throttle_scope = 'kb-search'

    def post(self, request):
        serializer = DocumentSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = RetrievalService().search(
            data['query'],
            top_k=data.get('topK'),
            document_ids=data.get('documentIds') or None,
        )

        return Response(
            {
                'query': result.query,
                'model': result.model,
                'hits': SearchHitSerializer(result.hits, many=True).data,
                'sources': SourceSerializer(result.sources, many=True).data,
            }
        )


def _get_document(document_id):
    """Fetch or 404.

    `get_object_or_404` on a UUID primary key raises ValidationError rather
    than Http404 for a malformed id, which would surface as a 500. Catching
    it here turns a bad path segment into the 404 it should be.
    """
    from django.core.exceptions import ValidationError
    from django.http import Http404

    try:
        document = Document.objects.select_related('created_by').filter(
            pk=document_id
        ).first()
    except (ValidationError, ValueError, TypeError) as exc:
        raise Http404 from exc

    if document is None:
        raise Http404
    return document
