"""KnowledgeBaseService — the lifecycle of a document as a thing an
administrator manages: upload it, retry it, re-process it, delete it.

Deliberately not the pipeline. This class decides *whether* something may
happen and keeps storage and the database consistent while it does;
DocumentProcessingService decides *how* a document becomes chunks. Splitting
them is what keeps either one small.

Raises ApiError, the same envelope the auth service uses, so a failure here
reaches the client in the shape every other failure does.
"""

import logging
import unicodedata

from django.db import transaction
from rest_framework import status

from common.errors import ApiError, ErrorCode

from ..config import upload_config
from ..dispatch import enqueue_document_processing
from ..ingestion.detection import UnsupportedDocumentError, detect
from ..models import Document, DocumentStatus
from ..vector_store.service import get_vector_store
from .storage import DocumentStorageService

logger = logging.getLogger('jaaz.knowledge_base')

_MAX_NAME_LENGTH = 255


def _readable_size(number_of_bytes):
    megabytes = number_of_bytes / (1024 * 1024)
    return f'{megabytes:.0f} MB' if megabytes >= 1 else f'{number_of_bytes} bytes'


def _safe_display_name(filename):
    """A human label derived from the uploaded name.

    Sanitised because it is rendered in the admin UI and stored in the
    database — control characters and directional-override characters in a
    filename are how a `.txt` displays as a `.exe`. Path separators are
    stripped for the same reason the storage key never uses this value.
    """
    name = (filename or 'Untitled').replace('\\', '/').rsplit('/', 1)[-1]
    name = ''.join(
        character
        for character in name
        if unicodedata.category(character) not in ('Cc', 'Cf')
    ).strip()

    stem = name.rsplit('.', 1)[0] if '.' in name else name
    stem = stem.strip() or 'Untitled'
    return stem[:_MAX_NAME_LENGTH]


def _safe_original_filename(filename):
    name = (filename or 'upload').replace('\\', '/').rsplit('/', 1)[-1]
    name = ''.join(
        character
        for character in name
        if unicodedata.category(character) not in ('Cc', 'Cf')
    ).strip()
    return (name or 'upload')[:_MAX_NAME_LENGTH]


class KnowledgeBaseService:
    def __init__(self, storage=None, vector_store=None):
        self._storage = storage or DocumentStorageService()
        self._vector_store = vector_store or get_vector_store()

    # -- upload ---------------------------------------------------------

    def upload(self, file_obj, *, uploaded_by, display_name=None) -> Document:
        """Validate, store, record, and queue a document.

        Order matters. Size is checked before anything is read, type is
        detected from the bytes before anything is written, and the file is
        only written once both have passed — so an oversized or unsupported
        upload never occupies storage at all.
        """
        limits = upload_config()
        size = getattr(file_obj, 'size', None)

        if size is None:
            raise ApiError(
                code=ErrorCode.INVALID_REQUEST,
                message='No file was received.',
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if size < limits.min_bytes:
            raise ApiError(
                code=ErrorCode.FILE_EMPTY,
                message='That file is empty.',
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if size > limits.max_bytes:
            raise ApiError(
                code=ErrorCode.FILE_TOO_LARGE,
                message=(
                    f'That file is {_readable_size(size)}. The limit is '
                    f'{_readable_size(limits.max_bytes)}.'
                ),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        original_filename = _safe_original_filename(getattr(file_obj, 'name', ''))

        try:
            kind = detect(file_obj, original_filename)
        except UnsupportedDocumentError as exc:
            logger.info(
                'Rejected upload filename=%r size=%s reason=%s',
                original_filename,
                size,
                exc.message,
            )
            raise ApiError(
                code=ErrorCode.UNSUPPORTED_FILE_TYPE,
                message=exc.message,
                status_code=status.HTTP_400_BAD_REQUEST,
            ) from exc

        stored = self._storage.save(file_obj, kind=kind)

        try:
            self._reject_duplicate(stored.checksum)

            with transaction.atomic():
                document = Document.objects.create(
                    name=display_name or _safe_display_name(original_filename),
                    original_filename=original_filename,
                    # The detected type, never the browser's Content-Type.
                    content_type=kind.content_type,
                    file_size=stored.size,
                    storage_key=stored.storage_key,
                    checksum=stored.checksum,
                    status=DocumentStatus.UPLOADED,
                    created_by=uploaded_by,
                )
        except Exception:
            # The bytes are already on disk and nothing references them.
            # Leaving them behind would be a slow storage leak that nobody
            # notices until the volume fills.
            self._storage.delete(stored.storage_key)
            raise

        logger.info(
            'Document uploaded id=%s kind=%s size=%s by=%s',
            document.id,
            kind.key,
            stored.size,
            getattr(uploaded_by, 'pk', None),
        )

        enqueue_document_processing(document.id)
        document.refresh_from_db()
        return document

    def _reject_duplicate(self, checksum):
        """Refuse a byte-identical re-upload.

        Not a correctness requirement — it is a cost one. Re-embedding a
        document that is already in the knowledge base is a bill and a set of
        duplicate chunks that dilute every future search. A genuinely revised
        file has a different checksum and is unaffected.
        """
        existing = (
            Document.objects.filter(checksum=checksum)
            .exclude(status=DocumentStatus.FAILED)
            .first()
        )
        if existing is None:
            return
        raise ApiError(
            code=ErrorCode.DUPLICATE_DOCUMENT,
            message=f'This file is already in the knowledge base as "{existing.name}".',
            status_code=status.HTTP_409_CONFLICT,
        )

    # -- lifecycle ------------------------------------------------------

    def retry(self, document: Document) -> Document:
        """Re-queue a document that failed."""
        if not document.can_retry:
            raise ApiError(
                code=ErrorCode.DOCUMENT_NOT_RETRYABLE,
                message='Only a failed document can be retried.',
                status_code=status.HTTP_409_CONFLICT,
            )
        return self._requeue(document, reason='retry')

    def reprocess(self, document: Document) -> Document:
        """Re-run ingestion for a document that is already finished.

        Used after a change to chunk size or embedding model, when the stored
        vectors no longer match how new documents are being indexed.
        """
        if document.is_processing:
            raise ApiError(
                code=ErrorCode.DOCUMENT_BUSY,
                message='This document is already being processed.',
                status_code=status.HTTP_409_CONFLICT,
            )
        return self._requeue(document, reason='reprocess')

    def _requeue(self, document, *, reason):
        """Return a document to the queue.

        The existing chunks are deliberately left in place until the new run
        replaces them — the vector store swaps them atomically at the end of
        processing. Deleting them here would take the document out of
        retrieval for the whole duration of a re-index, for no benefit.
        """
        with transaction.atomic():
            updated = Document.objects.filter(
                pk=document.pk, status__in=(DocumentStatus.READY, DocumentStatus.FAILED)
            ).update(
                status=DocumentStatus.UPLOADED,
                error_message='',
                error_code='',
                processing_started_at=None,
            )

        if not updated:
            # Lost a race with another administrator or a worker.
            raise ApiError(
                code=ErrorCode.DOCUMENT_BUSY,
                message='This document is already being processed.',
                status_code=status.HTTP_409_CONFLICT,
            )

        logger.info('Document %s re-queued (%s)', document.pk, reason)
        enqueue_document_processing(document.pk)

        document.refresh_from_db()
        return document

    # -- delete ---------------------------------------------------------

    def delete(self, document: Document) -> None:
        """Remove a document, its chunks and its stored bytes.

        The row goes first, inside a transaction, and the chunks with it by
        cascade — so the document leaves retrieval immediately and cannot be
        cited by an answer while its file is being removed. The file is
        deleted afterwards: if that fails, the log records an orphaned object
        rather than the API failing a deletion that has, from every user's
        point of view, already happened.
        """
        document_id = document.pk
        storage_key = document.storage_key
        chunk_count = document.chunk_count

        with transaction.atomic():
            document.delete()

        # Chunks stored in Postgres go with the row by cascade. A store that
        # keeps them elsewhere — Qdrant, via ai_service — has to be told, or
        # the deleted document stays searchable and keeps being cited.
        try:
            self._vector_store.delete_document(document_id)
        except Exception:
            logger.exception(
                'Failed to remove document %s from the vector index; '
                'it may remain searchable until the next reindex',
                document_id,
            )

        self._storage.delete(storage_key)

        logger.info(
            'Document deleted id=%s chunks_removed=%s key=%s',
            document_id,
            chunk_count,
            storage_key,
        )
