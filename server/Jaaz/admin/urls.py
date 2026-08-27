from django.urls import include, path

from . import views

app_name = 'adminpanel'

urlpatterns = [
    path('overview/', views.OverviewView.as_view(), name='overview'),
    # The knowledge base is a domain of its own — its models and services
    # live in the `knowledge_base` app, because the future chatbot will read
    # from them and a chatbot is not an admin surface. Only its *management*
    # API is mounted here, where the console expects to find it.
    path('knowledge-base/', include('knowledge_base.api.urls')),
]
