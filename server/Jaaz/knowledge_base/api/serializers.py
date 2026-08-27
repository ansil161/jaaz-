"""Request validation and response shapes for the knowledge-base API.

camelCase on the way out, matching the auth API the console already consumes.

Every response serializer is an explicit allow-list rather than a
ModelSerializer over the whole row. The reason is the same one it was for
the user serializer: `storage_key` and `checksum` are on the model, they are
internal, and an `exclude` list leaks whatever field is added next.
"""

from rest_framework import serializers

from ..ingestion.detection import (
    SUPPORTED_EXTENSIONS,
    kind_for_content_type,
)
from ..models import DocumentStatus

# Long enough to judge whether a chunk is sensible, short enough that a
# preview of twenty chunks is not a megabyte of JSON.
_CHUNK_PREVIEW_LENGTH = 600


class DocumentSerializer(serializers.Serializer):
    """A document as the console lists and displays it.

    Note what is absent: `storage_key` and `checksum`. Neither is any use to
    the frontend, and the storage key is a path into the bucket.
    """

    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)
    originalFilename = serializers.CharField(source='original_filename', read_only=True)
    type = serializers.SerializerMethodField()
    contentType = serializers.CharField(source='content_type', read_only=True)
    fileSize = serializers.IntegerField(source='file_size', read_only=True)

    status = serializers.CharField(read_only=True)
    statusLabel = serializers.SerializerMethodField()
    # Already a safe, administrator-facing sentence by the time it is stored;
    # the processor is what guarantees that.
    errorMessage = serializers.CharField(source='error_message', read_only=True)
    errorCode = serializers.CharField(source='error_code', read_only=True)
    canRetry = serializers.BooleanField(source='can_retry', read_only=True)
    isProcessing = serializers.BooleanField(source='is_processing', read_only=True)

    chunkCount = serializers.IntegerField(source='chunk_count', read_only=True)
    characterCount = serializers.IntegerField(source='character_count', read_only=True)
    processingAttempts = serializers.IntegerField(
        source='processing_attempts', read_only=True
    )

    uploadedBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    processedAt = serializers.DateTimeField(source='processed_at', read_only=True)

    def get_type(self, document):
        kind = kind_for_content_type(document.content_type)
        return kind.label if kind else 'Unknown'

    def get_statusLabel(self, document):
        return DocumentStatus(document.status).label

    def get_uploadedBy(self, document):
        # The uploader's email, not the user object. A document list should
        # not become a way to enumerate accounts and their permissions.
        user = document.created_by
        if user is None:
            return None
        return user.get_full_name() or user.get_username()


class DocumentChunkSerializer(serializers.Serializer):
    """A chunk, for the detail view's preview.

    `content` is truncated. The full text of every chunk is the whole
    document again, and the preview exists to answer "did chunking do
    something sensible", which a few hundred characters settles.
    """

    id = serializers.UUIDField(read_only=True)
    chunkIndex = serializers.IntegerField(source='chunk_index', read_only=True)
    tokenCount = serializers.IntegerField(source='token_count', read_only=True)
    metadata = serializers.JSONField(read_only=True)
    embeddingModel = serializers.CharField(source='embedding_model', read_only=True)
    hasEmbedding = serializers.SerializerMethodField()
    contentPreview = serializers.SerializerMethodField()
    contentLength = serializers.SerializerMethodField()

    def get_hasEmbedding(self, chunk):
        return chunk.embedding is not None

    def get_contentPreview(self, chunk):
        content = chunk.content or ''
        if len(content) <= _CHUNK_PREVIEW_LENGTH:
            return content
        return f'{content[:_CHUNK_PREVIEW_LENGTH].rstrip()}…'

    def get_contentLength(self, chunk):
        return len(chunk.content or '')


class DocumentUploadSerializer(serializers.Serializer):
    """The upload request.

    Validation here is shallow on purpose: it checks that a file was sent and
    that the optional name is sane. Size and type are decided by the service
    from the file's own bytes — a serializer that trusted
    `file.content_type` would be trusting a header the client wrote.
    """

    file = serializers.FileField(
        error_messages={
            'required': 'Choose a file to upload.',
            'empty': 'That file is empty.',
        }
    )
    name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
        trim_whitespace=True,
    )

    def validate_name(self, value):
        return value.strip()


class DocumentSearchSerializer(serializers.Serializer):
    """A retrieval query — the endpoint the future chatbot's shape is proven by."""

    query = serializers.CharField(
        max_length=2000,
        trim_whitespace=True,
        error_messages={
            'required': 'Enter something to search for.',
            'blank': 'Enter something to search for.',
        },
    )
    topK = serializers.IntegerField(required=False, min_value=1, max_value=100)
    documentIds = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        max_length=50,
    )


class SearchHitSerializer(serializers.Serializer):
    chunkId = serializers.CharField(source='chunk_id')
    chunkIndex = serializers.IntegerField(source='chunk_index')
    content = serializers.CharField()
    score = serializers.FloatField()
    documentId = serializers.CharField(source='document_id')
    documentName = serializers.CharField(source='document_name')
    metadata = serializers.JSONField()


class SourceSerializer(serializers.Serializer):
    """A citation. This is the shape an answer's "Sources:" list is built from."""

    documentId = serializers.CharField(source='document_id')
    documentName = serializers.CharField(source='document_name')
    score = serializers.FloatField()
    chunkCount = serializers.IntegerField(source='chunk_count')


def supported_formats():
    """Advertised to the UI so the file picker and the server agree."""
    return {
        'extensions': list(SUPPORTED_EXTENSIONS),
    }
