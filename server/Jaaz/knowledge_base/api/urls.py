from django.urls import path

from . import views

app_name = 'knowledge_base'

urlpatterns = [
    path('documents/', views.DocumentListCreateView.as_view(), name='documents'),
    path(
        'documents/<uuid:document_id>/',
        views.DocumentDetailView.as_view(),
        name='document-detail',
    ),
    path(
        'documents/<uuid:document_id>/chunks/',
        views.DocumentChunksView.as_view(),
        name='document-chunks',
    ),
    path(
        'documents/<uuid:document_id>/retry/',
        views.DocumentRetryView.as_view(),
        name='document-retry',
    ),
    path(
        'documents/<uuid:document_id>/reprocess/',
        views.DocumentReprocessView.as_view(),
        name='document-reprocess',
    ),
    path('search/', views.DocumentSearchView.as_view(), name='search'),
]
