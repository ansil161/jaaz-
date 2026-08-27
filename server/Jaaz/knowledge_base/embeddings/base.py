"""The embedding provider contract.

Everything above this line — the processor, the vector store, retrieval —
knows only that it can hand over a list of strings and get back a list of
equal-length float vectors. It never learns whether that happened over the
network, on a GPU, or in this process.

That is what makes the provider swappable. Changing from the local
development provider to OpenAI, or to a self-hosted model later, is an
environment variable.
"""

from typing import Protocol


class EmbeddingError(Exception):
    """The embedding could not be produced.

    Carries a message safe to show an administrator. Provider responses,
    request URLs and API keys never reach it — they go to the log.
    """

    def __init__(self, message, *, retryable=True):
        super().__init__(message)
        self.message = message
        # Distinguishes a rate limit or a timeout, which is worth retrying,
        # from a rejected key or an unknown model, which is not.
        self.retryable = retryable


class EmbeddingProvider(Protocol):
    """Turns text into vectors.

    Implementations must return one vector per input, in input order, all of
    the same length. Callers rely on positional correspondence to attach a
    vector to the chunk it came from — a provider that reorders or drops
    results would silently mis-attribute every citation.
    """

    name: str
    model: str
    dimensions: int

    def embed_batch(self, texts: list[str]) -> list[list[float]]: ...
