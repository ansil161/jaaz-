"""Django-admin views for conversations.

Read-only. An operator may need to see why a conversation went wrong; nobody
should be editing what a user or a model said after the fact.
"""

from django.contrib import admin

from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    max_num = 0
    can_delete = False
    fields = ('role', 'content', 'created_at')
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'user__username', 'user__email')
    readonly_fields = ('id', 'user', 'created_at', 'updated_at')
    inlines = [MessageInline]
