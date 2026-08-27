"""How processing gets off the request thread.

There is no Celery, no RQ and no Redis in this project, and adding one to
ingest a handful of documents would be a large piece of infrastructure to
operate for a small amount of work. So the `uploaded` status *is* the queue:
`manage.py process_documents` claims rows with `SELECT ... FOR UPDATE SKIP
LOCKED`, which is the same primitive a database-backed job runner uses and is
safe across any number of workers.

Three modes, chosen by RAG_TASK_DISPATCH:

    worker  the upload returns as soon as the row is committed, and a
            separate worker process picks it up. The production shape.
    thread  a daemon thread runs it in-process. Convenient with runserver,
            where there is no second process to run a worker in. Work is
            lost if the server restarts mid-document — the stale-reclaim
            path in the worker command exists for exactly that.
    eager   inline, before the call returns. Tests, and nothing else.

What matters is that the *business logic* is identical in all three: they
differ only in who calls `DocumentProcessingService.process`. Introducing
Celery later means adding a fourth branch here and a task wrapper. No
service, model, or endpoint changes.
"""

import logging
import threading

from django.db import connection, transaction

from .config import processing_config

logger = logging.getLogger('jaaz.knowledge_base')

EAGER = 'eager'
THREAD = 'thread'
WORKER = 'worker'


def _run(document_id):
    # Imported here rather than at module scope: the processor imports the
    # models, and this module is imported from the services that the
    # processor itself uses.
    from .services.processing import DocumentProcessingService

    return DocumentProcessingService().process(document_id)


def _run_in_thread(document_id):
    def target():
        try:
            _run(document_id)
        except Exception:
            # The processor already converts every failure into a FAILED
            # document. Anything reaching here escaped that, and on a thread
            # it would otherwise vanish without trace.
            logger.exception('Unhandled error processing document %s', document_id)
        finally:
            # A thread that opened a connection has to hand it back, or the
            # pool leaks one per document.
            connection.close()

    thread = threading.Thread(
        target=target, name=f'kb-process-{document_id}', daemon=True
    )
    thread.start()
    return thread


def enqueue_document_processing(document_id):
    """Schedule ingestion for a document that is queued and committed.

    Returns the dispatch mode used, so callers can tell an administrator
    whether to expect the status to move on its own.
    """
    mode = processing_config().dispatch

    if mode == EAGER:
        # Same transaction, so the row is already visible. Running it now
        # rather than on_commit is what lets TestCase see the result without
        # capturing commit callbacks.
        _run(document_id)
        return EAGER

    if mode == THREAD:
        # on_commit, because the thread uses a different connection and
        # would not see an uncommitted row.
        transaction.on_commit(lambda: _run_in_thread(document_id))
        return THREAD

    if mode == WORKER:
        # Nothing to do. The row's `uploaded` status is the queue entry.
        logger.info('Document %s queued for the processing worker', document_id)
        return WORKER

    raise ValueError(
        f'Unknown RAG_TASK_DISPATCH {mode!r}. Expected one of: '
        f'{EAGER}, {THREAD}, {WORKER}.'
    )
