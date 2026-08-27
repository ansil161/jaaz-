"""The contract every document parser implements.

Adding a format means writing one class and adding one line to the registry.
Nothing downstream of extraction — the normalizer, the chunker, the embedder,
the vector store — knows or cares what a PDF is.

Extraction produces *segments* rather than one string. A segment is the
smallest unit the source format can attribute: a PDF page, a DOCX paragraph
run. Each carries its own metadata, which survives into the chunk and is what
lets a future answer cite "Product Guide, page 12" instead of just "Product
Guide".
"""

from dataclasses import dataclass, field
from typing import Protocol


class ExtractionError(Exception):
    """The file could not be read as its declared format.

    The message is shown to an administrator, so it says what to do about it
    and nothing about the library that raised it.
    """

    def __init__(self, message):
        super().__init__(message)
        self.message = message


@dataclass(frozen=True)
class ExtractedSegment:
    text: str
    metadata: dict = field(default_factory=dict)


@dataclass(frozen=True)
class ExtractedDocument:
    segments: list[ExtractedSegment]

    @property
    def text(self) -> str:
        return '\n\n'.join(segment.text for segment in self.segments if segment.text)

    @property
    def is_empty(self) -> bool:
        return not self.text.strip()


class TextExtractor(Protocol):
    """Reads a binary stream and returns its text.

    Implementations must not write to disk, spawn a process, follow a link
    out of the document, or evaluate anything the file contains. A document
    is untrusted input; extraction is a read.
    """

    kind_key: str

    def extract(self, stream) -> ExtractedDocument: ...
