"""Splitting a document into retrievable passages.

A chunk is what a search actually returns, so its size is the central
retrieval trade-off. Too small and a passage loses the context that makes it
an answer. Too large and the embedding averages several topics together,
matching everything vaguely and nothing well.

The strategy is to split on the boundaries the author already wrote —
paragraph, then sentence — and only cut mid-sentence when a single sentence
is longer than the hard maximum. Overlap carries the tail of each chunk into
the next, so a fact that straddles a boundary is retrievable from either
side.

All four numbers come from configuration. None of them are correct in the
abstract: they depend on the embedding model's context window and on how the
documents are written.
"""

import re
from dataclasses import dataclass, field

from ..config import ChunkingConfig

# Sentence boundary: terminator, optional closing quote or bracket, then
# whitespace. Deliberately simple — it mis-splits "Dr. Smith" and similar,
# which costs a slightly odd boundary in a chunk that still contains both
# halves thanks to the overlap. A real sentence segmenter is a dependency and
# a model download, and this is not the part of the pipeline that limits
# retrieval quality.
_SENTENCE_BOUNDARY = re.compile(r'(?<=[.!?])["\')\]]?\s+')
_PARAGRAPH_BOUNDARY = re.compile(r'\n\s*\n')

# Characters per token. A rough constant rather than a real tokeniser: the
# count is used for context budgeting and display, never for a decision that
# has to be exact, and the true ratio is model-specific.
_CHARS_PER_TOKEN = 4


def estimate_tokens(text: str) -> int:
    return max(1, round(len(text) / _CHARS_PER_TOKEN))


@dataclass(frozen=True)
class Chunk:
    index: int
    content: str
    token_count: int
    metadata: dict = field(default_factory=dict)


@dataclass
class _Piece:
    """A paragraph, with the source metadata it inherited."""

    text: str
    metadata: dict


def _merge_metadata(pieces):
    """Combine the source metadata of everything that went into a chunk.

    Pages accumulate into a list because a chunk routinely spans two.

    The heading is the FIRST one the chunk contains, not the last. A chunk
    that spans a section boundary starts in one section and ends in the next,
    and the heading is used to tell a reader where to look — so it has to name
    the section the passage begins in. Taking the last one sent them past the
    text they were checking: a chunk opening with a specification table and
    running into the next heading was cited as that next heading, which is
    both wrong and confusing, because the table is nowhere near it.
    """
    pages = []
    heading = None
    tables = []

    for piece in pieces:
        page = piece.metadata.get('page')
        if page is not None and page not in pages:
            pages.append(page)
        if heading is None and piece.metadata.get('heading'):
            heading = piece.metadata['heading']
        table = piece.metadata.get('table')
        if table is not None and table not in tables:
            tables.append(table)

    metadata = {}
    if pages:
        metadata['pages'] = pages
    if heading:
        metadata['heading'] = heading
    if tables:
        metadata['tables'] = tables
    return metadata


class TextChunker:
    def __init__(self, config: ChunkingConfig):
        self._config = config

    # -- public ---------------------------------------------------------

    def chunk(self, segments) -> list[Chunk]:
        """Split extracted segments into chunks, preserving their metadata."""
        pieces = self._to_pieces(segments)
        groups = self._group(pieces)
        groups = self._absorb_runt(groups)
        return self._to_chunks(groups)

    # -- internals ------------------------------------------------------

    def _to_pieces(self, segments):
        """Flatten segments to paragraphs, splitting any that are too long."""
        pieces = []
        for segment in segments:
            for paragraph in _PARAGRAPH_BOUNDARY.split(segment.text):
                paragraph = paragraph.strip()
                if not paragraph:
                    continue
                for part in self._split_oversized(paragraph):
                    pieces.append(_Piece(text=part, metadata=segment.metadata))
        return pieces

    def _split_oversized(self, text):
        """Break a paragraph longer than the hard maximum into pieces.

        Sentences first. A single sentence over the maximum — a minified
        table of contents, a wall of comma-separated part numbers — is cut on
        a word boundary, and failing that mid-word, because the alternative
        is one chunk the size of the document.
        """
        maximum = self._config.maximum
        if len(text) <= maximum:
            return [text]

        parts = []
        buffer = ''
        for sentence in _SENTENCE_BOUNDARY.split(text):
            sentence = sentence.strip()
            if not sentence:
                continue
            if len(sentence) > maximum:
                if buffer:
                    parts.append(buffer)
                    buffer = ''
                parts.extend(self._hard_split(sentence, maximum))
                continue
            candidate = f'{buffer} {sentence}'.strip()
            if len(candidate) > maximum and buffer:
                parts.append(buffer)
                buffer = sentence
            else:
                buffer = candidate
        if buffer:
            parts.append(buffer)
        return parts

    @staticmethod
    def _hard_split(text, maximum):
        """Cut at `maximum`, preferring the last space in the window.

        Always advances by at least one character, so this terminates on any
        input — including text with no spaces at all.
        """
        parts = []
        while text:
            if len(text) <= maximum:
                parts.append(text)
                break
            window = text[:maximum]
            cut = window.rfind(' ')
            # Only honour a space in the last quarter; a space at position 3
            # of a 2400-character window would produce a useless sliver.
            if cut < maximum * 3 // 4:
                cut = maximum
            parts.append(text[:cut].strip())
            text = text[cut:].strip()
        return [part for part in parts if part]

    def _group(self, pieces):
        """Pack paragraphs into groups of roughly `size` characters."""
        target = self._config.size
        groups = []
        current = []
        length = 0

        for piece in pieces:
            addition = len(piece.text) + (2 if current else 0)
            if current and length + addition > target:
                groups.append(current)
                current = []
                length = 0
                addition = len(piece.text)
            current.append(piece)
            length += addition

        if current:
            groups.append(current)
        return groups

    def _absorb_runt(self, groups):
        """Fold a too-short final group back into the one before it.

        A trailing "Page 14 of 14" is not a passage anyone should retrieve,
        and on its own it is a chunk that matches short queries far too well.
        """
        minimum = self._config.minimum
        if len(groups) < 2:
            return groups

        tail = groups[-1]
        tail_length = sum(len(piece.text) for piece in tail)
        if tail_length >= minimum:
            return groups

        previous_length = sum(len(piece.text) for piece in groups[-2])
        if previous_length + tail_length > self._config.maximum:
            return groups

        return groups[:-2] + [groups[-2] + tail]

    def _to_chunks(self, groups):
        chunks = []
        previous_content = ''

        for index, group in enumerate(groups):
            body = '\n\n'.join(piece.text for piece in group)
            prefix = self._overlap_from(previous_content) if index else ''
            content = f'{prefix}\n\n{body}'.strip() if prefix else body

            chunks.append(
                Chunk(
                    index=index,
                    content=content,
                    token_count=estimate_tokens(content),
                    metadata=_merge_metadata(group),
                )
            )
            # Overlap comes from the group's own text, not from the content
            # with the previous overlap already glued on — otherwise each
            # chunk inherits a little more of the one before it and the tail
            # of the document is mostly a copy of its head.
            previous_content = body

        return chunks

    def _overlap_from(self, text):
        """The trailing `overlap` characters of the previous chunk.

        Cut forward to the next word boundary so the overlap never begins in
        the middle of a word.
        """
        overlap = self._config.overlap
        if overlap <= 0 or not text:
            return ''

        tail = text[-overlap:]
        space = tail.find(' ')
        if space != -1:
            tail = tail[space + 1:]
        return tail.strip()
