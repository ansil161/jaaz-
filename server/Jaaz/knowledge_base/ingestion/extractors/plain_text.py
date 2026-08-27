"""Plain text and Markdown.

Markdown is handled here rather than in its own parser because for retrieval
purposes it *is* text — and usefully structured text at that. Headings are
kept: they are often the best summary of the passage beneath them, and a
chunk that begins with one retrieves better than the same prose without it.

What is stripped is the syntax that adds no meaning to a reader and only
noise to an embedding: image tags, link URLs, code-fence markers.
"""

import re

from .base import ExtractedDocument, ExtractedSegment, ExtractionError

# ![alt](url) → alt. The URL is not prose and embeds as gibberish.
_IMAGE = re.compile(r'!\[([^\]]*)\]\([^)]*\)')
# [text](url) → text, for the same reason.
_LINK = re.compile(r'\[([^\]]+)\]\([^)]*\)')
# Fence markers only; the code between them is kept, because an API snippet
# is frequently the answer to the question being asked.
_FENCE = re.compile(r'^\s*```.*$', re.MULTILINE)
_HEADING_MARKS = re.compile(r'^\s{0,3}#{1,6}\s+', re.MULTILINE)


class PlainTextExtractor:
    kind_key = 'txt'

    def _decode(self, stream):
        stream.seek(0)
        payload = stream.read()
        try:
            # utf-8-sig so a BOM written by Notepad does not become a
            # zero-width character at the head of the first chunk.
            return payload.decode('utf-8-sig')
        except UnicodeDecodeError as exc:
            raise ExtractionError(
                'This file is not valid UTF-8 text and could not be read.'
            ) from exc

    def extract(self, stream) -> ExtractedDocument:
        text = self._decode(stream)
        if not text.strip():
            raise ExtractionError('This file is empty.')
        return ExtractedDocument([ExtractedSegment(text=text, metadata={})])


# A heading line, with its words captured so they can be carried as metadata.
_HEADING_LINE = re.compile(r'^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$')


class MarkdownExtractor(PlainTextExtractor):
    kind_key = 'md'

    def extract(self, stream) -> ExtractedDocument:
        """One segment per heading, each tagged with the heading it sits under.

        A segment is the smallest unit the format can attribute — see the
        note in base.py. For a PDF that is a page; for Markdown it is a
        section, because a heading is the only thing in the format that says
        "what follows is about this".

        Returning the whole file as a single untagged segment (which is what
        this used to do) threw that away: every chunk reached the vector
        store with no `heading`, so an answer could cite the document but not
        the part of it, and a reader checking a citation had to search the
        file by hand.

        The heading text stays in the body as well as the metadata. It is
        usually the best one-line summary of the passage beneath it, and a
        chunk that begins with it retrieves better than the same prose
        without it.
        """
        text = self._decode(stream)
        text = _IMAGE.sub(r'\1', text)
        text = _LINK.sub(r'\1', text)
        text = _FENCE.sub('', text)

        if not text.strip():
            raise ExtractionError('This file is empty.')

        segments = []
        heading = None
        body: list[str] = []

        def flush():
            content = '\n'.join(body).strip()
            if content:
                segments.append(ExtractedSegment(
                    text=content,
                    metadata={'heading': heading} if heading else {},
                ))

        for line in text.splitlines():
            match = _HEADING_LINE.match(line)
            if match:
                # A new section starts here, so close the previous one.
                flush()
                heading = match.group(2).strip()
                body = [heading]
                continue
            body.append(line)

        flush()

        # A file with no headings at all is still one segment of prose, which
        # is the old behaviour and the right one.
        if not segments:
            return ExtractedDocument([
                ExtractedSegment(text=_HEADING_MARKS.sub('', text).strip(),
                                 metadata={})
            ])
        return ExtractedDocument(segments)
