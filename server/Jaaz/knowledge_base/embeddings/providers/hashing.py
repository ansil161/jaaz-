"""A local, deterministic embedding provider.

This exists so the knowledge base works the moment the repository is cloned:
no API key, no network call, no bill, and a test suite that never touches a
paid service. Upload a document and the entire pipeline — extract, chunk,
embed, store, retrieve — runs end to end.

WHAT IT IS: the hashing trick. Each term is hashed to a coordinate and
accumulated with a sub-linear term-frequency weight, then the vector is
L2-normalised. Character trigrams are mixed in alongside whole words so that
"warranty" and "warranties" share most of their features.

WHAT IT IS NOT: semantic. It matches text that shares words or spelling, not
text that shares meaning — "car" and "automobile" are orthogonal to it. That
is the entire value an embedding model adds, so this provider is a
development and testing convenience, never a production retriever. Set
EMBEDDING_PROVIDER=openai (or add a provider beside this one) for real use.
"""

import hashlib
import math
import re

_TOKEN = re.compile(r'[a-z0-9]+')
_TRIGRAM_MIN_LENGTH = 5


class HashingEmbeddingProvider:
    name = 'hashing'

    def __init__(self, *, dimensions=256):
        if dimensions <= 0:
            raise ValueError('dimensions must be positive')
        self.dimensions = dimensions
        # The dimension count is part of the model identity: vectors of
        # different widths cannot be compared, and retrieval filters on this
        # string to make sure it never tries.
        self.model = f'hashing-{dimensions}'

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    # -- internals ------------------------------------------------------

    def _features(self, text):
        """Terms to hash: whole words, plus trigrams of the longer ones."""
        words = _TOKEN.findall(text.lower())
        for word in words:
            yield word
            if len(word) >= _TRIGRAM_MIN_LENGTH:
                for start in range(len(word) - 2):
                    yield f'#{word[start:start + 3]}'

    def _bucket(self, term):
        """Map a term to (coordinate, sign).

        blake2b rather than Python's hash(): the built-in is salted per
        process, so the same document would embed differently after a
        restart and every stored vector would become meaningless.
        """
        digest = hashlib.blake2b(term.encode('utf-8'), digest_size=5).digest()
        index = int.from_bytes(digest[:4], 'big') % self.dimensions
        sign = 1.0 if digest[4] & 1 else -1.0
        return index, sign

    def _embed(self, text):
        counts = {}
        for term in self._features(text):
            counts[term] = counts.get(term, 0) + 1

        vector = [0.0] * self.dimensions
        for term, count in counts.items():
            index, sign = self._bucket(term)
            # Sub-linear weighting: a term repeated forty times should not
            # dominate a passage forty times as much as one used once.
            vector[index] += sign * (1.0 + math.log(count))

        return _l2_normalize(vector)


def _l2_normalize(vector):
    """Scale to unit length so cosine similarity is a plain dot product.

    An all-zero vector — text with no alphanumeric characters at all — is
    returned unchanged rather than divided by zero. It matches nothing, which
    is the correct outcome for a chunk with no terms in it.
    """
    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0.0:
        return vector
    return [value / magnitude for value in vector]
