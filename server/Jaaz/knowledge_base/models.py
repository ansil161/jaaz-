"""Knowledge-base schema.

Two tables. `Document` is metadata plus a reference to a file held in object
storage — the bytes are never in the database. `DocumentChunk` is the unit a
retrieval query actually matches against, and it keeps its link back to the
document so an answer can cite where it came from.

The embedding lives on the chunk row rather than in a separate vector table.
That is deliberate: with no vector extension installed, a separate table
would buy nothing but a join, and keeping the vector beside the text it
encodes means a chunk can never be retrieved without the content and source
that make it citable.
"""

import uuid

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models


class DocumentStatus(models.TextChoices):
    """The processing lifecycle.

        UPLOADED → PROCESSING → CHUNKING → EMBEDDING → READY
                        └──────────┴───────────┴──────→ FAILED

    The intermediate states exist so a large document that takes a minute to
    ingest can tell an administrator *what* it is doing, not just that it is
    busy. UPLOADED doubles as the queue: it means "claimable by a worker".
    """

    UPLOADED = 'uploaded', 'Uploaded'
    PROCESSING = 'processing', 'Processing'
    CHUNKING = 'chunking', 'Chunking'
    EMBEDDING = 'embedding', 'Embedding'
    READY = 'ready', 'Ready'
    FAILED = 'failed', 'Failed'

    @classmethod
    def in_progress(cls):
        return (cls.PROCESSING, cls.CHUNKING, cls.EMBEDDING)


class Document(models.Model):
    # A UUID primary key, not a sequence. It becomes part of the storage key,
    # and a sequential id there would let anyone who obtains one path infer
    # the others.
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255, db_index=True)
    original_filename = models.CharField(max_length=255)
    # Detected from the file's own bytes during upload — never the value the
    # browser claimed. See ingestion/detection.py.
    content_type = models.CharField(max_length=127)
    file_size = models.PositiveBigIntegerField()
    storage_key = models.CharField(max_length=512, unique=True)
    # SHA-256 of the uploaded bytes. Lets the API warn about a re-upload of
    # something already in the knowledge base, and gives processing a way to
    # tell "same file" from "same name".
    checksum = models.CharField(max_length=64, db_index=True)

    status = models.CharField(
        max_length=16,
        choices=DocumentStatus.choices,
        default=DocumentStatus.UPLOADED,
        db_index=True,
    )
    # Short, safe, and written for a person. The stack trace goes to the log.
    error_message = models.TextField(blank=True, default='')
    error_code = models.CharField(max_length=64, blank=True, default='')

    processing_attempts = models.PositiveIntegerField(default=0)
    # Set when a worker claims the row; used to reclaim documents abandoned
    # by a worker that died mid-ingest.
    processing_started_at = models.DateTimeField(null=True, blank=True)

    chunk_count = models.PositiveIntegerField(default=0)
    character_count = models.PositiveBigIntegerField(default=0)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        # The document outlives the account that uploaded it. Losing the
        # knowledge base because someone left is not an acceptable cascade.
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='knowledge_documents',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            # The document list is filtered by status and sorted by recency
            # in the same query, on every page load.
            models.Index(fields=('status', '-created_at')),
        ]

    def __str__(self):
        return self.name

    @property
    def is_processing(self):
        return self.status in DocumentStatus.in_progress()

    @property
    def can_retry(self):
        return self.status == DocumentStatus.FAILED


class DocumentChunk(models.Model):
    """One retrievable passage.

    Everything a citation needs is reachable from here: the chunk's own text,
    its position, and the document it came from. Nothing in the pipeline is
    allowed to produce a chunk that has lost its source.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='chunks',
    )

    chunk_index = models.PositiveIntegerField()
    content = models.TextField()
    # Estimated, not exact — see ingestion/chunker.py. Stored so a retrieval
    # caller can budget an LLM context window without re-counting.
    token_count = models.PositiveIntegerField(default=0)

    # A plain Postgres `double precision[]`. pgvector is not installed on the
    # target database, so there is no `vector` column and no ANN index; the
    # store does an exact scan instead. Swapping in pgvector means adding a
    # provider and a column, not reshaping this model. See
    # vector_store/providers/postgres.py for the trade-off in full.
    #
    # Null while a chunk exists but has not been embedded yet — the window
    # between CHUNKING and EMBEDDING.
    embedding = ArrayField(models.FloatField(), null=True, blank=True)
    # Which model produced the vector. Vectors from different models are not
    # comparable, so retrieval filters on this rather than silently mixing
    # coordinate spaces.
    embedding_model = models.CharField(max_length=127, blank=True, default='')
    embedding_dimensions = models.PositiveIntegerField(null=True, blank=True)

    # Extractor-supplied context: page number, heading, sheet name. Kept open
    # so a new parser can enrich citations without a migration.
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('document_id', 'chunk_index')
        constraints = [
            # Re-processing replaces chunks wholesale; this is what makes a
            # half-finished retry impossible to confuse with a complete one.
            models.UniqueConstraint(
                fields=('document', 'chunk_index'),
                name='unique_chunk_index_per_document',
            ),
        ]
        indexes = [
            models.Index(fields=('embedding_model',)),
        ]

    def __str__(self):
        return f'{self.document_id}#{self.chunk_index}'
