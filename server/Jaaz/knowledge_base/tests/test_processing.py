"""The ingestion pipeline end to end, and the guarantees around it.

The two that matter most are the ones a casual implementation gets wrong:
processing the same document twice must not double its chunks, and a failure
anywhere must leave an administrator with a document they can retry and a
message that tells them nothing about the internals.
"""

from datetime import timedelta

from django.conf import settings
from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone

from knowledge_base.embeddings.service import EmbeddingService
from knowledge_base.models import Document, DocumentChunk, DocumentStatus
from knowledge_base.services.documents import KnowledgeBaseService
from knowledge_base.services.processing import (
    DocumentProcessingService,
    ProcessingOutcome,
)

from .support import (
    BrokenProvider,
    FakeProvider,
    KnowledgeBaseTestCase,
    docx_upload,
    make_user,
    markdown_upload,
    pdf_upload,
    text_upload,
)


def queued(**overrides):
    """Settings where an upload is queued but not processed.

    Lets a test observe a document between upload and ingestion, which eager
    dispatch gives no opportunity to do.
    """
    return override_settings(
        KNOWLEDGE_BASE={
            **settings.KNOWLEDGE_BASE,
            'TASK_DISPATCH': 'worker',
            **overrides,
        }
    )


class PipelineTests(KnowledgeBaseTestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)
        self.service = KnowledgeBaseService()

    def upload(self, upload_file):
        return self.service.upload(upload_file, uploaded_by=self.admin)

    def test_a_text_document_becomes_ready_with_chunks(self):
        document = self.upload(text_upload(body='Warranty terms. ' * 200))

        self.assertEqual(document.status, DocumentStatus.READY)
        self.assertGreater(document.chunk_count, 0)
        self.assertGreater(document.character_count, 0)
        self.assertIsNotNone(document.processed_at)
        self.assertEqual(document.error_message, '')

    def test_every_chunk_is_embedded_and_labelled_with_its_model(self):
        document = self.upload(text_upload(body='Some content. ' * 200))

        chunks = list(document.chunks.all())
        self.assertTrue(chunks)
        for chunk in chunks:
            self.assertIsNotNone(chunk.embedding)
            self.assertEqual(chunk.embedding_model, 'hashing-64')
            self.assertEqual(chunk.embedding_dimensions, 64)
            self.assertEqual(len(chunk.embedding), 64)

    def test_chunk_indexes_are_contiguous_from_zero(self):
        document = self.upload(text_upload(body='Paragraph text. ' * 400))
        indexes = list(document.chunks.values_list('chunk_index', flat=True))
        self.assertEqual(indexes, list(range(len(indexes))))

    def test_a_pdf_keeps_its_page_numbers_in_chunk_metadata(self):
        # This is what makes "Product Guide, page 2" possible later.
        document = self.upload(
            pdf_upload(pages=['Page one content here.', 'Page two content here.'])
        )
        pages = set()
        for chunk in document.chunks.all():
            pages.update(chunk.metadata.get('pages', []))
        self.assertEqual(pages, {1, 2})

    def test_docx_and_markdown_go_through_the_same_pipeline(self):
        for upload_file in (docx_upload(), markdown_upload()):
            with self.subTest(file=upload_file.name):
                document = self.upload(upload_file)
                self.assertEqual(document.status, DocumentStatus.READY)
                self.assertGreater(document.chunk_count, 0)

    @queued()
    def test_an_upload_is_left_queued_when_a_worker_owns_processing(self):
        document = self.upload(text_upload())
        self.assertEqual(document.status, DocumentStatus.UPLOADED)
        self.assertEqual(document.chunk_count, 0)


class FailureTests(KnowledgeBaseTestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)

    def queue_document(self):
        with queued():
            return KnowledgeBaseService().upload(
                text_upload(body='Some content. ' * 100), uploaded_by=self.admin
            )

    def broken_processor(self, retryable=True):
        return DocumentProcessingService(
            embedding_service=EmbeddingService(
                provider=BrokenProvider(retryable=retryable),
                config=self._embedding_config(),
            )
        )

    @staticmethod
    def _embedding_config():
        from knowledge_base.config import embedding_config

        return embedding_config()

    def test_an_embedding_failure_marks_the_document_failed(self):
        document = self.queue_document()

        result = self.broken_processor().process(document.id)

        document.refresh_from_db()
        self.assertEqual(result.outcome, ProcessingOutcome.FAILED)
        self.assertEqual(document.status, DocumentStatus.FAILED)
        self.assertTrue(document.can_retry)

    def test_the_stored_error_is_safe_to_show_an_administrator(self):
        document = self.queue_document()
        self.broken_processor().process(document.id)
        document.refresh_from_db()

        message = document.error_message
        self.assertTrue(message)
        # No traceback, no module path, no provider internals.
        for leak in ('Traceback', 'knowledge_base.', 'File "', 'Error:'):
            self.assertNotIn(leak, message)

    def test_a_missing_file_fails_the_document_rather_than_crashing(self):
        document = self.queue_document()
        # Simulate the file having been removed from the bucket underneath us.
        Document.objects.filter(pk=document.pk).update(storage_key='does/not/exist.txt')

        result = DocumentProcessingService().process(document.id)

        document.refresh_from_db()
        self.assertEqual(result.outcome, ProcessingOutcome.FAILED)
        self.assertEqual(document.error_code, 'FILE_MISSING')

    def test_a_failed_document_can_be_retried_and_succeed(self):
        document = self.queue_document()
        self.broken_processor().process(document.id)
        document.refresh_from_db()
        self.assertEqual(document.status, DocumentStatus.FAILED)

        # Retry with a working provider — eager dispatch runs it inline.
        document = KnowledgeBaseService().retry(document)

        self.assertEqual(document.status, DocumentStatus.READY)
        self.assertGreater(document.chunk_count, 0)
        self.assertEqual(document.error_message, '')

    def test_processing_attempts_are_counted(self):
        document = self.queue_document()
        self.broken_processor().process(document.id)
        document.refresh_from_db()
        first = document.processing_attempts

        Document.objects.filter(pk=document.pk).update(status=DocumentStatus.UPLOADED)
        self.broken_processor().process(document.id)
        document.refresh_from_db()

        self.assertEqual(document.processing_attempts, first + 1)


class IdempotencyTests(KnowledgeBaseTestCase):
    """Re-processing replaces; it never accumulates."""

    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)
        self.document = KnowledgeBaseService().upload(
            text_upload(body='Repeatable content. ' * 200), uploaded_by=self.admin
        )

    def test_reprocessing_leaves_the_same_number_of_chunks(self):
        before = self.document.chunk_count
        self.assertGreater(before, 1)

        document = KnowledgeBaseService().reprocess(self.document)

        self.assertEqual(document.status, DocumentStatus.READY)
        self.assertEqual(document.chunk_count, before)
        self.assertEqual(DocumentChunk.objects.filter(document=document).count(), before)

    def test_reprocessing_three_times_does_not_multiply_chunks(self):
        before = self.document.chunk_count
        for _ in range(3):
            self.document = KnowledgeBaseService().reprocess(self.document)
        self.assertEqual(self.document.chunk_count, before)

    def test_a_second_concurrent_process_call_is_skipped(self):
        """The conditional claim is what makes double-processing impossible.

        The document is READY, so it is not in a claimable state; a worker
        that picks it up anyway gets SKIPPED rather than re-ingesting it.
        """
        result = DocumentProcessingService().process(self.document.id)
        self.assertEqual(result.outcome, ProcessingOutcome.SKIPPED)

    def test_only_one_of_two_racing_claims_wins(self):
        Document.objects.filter(pk=self.document.pk).update(
            status=DocumentStatus.UPLOADED
        )

        first = DocumentProcessingService()._claim(self.document.pk)
        second = DocumentProcessingService()._claim(self.document.pk)

        self.assertIsNotNone(first)
        self.assertIsNone(second)

    def test_deleting_a_document_removes_its_chunks(self):
        document_id = self.document.pk
        self.assertTrue(DocumentChunk.objects.filter(document_id=document_id).exists())

        KnowledgeBaseService().delete(self.document)

        self.assertFalse(Document.objects.filter(pk=document_id).exists())
        self.assertFalse(DocumentChunk.objects.filter(document_id=document_id).exists())

    def test_deleting_a_document_removes_its_stored_file(self):
        from django.core.files.storage import storages

        storage = storages[settings.KNOWLEDGE_BASE_STORAGE_ALIAS]
        key = self.document.storage_key
        self.assertTrue(storage.exists(key))

        KnowledgeBaseService().delete(self.document)

        self.assertFalse(storage.exists(key))


class WorkerTests(KnowledgeBaseTestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)

    def test_the_worker_drains_the_queue(self):
        with queued():
            first = KnowledgeBaseService().upload(
                text_upload(name='a.txt', body='Alpha content. ' * 80),
                uploaded_by=self.admin,
            )
            second = KnowledgeBaseService().upload(
                text_upload(name='b.txt', body='Beta content. ' * 80),
                uploaded_by=self.admin,
            )
            self.assertEqual(first.status, DocumentStatus.UPLOADED)

            call_command('process_documents', '--once', verbosity=0)

        first.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual(first.status, DocumentStatus.READY)
        self.assertEqual(second.status, DocumentStatus.READY)

    def test_a_document_abandoned_mid_processing_is_returned_to_the_queue(self):
        with queued():
            document = KnowledgeBaseService().upload(
                text_upload(body='Content. ' * 80), uploaded_by=self.admin
            )
            # A worker claimed it and then died.
            Document.objects.filter(pk=document.pk).update(
                status=DocumentStatus.PROCESSING,
                processing_started_at=timezone.now() - timedelta(hours=2),
            )

            call_command('process_documents', '--once', verbosity=0)

        document.refresh_from_db()
        self.assertEqual(document.status, DocumentStatus.READY)

    def test_a_document_that_keeps_stalling_is_eventually_failed(self):
        with queued(MAX_PROCESSING_ATTEMPTS=2):
            document = KnowledgeBaseService().upload(
                text_upload(body='Content. ' * 80), uploaded_by=self.admin
            )
            Document.objects.filter(pk=document.pk).update(
                status=DocumentStatus.EMBEDDING,
                processing_started_at=timezone.now() - timedelta(hours=2),
                processing_attempts=5,
            )

            call_command('process_documents', '--once', verbosity=0)

        document.refresh_from_db()
        self.assertEqual(document.status, DocumentStatus.FAILED)
        self.assertEqual(document.error_code, 'PROCESSING_ABANDONED')
        self.assertNotIn('Traceback', document.error_message)


class EmbeddingCallTests(KnowledgeBaseTestCase):
    """The processor calls the embedding service with the chunk text, once."""

    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)

    def test_each_chunk_is_embedded_exactly_once(self):
        from knowledge_base.config import embedding_config

        provider = FakeProvider(dimensions=8)
        with queued():
            document = KnowledgeBaseService().upload(
                text_upload(body='Sentence content. ' * 200), uploaded_by=self.admin
            )

        processor = DocumentProcessingService(
            embedding_service=EmbeddingService(
                provider=provider, config=embedding_config()
            )
        )
        processor.process(document.id)

        document.refresh_from_db()
        embedded = [text for call in provider.calls for text in call]
        self.assertEqual(len(embedded), document.chunk_count)
        self.assertEqual(
            embedded, [chunk.content for chunk in document.chunks.order_by('chunk_index')]
        )
