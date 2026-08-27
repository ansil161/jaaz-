"""Conversations and messages.

WHY THEY LIVE HERE AND NOT IN ai_service. Django owns the database, the
users, and the rules about who may see what. Keeping chat history beside the
accounts it belongs to means one set of access rules rather than two that can
disagree, one backup, and one place to answer a deletion request.

It also keeps ai_service stateless, which is what lets it scale horizontally
and be redeployed without a migration. It receives the relevant turns in the
request and stores nothing.

WHAT IS NOT STORED. Retrieved chunk text. A conversation keeps the *citation*
for each answer — document id, name, page — but not the passages themselves.
Those already exist in the knowledge base; copying them into every message
would duplicate the corpus into the message table, and would mean a document
deleted for a good reason lived on inside old conversations.
"""

import uuid

from django.conf import settings
from django.db import models


# The order the conversation sidebar is read in, named rather than written
# inline in Meta.
#
# It has to be named because `Meta.ordering` is NOT applied to a query that
# groups, and Django adds a GROUP BY to any queryset carrying an aggregate —
# `.annotate(Count('messages'))`, which is exactly how the list view counts
# messages. The resulting SQL has no ORDER BY at all and Postgres returns
# rows in whatever order it finds them. `ConversationService.list()` applies
# this explicitly for that reason; an explicit `order_by` does survive
# grouping.
CONVERSATION_ORDERING = ('-updated_at', '-created_at', 'id')


class MessageRole(models.TextChoices):
    USER = 'user', 'User'
    ASSISTANT = 'assistant', 'Assistant'
    SYSTEM = 'system', 'System'


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        # A conversation belongs to one person and has no meaning without
        # them. Deleting the account deletes the history — which is also what
        # a deletion request expects.
        on_delete=models.CASCADE,
        related_name='conversations',
    )
    # Derived from the first question, so a sidebar is readable without
    # anyone naming anything.
    title = models.CharField(max_length=200, default='New conversation')

    created_at = models.DateTimeField(auto_now_add=True)
    # Touched on every message, because the sidebar sorts by recency and a
    # conversation's usefulness is measured by its last turn, not its first.
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        # `created_at` and `id` are tiebreakers, not decoration: two
        # conversations touched in the same instant would otherwise come back
        # in whatever order the database felt like, and the sidebar would
        # reshuffle between page loads.
        #
        # This covers plain queries only. See CONVERSATION_ORDERING above for
        # why the list view cannot rely on it.
        ordering = CONVERSATION_ORDERING
        indexes = [
            # The conversation list: one user's, newest first, on every load.
            models.Index(fields=('user', '-updated_at')),
        ]

    def __str__(self):
        return self.title


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )

    role = models.CharField(max_length=16, choices=MessageRole.choices)
    content = models.TextField()

    # Citations only — document id, name, page, chunk id. Never the retrieved
    # text. See the module docstring.
    sources = models.JSONField(default=list, blank=True)
    # Provider, model, latencies, token counts. What the answer cost and
    # where it came from; useful for cost tracking and for explaining a slow
    # reply after the fact.
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('created_at', 'id')
        indexes = [
            models.Index(fields=('conversation', 'created_at')),
        ]

    def __str__(self):
        return f'{self.role}: {self.content[:60]}'
