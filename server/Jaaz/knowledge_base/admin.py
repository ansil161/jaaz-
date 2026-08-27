"""Django-admin views for the knowledge base.

An operator's backstop, not the product surface — that is the console. This
exists so someone with shell-level access can see why a document failed and
release a stuck one without a database client.

Read-only where it matters. Editing a chunk by hand would leave its content
and its embedding describing different text, which is invisible and poisons
every future search that touches it.
"""

from django.contrib import admin

from .models import Document, DocumentChunk, DocumentStatus


class DocumentChunkInline(admin.TabularInline):
    model = DocumentChunk
    extra = 0
    can_delete = False
    max_num = 0
    fields = ('chunk_index', 'token_count', 'embedding_model', 'metadata')
    readonly_fields = fields
    ordering = ('chunk_index',)

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'status',
        'content_type',
        'chunk_count',
        'processing_attempts',
        'created_by',
        'created_at',
    )
    list_filter = ('status', 'content_type', 'created_at')
    search_fields = ('name', 'original_filename', 'checksum')
    date_hierarchy = 'created_at'
    inlines = [DocumentChunkInline]

    readonly_fields = (
        'id',
        'original_filename',
        'content_type',
        'file_size',
        'storage_key',
        'checksum',
        'chunk_count',
        'character_count',
        'processing_attempts',
        'processing_started_at',
        'created_by',
        'created_at',
        'updated_at',
        'processed_at',
    )

    actions = ('requeue_documents',)

    @admin.action(description='Return selected documents to the processing queue')
    def requeue_documents(self, request, queryset):
        # Status only. Chunks are left alone: the vector store replaces them
        # atomically when processing finishes, so the document keeps
        # answering searches until its replacement is ready.
        updated = queryset.exclude(status__in=DocumentStatus.in_progress()).update(
            status=DocumentStatus.UPLOADED,
            error_code='',
            error_message='',
            processing_started_at=None,
        )
        self.message_user(request, f'{updated} document(s) returned to the queue.')


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ('document', 'chunk_index', 'token_count', 'embedding_model')
    list_filter = ('embedding_model',)
    search_fields = ('document__name',)
    # Every field, including content: a chunk edited apart from its embedding
    # is a chunk whose vector no longer describes it.
    readonly_fields = (
        'id',
        'document',
        'chunk_index',
        'content',
        'token_count',
        'embedding_model',
        'embedding_dimensions',
        'metadata',
        'created_at',
    )
    exclude = ('embedding',)

    def has_add_permission(self, request):
        return False
