"""Shared test scaffolding.

Two things every knowledge-base test needs and neither should reach for a
network to get:

  * a storage root that is a temporary directory, so uploads never touch the
    real media volume and disappear when the class finishes;
  * an embedding provider that runs in-process. The default `hashing`
    provider already does, which is most of why it exists — the suite has no
    API key, makes no HTTP request, and costs nothing to run. `FakeProvider`
    below is for the cases that need to *observe* or *break* the call.
"""

import io
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from account.models import AccountProfile, AccountStatus
from knowledge_base.embeddings.base import EmbeddingError

PASSWORD = 'correct-horse-battery-staple'


class FastArgon2Hasher(Argon2PasswordHasher):
    """Argon2id with the cost parameters turned down, for this suite only.

    Production settings give Argon2 a ~100MB working set per hash, which is
    the point of it. These tests create users and sign them in dozens of
    times and are not testing password storage at all — account/tests.py owns
    that, against the real hasher. Paying a hundred megabytes per call here
    buys nothing and makes an unrelated suite fail on a busy machine with
    "Memory allocation error".

    Still argon2id, so anything that inspects the hash prefix behaves the
    same.
    """

    memory_cost = 64
    time_cost = 1
    parallelism = 1


FAST_HASHERS = ['knowledge_base.tests.support.FastArgon2Hasher']

DOCUMENTS_URL = '/api/admin/knowledge-base/documents/'
SEARCH_URL = '/api/admin/knowledge-base/search/'


def document_url(document_id, suffix=''):
    return f'{DOCUMENTS_URL}{document_id}/{suffix}'


def make_user(email, *, is_staff=False):
    user = get_user_model().objects.create_user(
        username=email.split('@')[0],
        email=email,
        password=PASSWORD,
        is_staff=is_staff,
    )
    AccountProfile.objects.create(user=user, status=AccountStatus.ACTIVE)
    return user


# -- file builders ------------------------------------------------------

def text_upload(name='notes.txt', body='Hello world. ' * 40):
    return SimpleUploadedFile(name, body.encode('utf-8'), content_type='text/plain')


def markdown_upload(name='guide.md', body='# Title\n\nSome guidance here.\n'):
    return SimpleUploadedFile(name, body.encode('utf-8'), content_type='text/markdown')


def pdf_bytes(pages):
    """A minimal but genuinely valid PDF, built without a writer library.

    Hand-assembling the object table keeps the fixtures in-repo and readable,
    and means the PDF tests exercise pypdf against a real file rather than a
    mock of it.
    """
    objects = []
    page_ids = []
    next_id = 3

    contents = []
    for text in pages:
        escaped = text.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')
        stream = f'BT /F1 12 Tf 72 720 Td ({escaped}) Tj ET'
        contents.append(stream)

    for index, stream in enumerate(contents):
        page_id = next_id + index * 2
        content_id = page_id + 1
        page_ids.append(page_id)
        objects.append(
            (
                page_id,
                f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
                f'/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 '
                f'/BaseFont /Helvetica >> >> >> /Contents {content_id} 0 R >>',
            )
        )
        objects.append(
            (
                content_id,
                f'<< /Length {len(stream)} >>\nstream\n{stream}\nendstream',
            )
        )

    kids = ' '.join(f'{page_id} 0 R' for page_id in page_ids)
    objects.insert(0, (1, '<< /Type /Catalog /Pages 2 0 R >>'))
    objects.insert(
        1, (2, f'<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>')
    )
    objects.sort(key=lambda item: item[0])

    out = bytearray(b'%PDF-1.4\n')
    offsets = {}
    for number, body in objects:
        offsets[number] = len(out)
        out += f'{number} 0 obj\n{body}\nendobj\n'.encode('latin-1')

    xref_at = len(out)
    highest = max(offsets) + 1
    out += f'xref\n0 {highest}\n'.encode('latin-1')
    out += b'0000000000 65535 f \n'
    for number in range(1, highest):
        offset = offsets.get(number, 0)
        out += f'{offset:010d} 00000 n \n'.encode('latin-1')
    out += (
        f'trailer\n<< /Size {highest} /Root 1 0 R >>\n'
        f'startxref\n{xref_at}\n%%EOF\n'
    ).encode('latin-1')
    return bytes(out)


def pdf_upload(name='manual.pdf', pages=None):
    pages = pages or ['The warranty period is thirty six months from delivery.']
    return SimpleUploadedFile(name, pdf_bytes(pages), content_type='application/pdf')


def docx_bytes(paragraphs):
    from docx import Document as DocxDocument

    document = DocxDocument()
    for paragraph in paragraphs:
        document.add_paragraph(paragraph)
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


def docx_upload(name='policy.docx', paragraphs=None):
    paragraphs = paragraphs or ['Returns are accepted within fourteen days.']
    return SimpleUploadedFile(
        name,
        docx_bytes(paragraphs),
        content_type=(
            'application/vnd.openxmlformats-officedocument'
            '.wordprocessingml.document'
        ),
    )


# -- embedding doubles --------------------------------------------------

class FakeProvider:
    """Records what it was asked to embed, and returns fixed-width vectors."""

    name = 'fake'

    def __init__(self, dimensions=8, model='fake-model'):
        self.dimensions = dimensions
        self.model = model
        self.calls = []

    def embed_batch(self, texts):
        self.calls.append(list(texts))
        # A vector that varies with the text, so different chunks are not all
        # identical and ranking tests mean something.
        return [
            [float((len(text) + offset) % 7) + 1.0 for offset in range(self.dimensions)]
            for text in texts
        ]


class BrokenProvider:
    """Fails the way a rate-limited or unreachable provider does."""

    name = 'broken'
    model = 'broken-model'
    dimensions = 8

    def __init__(self, retryable=True):
        self._retryable = retryable

    def embed_batch(self, texts):
        raise EmbeddingError(
            'The embedding service is not responding. Retry the document shortly.',
            retryable=self._retryable,
        )


# -- base case ----------------------------------------------------------

def isolated_storage_settings(location):
    return {
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'
        },
        'knowledge_base': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
            'OPTIONS': {'location': location, 'base_url': None},
        },
    }


class KnowledgeBaseTestCase(APITestCase):
    """Temporary storage, in-process embeddings, inline processing."""

    @classmethod
    def setUpClass(cls):
        cls._media_root = tempfile.mkdtemp(prefix='jaaz-kb-test-')
        cls._overrides = override_settings(
            PASSWORD_HASHERS=FAST_HASHERS,
            STORAGES=isolated_storage_settings(cls._media_root),
            KNOWLEDGE_BASE={
                **cls._base_knowledge_base_settings(),
            },
        )
        cls._overrides.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._overrides.disable()
        shutil.rmtree(cls._media_root, ignore_errors=True)

    @classmethod
    def _base_knowledge_base_settings(cls):
        from django.conf import settings

        return {
            **settings.KNOWLEDGE_BASE,
            'EMBEDDING_PROVIDER': 'hashing',
            'EMBEDDING_DIMENSIONS': 64,
            # Inline, so a test can assert on the outcome without waiting for
            # a thread or running a worker.
            'TASK_DISPATCH': 'eager',
            # Pinned for the same reason as the two above: a test must not
            # depend on how this particular machine is deployed. Without it
            # the suite inherits RAG_VECTOR_STORE from .env, and setting that
            # to 'ai_service' — the correct production value — made thirty
            # knowledge-base tests fail against a service that is not running.
            #
            # A test that wants the ai_service store overrides this itself.
            'VECTOR_STORE': 'postgres',
        }

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    # -- helpers ---------------------------------------------------------

    def sign_in(self, user):
        response = self.client.post(
            '/api/auth/login/',
            {'email': user.email, 'password': PASSWORD},
            format='json',
        )
        self.assertEqual(response.status_code, 200, response.content)

    def error_code(self, response):
        return response.json()['error']['code']
