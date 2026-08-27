from django.urls import path

from . import views

app_name = 'chat'

urlpatterns = [
    path('health/', views.AssistantHealthView.as_view(), name='health'),
    path(
        'conversations/',
        views.ConversationListCreateView.as_view(),
        name='conversations',
    ),
    path(
        'conversations/<uuid:conversation_id>/',
        views.ConversationDetailView.as_view(),
        name='conversation-detail',
    ),
    path(
        'conversations/<uuid:conversation_id>/messages/',
        views.AskView.as_view(),
        name='ask',
    ),
    path(
        'conversations/<uuid:conversation_id>/messages/stream/',
        views.AskStreamView.as_view(),
        name='ask-stream',
    ),
    path(
        'conversations/<uuid:conversation_id>/regenerate/',
        views.RegenerateView.as_view(),
        name='regenerate',
    ),
]
