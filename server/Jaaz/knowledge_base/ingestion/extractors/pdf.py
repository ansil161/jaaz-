"""PDF extraction, one segment per page.

Per-page segments are the whole reason this is not a single string: page
number is the citation an administrator can actually check, and it is
available here and nowhere later in the pipeline.

The common failure is a scanned PDF — pages of images with no text layer.
pypdf returns empty strings for those quite happily, so this raises instead
of quietly ingesting a document that will retrieve nothing. OCR is out of
scope; the message says so in terms a person can act on.
"""

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .base import ExtractedDocument, ExtractedSegment, ExtractionError


class PdfExtractor:
    kind_key = 'pdf'

    def extract(self, stream) -> ExtractedDocument:
        stream.seek(0)

        try:
            reader = PdfReader(stream)
            if reader.is_encrypted:
                # An empty user password is common and pypdf can open those;
                # anything else needs a password we do not have.
                try:
                    reader.decrypt('')
                except Exception as exc:
                    raise ExtractionError(
                        'This PDF is password protected. Remove the password '
                        'and upload it again.'
                    ) from exc
            pages = reader.pages
        except ExtractionError:
            raise
        except (PdfReadError, OSError, ValueError) as exc:
            raise ExtractionError(
                'This PDF could not be read. It may be corrupt.'
            ) from exc

        segments = []
        for number, page in enumerate(pages, start=1):
            try:
                text = page.extract_text() or ''
            except Exception:
                # One unreadable page should not lose the other two hundred.
                # The gap is recorded in the log by the caller's page count.
                continue
            if text.strip():
                segments.append(
                    ExtractedSegment(text=text, metadata={'page': number})
                )

        if not segments:
            raise ExtractionError(
                'No text could be read from this PDF. If it is a scan, it '
                'needs to be run through OCR before it can be used.'
            )

        return ExtractedDocument(segments)
