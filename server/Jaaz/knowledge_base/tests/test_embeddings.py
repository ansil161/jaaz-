"""The embedding abstraction.

No test here reaches a network. The `hashing` provider runs in-process, and
where a test needs to watch or break the provider it substitutes a double —
which is the reason EmbeddingService takes one as a constructor argument.
"""

import math
from unittest import TestCase

from knowledge_base.config import EmbeddingConfig
from knowledge_base.embeddings.base import EmbeddingError
from knowledge_base.embeddings.providers.hashing import HashingEmbeddingProvider
from knowledge_base.embeddings.providers.openai import OpenAIEmbeddingProvider
from knowledge_base.embeddings.service import EmbeddingService, _build_provider

from .support import BrokenProvider, FakeProvider


def config(**overrides):
    values = {
        'provider': 'hashing',
        'model': '',
        'api_key': None,
        'api_base': 'https://api.openai.com/v1',
        'dimensions': 32,
        'batch_size': 64,
        'timeout': 5,
        'max_retries': 1,
    }
    values.update(overrides)
    return EmbeddingConfig(**values)


def magnitude(vector):
    return math.sqrt(sum(value * value for value in vector))


class HashingProviderTests(TestCase):
    def test_the_same_text_always_produces_the_same_vector(self):
        """Not a nicety — stored vectors outlive the process that made them.

        Python's built-in hash() is salted per process, so a provider built
        on it would silently invalidate the entire knowledge base on every
        restart. This is why blake2b is used instead.
        """
        first = HashingEmbeddingProvider(dimensions=32).embed_batch(['warranty terms'])
        second = HashingEmbeddingProvider(dimensions=32).embed_batch(['warranty terms'])
        self.assertEqual(first, second)

    def test_vectors_are_unit_length(self):
        [vector] = HashingEmbeddingProvider(dimensions=32).embed_batch(['some text'])
        self.assertAlmostEqual(magnitude(vector), 1.0, places=6)

    def test_the_dimension_count_is_part_of_the_model_name(self):
        # Vectors of different widths are not comparable, and retrieval
        # filters on the model string to make sure it never tries.
        self.assertEqual(HashingEmbeddingProvider(dimensions=64).model, 'hashing-64')

    def test_related_text_scores_higher_than_unrelated_text(self):
        provider = HashingEmbeddingProvider(dimensions=256)
        query, related, unrelated = provider.embed_batch(
            [
                'what is the warranty period',
                'the warranty period is thirty six months',
                'the kitchen was repainted last spring',
            ]
        )
        dot = lambda a, b: sum(x * y for x, y in zip(a, b))  # noqa: E731
        self.assertGreater(dot(query, related), dot(query, unrelated))

    def test_text_with_no_terms_gives_a_zero_vector_rather_than_dividing_by_zero(self):
        [vector] = HashingEmbeddingProvider(dimensions=16).embed_batch(['!!! ???'])
        self.assertEqual(magnitude(vector), 0.0)

    def test_every_vector_has_the_configured_width(self):
        vectors = HashingEmbeddingProvider(dimensions=48).embed_batch(['a', 'bb', ''])
        self.assertTrue(all(len(vector) == 48 for vector in vectors))


class EmbeddingServiceTests(TestCase):
    def test_the_service_normalises_whatever_the_provider_returns(self):
        provider = FakeProvider(dimensions=4)
        batch = EmbeddingService(provider=provider, config=config()).embed_documents(
            ['one', 'two']
        )
        for vector in batch.vectors:
            self.assertAlmostEqual(magnitude(vector), 1.0, places=6)

    def test_long_inputs_are_split_into_batches(self):
        provider = FakeProvider()
        service = EmbeddingService(provider=provider, config=config(batch_size=2))

        service.embed_documents(['a', 'b', 'c', 'd', 'e'])

        self.assertEqual([len(call) for call in provider.calls], [2, 2, 1])

    def test_the_order_of_vectors_matches_the_order_of_inputs(self):
        # Citations depend on this: a reordered result attaches each vector
        # to the wrong chunk, and every source shown afterwards is wrong.
        provider = FakeProvider()
        service = EmbeddingService(provider=provider, config=config(batch_size=2))

        service.embed_documents(['first', 'second', 'third'])

        self.assertEqual(
            [text for call in provider.calls for text in call],
            ['first', 'second', 'third'],
        )

    def test_the_batch_records_the_model_and_dimensions(self):
        provider = FakeProvider(dimensions=8, model='fake-model')
        batch = EmbeddingService(provider=provider, config=config()).embed_documents(
            ['x']
        )
        self.assertEqual(batch.model, 'fake-model')
        self.assertEqual(batch.dimensions, 8)

    def test_an_empty_input_does_not_call_the_provider(self):
        provider = FakeProvider()
        batch = EmbeddingService(provider=provider, config=config()).embed_documents([])
        self.assertEqual(batch.vectors, [])
        self.assertEqual(provider.calls, [])

    def test_a_provider_failure_surfaces_as_an_embedding_error(self):
        service = EmbeddingService(provider=BrokenProvider(), config=config())
        with self.assertRaises(EmbeddingError):
            service.embed_documents(['x'])

    def test_a_short_response_is_rejected(self):
        class ShortProvider(FakeProvider):
            def embed_batch(self, texts):
                return super().embed_batch(texts)[:-1]

        service = EmbeddingService(provider=ShortProvider(), config=config())
        with self.assertRaises(EmbeddingError):
            service.embed_documents(['a', 'b'])

    def test_embed_query_returns_one_vector(self):
        service = EmbeddingService(provider=FakeProvider(dimensions=4), config=config())
        self.assertEqual(len(service.embed_query('a question')), 4)


class ProviderSelectionTests(TestCase):
    def test_hashing_is_built_from_configuration(self):
        provider = _build_provider(config(provider='hashing', dimensions=128))
        self.assertIsInstance(provider, HashingEmbeddingProvider)
        self.assertEqual(provider.dimensions, 128)

    def test_openai_is_built_from_configuration(self):
        provider = _build_provider(
            config(provider='openai', api_key='sk-test', model='text-embedding-3-small')
        )
        self.assertIsInstance(provider, OpenAIEmbeddingProvider)
        self.assertEqual(provider.model, 'text-embedding-3-small')

    def test_openai_without_a_key_fails_at_construction(self):
        # Better here than on the first document: it is a deployment
        # mistake, and the message names the variable to set.
        with self.assertRaises(EmbeddingError) as caught:
            _build_provider(config(provider='openai', api_key=None))
        self.assertIn('EMBEDDING_API_KEY', caught.exception.message)

    def test_an_unknown_provider_is_rejected(self):
        with self.assertRaises(EmbeddingError):
            _build_provider(config(provider='telepathy'))

    def test_the_api_key_is_not_in_the_provider_repr(self):
        provider = _build_provider(config(provider='openai', api_key='sk-secret-value'))
        self.assertNotIn('sk-secret-value', repr(provider))
