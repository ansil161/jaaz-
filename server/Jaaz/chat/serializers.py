"""Wire contracts for the chat API. camelCase out, matching the rest."""

from django.conf import settings
from rest_framework import serializers


class ConversationSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    messageCount = serializers.SerializerMethodField()

    def get_messageCount(self, conversation):
        # Annotated by the list view; falls back to a query for the detail
        # view, where there is exactly one object and N+1 is not a concern.
        return getattr(conversation, 'message_count', None) or \
            conversation.messages.count()


class MessageSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    role = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True)
    sources = serializers.JSONField(read_only=True)
    metadata = serializers.JSONField(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)


class ConversationDetailSerializer(ConversationSerializer):
    messages = serializers.SerializerMethodField()

    def get_messages(self, conversation):
        return MessageSerializer(conversation.messages.all(), many=True).data


class CreateConversationSerializer(serializers.Serializer):
    title = serializers.CharField(
        required=False, allow_blank=True, max_length=200, trim_whitespace=True
    )


class AskSerializer(serializers.Serializer):
    message = serializers.CharField(
        trim_whitespace=True,
        error_messages={
            'required': 'Enter a question.',
            'blank': 'Enter a question.',
        },
    )
    # Narrows retrieval to chosen documents. ai_service intersects this with
    # what the caller is allowed to see; it can never widen the scope.
    documentIds = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False, allow_empty=True, max_length=50,
    )

    def validate_message(self, value):
        limit = settings.CHAT['MAX_MESSAGE_CHARACTERS']
        if len(value) > limit:
            raise serializers.ValidationError(
                f'That question is too long. The limit is {limit} characters.'
            )
        return value
