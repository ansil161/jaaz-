import logging
from celery import shared_task
from django.db import connection

logger = logging.getLogger('jaaz.knowledge_base')


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def process_document_task(self, document_id: int):
    """Celery task to ingest and process a knowledge-base document."""
    from .services.processing import DocumentProcessingService

    logger.info('Celery task starting processing for document %s', document_id)
    try:
        outcome = DocumentProcessingService().process(document_id)
        return {'document_id': document_id, 'outcome': str(outcome)}
    except Exception as exc:
        logger.exception('Celery task failed processing document %s', document_id)
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc)
        raise
    finally:
        connection.close()
