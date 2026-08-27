from django.apps import AppConfig


class KnowledgeBaseConfig(AppConfig):
    """The knowledge base: document ingestion, chunking, embeddings, retrieval.

    A domain app, not an admin app. Its HTTP surface happens to be mounted
    under /api/admin/ because administrators are who manage it today, but the
    models and services here are the knowledge that a future chatbot will
    retrieve from — and that chatbot will not be an admin surface. Keeping
    the domain out of `admin` is what stops ingestion from being coupled to
    the console.
    """

    name = 'knowledge_base'
    label = 'knowledge_base'
    verbose_name = 'Knowledge base'
