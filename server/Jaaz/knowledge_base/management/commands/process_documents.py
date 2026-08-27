"""The ingestion worker.

    python manage.py process_documents            # run until stopped
    python manage.py process_documents --once     # drain the queue and exit

There is no Celery here and no Redis. The queue is the `uploaded` status on
the documents table, and this command is what drains it. That is a real
pattern, not a placeholder: `SELECT ... FOR UPDATE SKIP LOCKED` is the same
primitive database-backed job runners are built on, and any number of these
processes can run side by side without coordinating.

What it is not: a distributed scheduler. It has no priorities, no delayed
jobs, no fan-out. If those are needed, `dispatch.py` is the seam — a Celery
task calling `DocumentProcessingService.process` replaces this command
without touching a service.

STALE RECLAIM. A worker killed mid-document leaves a row stuck in a
processing state with nothing coming to finish it. Each pass returns those
to the queue once they are older than RAG_STALE_PROCESSING_MINUTES, up to
RAG_MAX_PROCESSING_ATTEMPTS — after which the document is failed rather than
retried forever, because a document that has crashed a worker five times
will crash it a sixth.
"""

import logging
import signal
import time
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from knowledge_base.config import processing_config
from knowledge_base.models import Document, DocumentStatus
from knowledge_base.services.processing import (
    DocumentProcessingService,
    ProcessingOutcome,
)

logger = logging.getLogger('jaaz.knowledge_base')


class Command(BaseCommand):
    help = 'Process queued knowledge-base documents.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--once',
            action='store_true',
            help='Drain the queue once and exit, instead of polling.',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=5,
            help='How many documents to claim per pass.',
        )
        parser.add_argument(
            '--poll',
            type=int,
            default=None,
            help='Seconds between passes (default: RAG_WORKER_POLL_SECONDS).',
        )

    def handle(self, *args, **options):
        config = processing_config()
        poll_seconds = options['poll'] or config.poll_seconds
        batch_size = max(1, options['batch_size'])

        self._running = True
        self._install_signal_handlers()

        self.stdout.write(
            self.style.SUCCESS(
                f'Knowledge-base worker started '
                f'(batch={batch_size}, poll={poll_seconds}s).'
            )
        )

        processor = DocumentProcessingService()

        while self._running:
            reclaimed = self._reclaim_stale(config)
            if reclaimed:
                self.stdout.write(f'Returned {reclaimed} stalled document(s) to queue.')

            processed = self._drain(processor, batch_size)

            if options['once']:
                # Keep going while there is still work; exit when a pass
                # finds nothing. That is what makes --once a drain rather
                # than a single batch.
                if not processed:
                    break
                continue

            if not processed:
                time.sleep(poll_seconds)

        self.stdout.write(self.style.SUCCESS('Worker stopped.'))

    # -- internals ------------------------------------------------------

    def _install_signal_handlers(self):
        def stop(signum, _frame):
            # Finish the document in hand rather than abandoning it halfway
            # and leaving a row for the stale reclaim to pick up.
            # ASCII only. This stream is a Windows console under cp1252 as
            # often as it is a UTF-8 terminal, and an arrow or an ellipsis
            # raises UnicodeEncodeError from inside the worker loop.
            self.stdout.write('\nStopping after the current document...')
            self._running = False

        for name in ('SIGINT', 'SIGTERM'):
            handler = getattr(signal, name, None)
            if handler is not None:
                signal.signal(handler, stop)

    @staticmethod
    def _claim_candidates(batch_size):
        """Ids of documents this worker should attempt.

        `skip_locked` means two workers polling at the same moment get
        disjoint lists instead of both racing for the same head of the queue.
        It is an efficiency measure, not the correctness one — the authority
        is the conditional UPDATE inside the processor, which is what makes
        double-processing impossible even if this returns a shared id.

        The transaction is deliberately tiny: it selects ids and commits.
        Holding row locks for the minute a large PDF takes would block every
        other worker and every status read.
        """
        with transaction.atomic():
            return list(
                Document.objects.select_for_update(skip_locked=True)
                .filter(status=DocumentStatus.UPLOADED)
                .order_by('created_at')
                .values_list('id', flat=True)[:batch_size]
            )

    def _drain(self, processor, batch_size):
        processed = 0
        for document_id in self._claim_candidates(batch_size):
            if not self._running:
                break
            result = processor.process(document_id)
            if result.outcome == ProcessingOutcome.SKIPPED:
                continue
            processed += 1
            if result.outcome == ProcessingOutcome.PROCESSED:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  {document_id} -> ready ({result.chunk_count} chunks)'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'  {document_id} -> failed ({result.error_code})')
                )
        return processed

    @staticmethod
    def _reclaim_stale(config):
        """Return abandoned documents to the queue, or fail them for good."""
        cutoff = timezone.now() - timedelta(minutes=config.stale_after_minutes)
        stalled = Document.objects.filter(
            status__in=DocumentStatus.in_progress(),
            processing_started_at__lt=cutoff,
        )

        exhausted = stalled.filter(processing_attempts__gte=config.max_attempts)
        failed = exhausted.update(
            status=DocumentStatus.FAILED,
            error_code='PROCESSING_ABANDONED',
            error_message=(
                'Processing did not complete after several attempts. '
                'Please check the document and try again.'
            ),
            processing_started_at=None,
        )
        if failed:
            logger.error(
                'Failed %s document(s) that exceeded %s processing attempts',
                failed,
                config.max_attempts,
            )

        requeued = stalled.filter(
            processing_attempts__lt=config.max_attempts
        ).update(status=DocumentStatus.UPLOADED, processing_started_at=None)
        if requeued:
            logger.warning(
                'Re-queued %s document(s) stalled for over %s minutes',
                requeued,
                config.stale_after_minutes,
            )

        return failed + requeued
