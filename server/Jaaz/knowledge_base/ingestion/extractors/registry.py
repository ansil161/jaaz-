"""Kind → extractor.

The single place that knows the mapping. Supporting HTML or CSV tomorrow is
a new module beside this one and a new entry below; nothing else in the
codebase changes, because nothing else in the codebase names a file format.
"""

from .base import ExtractionError
from .docx import DocxExtractor
from .pdf import PdfExtractor
from .plain_text import MarkdownExtractor, PlainTextExtractor

_EXTRACTORS = {
    extractor.kind_key: extractor
    for extractor in (
        PdfExtractor(),
        DocxExtractor(),
        MarkdownExtractor(),
        PlainTextExtractor(),
    )
}


def extractor_for(kind_key):
    """Return the extractor for a document kind.

    Raises ExtractionError rather than KeyError: reaching here with an
    unknown kind means a document was stored with a kind the pipeline cannot
    read, which is a processing failure the administrator should see as one.
    """
    extractor = _EXTRACTORS.get(kind_key)
    if extractor is None:
        raise ExtractionError('This document type can no longer be processed.')
    return extractor


def supported_kind_keys():
    return tuple(_EXTRACTORS)
