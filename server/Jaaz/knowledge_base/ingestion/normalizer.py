"""Turn extractor output into text worth embedding.

Every item here removes something that costs retrieval quality:

  * A soft hyphen or zero-width space makes "warranty" and "war\xadranty" two
    different strings to a tokeniser, so a search for one misses the other.
  * PDF extraction preserves the line wrapping of the printed page, which
    leaves words split across a newline mid-sentence.
  * Runs of blank lines are paragraph boundaries to the chunker, and a PDF
    that yields six of them between sections would fragment a chunk that
    should have stayed whole.

Nothing here changes meaning. It removes artefacts of the *file format* that
the author never wrote.
"""

import re
import unicodedata

# Zero-width and formatting characters that survive copy-paste and PDF
# extraction, and that are invisible to whoever is looking at the document
# wondering why a search does not match.
_INVISIBLE = re.compile(r'[­​‌‍﻿⁠]')

# Control characters other than tab and newline.
_CONTROL = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')

# "hyphen-\nated" → "hyphenated". Only when the next line starts lowercase:
# a capital usually means a genuine hyphenated proper noun that happened to
# fall at a line end, and joining those does more harm than good.
_LINE_BREAK_HYPHEN = re.compile(r'(\w)-\n(?=[a-z])')

# A single newline inside a paragraph is page wrapping, not a break the
# author made. Two or more is a real paragraph boundary and is preserved.
_SOFT_WRAP = re.compile(r'(?<!\n)\n(?!\n)')

_REPEATED_BLANK_LINES = re.compile(r'\n{3,}')
_REPEATED_SPACES = re.compile(r'[ \t]{2,}')
_TRAILING_SPACE = re.compile(r'[ \t]+$', re.MULTILINE)


def normalize(text: str) -> str:
    if not text:
        return ''

    # NFKC folds ligatures ("ﬁ" → "fi") and full-width forms into the plain
    # characters a query will be written with.
    text = unicodedata.normalize('NFKC', text)

    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = _INVISIBLE.sub('', text)
    text = _CONTROL.sub('', text)
    text = _LINE_BREAK_HYPHEN.sub(r'\1', text)
    text = _SOFT_WRAP.sub(' ', text)
    text = _REPEATED_SPACES.sub(' ', text)
    text = _TRAILING_SPACE.sub('', text)
    text = _REPEATED_BLANK_LINES.sub('\n\n', text)

    return text.strip()
