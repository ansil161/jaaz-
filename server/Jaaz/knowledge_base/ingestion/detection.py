"""What kind of file is this, actually?

The browser tells us a filename and a Content-Type. Both are attacker-
controlled: `Content-Type` is a header the client writes, and an extension is
just the end of a string. Neither is evidence. This module decides from the
bytes.

Nothing here executes, renders, or interprets an upload — it reads a handful
of leading bytes, and for DOCX it opens the ZIP central directory to check
one entry exists. A file that does not match a supported kind is rejected
before it is ever written to storage.
"""

import zipfile
from dataclasses import dataclass

# Enough for every signature below, and small enough to read from a stream
# without buffering a document.
_MAGIC_READ_BYTES = 8

_PDF_MAGIC = b'%PDF-'
_ZIP_MAGIC = (b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08')
# Present in every Open Packaging Convention word-processing file.
_DOCX_ENTRY = 'word/document.xml'


class UnsupportedDocumentError(Exception):
    """The upload is not a document kind this knowledge base can ingest."""

    def __init__(self, message):
        super().__init__(message)
        self.message = message


@dataclass(frozen=True)
class DocumentKind:
    key: str
    label: str
    content_type: str
    extensions: tuple[str, ...]


PDF = DocumentKind('pdf', 'PDF', 'application/pdf', ('.pdf',))
DOCX = DocumentKind(
    'docx',
    'DOCX',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ('.docx',),
)
MARKDOWN = DocumentKind('md', 'Markdown', 'text/markdown', ('.md', '.markdown'))
PLAIN_TEXT = DocumentKind('txt', 'Text', 'text/plain', ('.txt', '.text'))

SUPPORTED_KINDS = (PDF, DOCX, MARKDOWN, PLAIN_TEXT)

SUPPORTED_EXTENSIONS = tuple(
    extension for kind in SUPPORTED_KINDS for extension in kind.extensions
)

_KIND_BY_KEY = {kind.key: kind for kind in SUPPORTED_KINDS}
_KIND_BY_CONTENT_TYPE = {kind.content_type: kind for kind in SUPPORTED_KINDS}


def kind_for_key(key):
    return _KIND_BY_KEY.get(key)


def kind_for_content_type(content_type):
    return _KIND_BY_CONTENT_TYPE.get(content_type)


def _extension_of(filename):
    _, _, tail = (filename or '').rpartition('.')
    return f'.{tail.lower()}' if tail and tail != filename else ''


def _is_text(payload):
    """Decodable as UTF-8 and free of NUL bytes.

    The NUL check matters: plenty of binary formats decode as UTF-8 by
    accident, and none of them contain a NUL in real prose.
    """
    if b'\x00' in payload:
        return False
    try:
        payload.decode('utf-8')
    except UnicodeDecodeError:
        return False
    return True


def _sniff(file_obj):
    """Return the kind the bytes say this is, or None."""
    file_obj.seek(0)
    head = file_obj.read(_MAGIC_READ_BYTES)
    file_obj.seek(0)

    if head.startswith(_PDF_MAGIC):
        return PDF

    if head.startswith(_ZIP_MAGIC):
        try:
            with zipfile.ZipFile(file_obj) as archive:
                names = set(archive.namelist())
        except (zipfile.BadZipFile, OSError):
            return None
        finally:
            file_obj.seek(0)
        # A DOCX is a ZIP, but so is every other OOXML file and every JAR.
        # The entry is what distinguishes it.
        return DOCX if _DOCX_ENTRY in names else None

    # Everything left is either text or unsupported. Reading it whole is
    # bounded — size was validated before this point.
    file_obj.seek(0)
    payload = file_obj.read()
    file_obj.seek(0)
    return PLAIN_TEXT if _is_text(payload) else None


def detect(file_obj, filename):
    """Identify an upload, or raise UnsupportedDocumentError.

    The extension is used for exactly one thing — telling Markdown from plain
    text, which are byte-identical — and is otherwise only checked for
    *agreement* with what the bytes say. A `.pdf` that is really a ZIP is
    rejected rather than quietly ingested as a DOCX: it is far more likely to
    be a mistake or an attempt than a legitimate upload.
    """
    extension = _extension_of(filename)
    sniffed = _sniff(file_obj)

    if sniffed is None:
        raise UnsupportedDocumentError(
            'That file type is not supported. Upload a PDF, DOCX, TXT or MD file.'
        )

    if sniffed is PLAIN_TEXT and extension in MARKDOWN.extensions:
        return MARKDOWN

    if extension and extension not in sniffed.extensions:
        # Text is the tolerant case: a .csv or .log is genuinely plain text
        # and ingesting it is harmless and useful. Binary formats are not.
        if sniffed is PLAIN_TEXT:
            return PLAIN_TEXT
        raise UnsupportedDocumentError(
            f'This file is named "{extension}" but its contents are '
            f'{sniffed.label}. Rename it or upload the correct file.'
        )

    return sniffed
