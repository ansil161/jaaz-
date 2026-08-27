"""DocumentProcessingService — the ingestion pipeline, orchestrated.

    claim → extract → normalize → chunk → embed → store → READY

This class sequences those steps and owns the document's status. It does not
know how to read a PDF, how to split text, or how to call an embedding
provider; each of those is a collaborator it is handed. That is what keeps it
short enough to read in one sitting, and what lets every step be tested on
its own.

Two properties are load-bearing:

IDEMPOTENCE. Processing is safe to run again. The claim is a conditional
UPDATE, so two workers cannot both take the same document. Chunk writing is
delete-then-insert in one transaction, so a retry replaces the previous run
rather than adding to it — a document can never end up with chunks from two
different versions of itself.

NO ESCAPING FAILURES. Every exception becomes a FAILED document with a short
message written for an administrator. The traceback goes to the log. A
process that dies mid-document leaves the row in a processing state, which
the worker's stale-reclaim path returns to the queue.
"""

import logging
import time
from dataclasses import dataclass

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from ..config import chunking_config
from ..embeddings.base import EmbeddingError
from ..embeddings.service import EmbeddingService
from ..ingestion.chunker import TextChunker
from ..ingestion.detection import kind_for_content_type
from ..ingestion.extractors.base import ExtractedSegment, ExtractionError
from ..ingestion.extractors.registry import extractor_for
from ..ingestion.normalizer import normalize
from ..models import Document, DocumentStatus
from ..vector_store.service import get_vector_store
from .storage import DocumentStorageService

logger = logging.getLogger('jaaz.knowledge_base')


class ProcessingOutcome:
    PROCESSED = 'processed'
    # The document was not in a claimable state: already running, already
    # ready, or claimed by another worker a moment earlier.
    SKIPPED = 'skipped'
    FAILED = 'failed'


@dataclass(frozen=True)
class ProcessingResult:
    document_id: str
    outcome: str
    chunk_count: int = 0
    error_code: str = ''
    message: str = ''


class ProcessingFailure(Exception):
    """A failure with a message that is safe to show an administrator."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


# The generic message. Anything that is not a recognised, explainable failure
# gets this one — it says what to do and reveals nothing about why.
_GENERIC_FAILURE = 'Processing failed. Please retry the document.'


class DocumentProcessingService:
    def __init__(self, *, storage=None, embedding_service=None, vector_store=None,
                 chunker=None):
        # All four are injectable. Tests substitute a fake embedding service
        # so the suite never depends on a paid API, and substitute storage so
        # it never touches a disk.
        self._storage = storage or DocumentStorageService()
        self._embeddings = embedding_service or EmbeddingService()
        self._vector_store = vector_store or get_vector_store()
        self._chunker = chunker or TextChunker(chunking_config())

    # -- entry point ----------------------------------------------------

    def process(self, document_id) -> ProcessingResult:
        document = self._claim(document_id)
        if document is None:
            logger.info('Document %s was not claimable; skipping', document_id)
            return ProcessingResult(str(document_id), ProcessingOutcome.SKIPPED)

        started = time.monotonic()
        logger.info(
            'Processing started document=%s attempt=%s type=%s size=%s',
            document.id,
            document.processing_attempts,
            document.content_type,
            document.file_size,
        )

        try:
            chunk_count, character_count = self._run_pipeline(document)
        except ProcessingFailure as failure:
            self._mark_failed(document, failure.code, failure.message)
            logger.warning(
                'Processing failed document=%s code=%s after=%.2fs',
                document.id,
                failure.code,
                time.monotonic() - started,
            )
            return ProcessingResult(
                str(document.id),
                ProcessingOutcome.FAILED,
                error_code=failure.code,
                message=failure.message,
            )
        except Exception:
            # Unrecognised. The traceback is the only place the detail is
            # allowed to go.
            logger.exception('Unexpected error processing document=%s', document.id)
            self._mark_failed(document, 'INTERNAL_ERROR', _GENERIC_FAILURE)
            return ProcessingResult(
                str(document.id),
                ProcessingOutcome.FAILED,
                error_code='INTERNAL_ERROR',
                message=_GENERIC_FAILURE,
            )

        self._mark_ready(document, chunk_count, character_count)
        logger.info(
            'Processing completed document=%s chunks=%s characters=%s in=%.2fs',
            document.id,
            chunk_count,
            character_count,
            time.monotonic() - started,
        )
        return ProcessingResult(
            str(document.id), ProcessingOutcome.PROCESSED, chunk_count=chunk_count
        )

    # -- the pipeline ---------------------------------------------------

    def _run_pipeline(self, document):
        segments = self._extract(document)
        character_count = sum(len(segment.text) for segment in segments)

        self._set_status(document, DocumentStatus.CHUNKING)
        chunks = self._chunk(segments, document)

        self._set_status(document, DocumentStatus.EMBEDDING)
        # Some vector stores embed as part of indexing. AiServiceVectorStore
        # does: ai_service holds the BGE model and the Qdrant client, so
        # sending it the chunk text once and letting it do both is one round
        # trip instead of two, and keeps the model in exactly one place.
        if getattr(self._vector_store, 'provides_embeddings', False):
            batch = None
        else:
            batch = self._embed(chunks, document)

        self._store(document, chunks, batch)
        return len(chunks), character_count

    def _extract(self, document):
        kind = kind_for_content_type(document.content_type)
        if kind is None:
            raise ProcessingFailure(
                'UNSUPPORTED_TYPE', 'This document type is no longer supported.'
            )

        extractor = extractor_for(kind.key)

        try:
            with self._storage.open(document.storage_key) as stream:
                extracted = extractor.extract(stream)
        except ExtractionError as exc:
            raise ProcessingFailure('EXTRACTION_FAILED', exc.message) from exc
        except FileNotFoundError as exc:
            raise ProcessingFailure(
                'FILE_MISSING',
                'The uploaded file is no longer in storage. Upload it again.',
            ) from exc
        except OSError as exc:
            logger.exception('Storage read failed document=%s', document.id)
            raise ProcessingFailure(
                'STORAGE_ERROR', 'The uploaded file could not be read.'
            ) from exc

        # Normalisation is per segment so that page and heading metadata
        # stays attached to the text it describes.
        segments = []
        for segment in extracted.segments:
            text = normalize(segment.text)
            if text:
                segments.append(ExtractedSegment(text=text, metadata=segment.metadata))

        if not segments:
            raise ProcessingFailure(
                'EMPTY_DOCUMENT', 'No readable text was found in this document.'
            )

        logger.info(
            'Text extraction completed document=%s segments=%s characters=%s',
            document.id,
            len(segments),
            sum(len(segment.text) for segment in segments),
        )
        return segments

    def _chunk(self, segments, document):
        chunks = self._chunker.chunk(segments)
        if not chunks:
            raise ProcessingFailure(
                'EMPTY_DOCUMENT', 'No readable text was found in this document.'
            )
        logger.info(
            'Chunking completed document=%s chunks=%s tokens=%s',
            document.id,
            len(chunks),
            sum(chunk.token_count for chunk in chunks),
        )
        return chunks

    def _embed(self, chunks, document):
        logger.info(
            'Embedding generation started document=%s chunks=%s provider=%s model=%s',
            document.id,
            len(chunks),
            self._embeddings.provider_name,
            self._embeddings.model,
        )
        try:
            batch = self._embeddings.embed_documents(
                [chunk.content for chunk in chunks]
            )
        except EmbeddingError as exc:
            raise ProcessingFailure(
                'EMBEDDING_FAILED' if exc.retryable else 'EMBEDDING_UNAVAILABLE',
                exc.message,
            ) from exc

        if len(batch.vectors) != len(chunks):
            raise ProcessingFailure(
                'EMBEDDING_FAILED',
                'The embedding service returned an incomplete result.',
            )

        logger.info(
            'Embedding generation completed document=%s vectors=%s dimensions=%s',
            document.id,
            len(batch.vectors),
            batch.dimensions,
        )
        return batch

    def _store(self, document, chunks, batch):
        stored = self._vector_store.upsert_document_chunks(
            document,
            chunks,
            batch.vectors if batch else None,
            model=batch.model if batch else '',
            dimensions=batch.dimensions if batch else 0,
        )
        logger.info(
            'Vector storage completed document=%s stored=%s store=%s',
            document.id,
            stored,
            getattr(self._vector_store, 'name', 'unknown'),
        )

    # -- status transitions ---------------------------------------------

    @staticmethod
    def _claim(document_id):
        """Move UPLOADED → PROCESSING, atomically, or return None.

        A conditional UPDATE rather than read-then-write. Two workers racing
        for the same row both issue this; the database serialises them and
        exactly one sees a rowcount of 1. The loser gets None and moves on,
        with no lock held and no retry needed.
        """
        claimed = Document.objects.filter(
            pk=document_id, status=DocumentStatus.UPLOADED
        ).update(
            status=DocumentStatus.PROCESSING,
            processing_started_at=timezone.now(),
            processing_attempts=F('processing_attempts') + 1,
            error_message='',
            error_code='',
            updated_at=timezone.now(),
        )
        if not claimed:
            return None
        return Document.objects.filter(pk=document_id).first()

    @staticmethod
    def _set_status(document, status):
        document.status = status
        document.save(update_fields=['status', 'updated_at'])

    @staticmethod
    def _mark_failed(document, code, message):
        document.status = DocumentStatus.FAILED
        document.error_code = code
        document.error_message = message
        document.save(
            update_fields=['status', 'error_code', 'error_message', 'updated_at']
        )

    @staticmethod
    @transaction.atomic
    def _mark_ready(document, chunk_count, character_count):
        document.status = DocumentStatus.READY
        document.chunk_count = chunk_count
        document.character_count = character_count
        document.processed_at = timezone.now()
        document.error_code = ''
        document.error_message = ''
        document.save(
            update_fields=[
                'status',
                'chunk_count',
                'character_count',
                'processed_at',
                'error_code',
                'error_message',
                'updated_at',
            ]
        )
