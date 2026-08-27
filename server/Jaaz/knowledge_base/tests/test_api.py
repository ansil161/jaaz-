"""The knowledge-base API.

Authorization first, because everything else is only safe if that holds:
these endpoints read and delete the organisation's documents, and the
frontend hiding a menu item is not a control.
"""

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from knowledge_base.models import Document, DocumentStatus
from knowledge_base.services.documents import KnowledgeBaseService

from .support import (
    DOCUMENTS_URL,
    SEARCH_URL,
    KnowledgeBaseTestCase,
    docx_upload,
    document_url,
    make_user,
    pdf_upload,
    text_upload,
)


class AccessControlTests(KnowledgeBaseTestCase):
    def setUp(self):
        super().setUp()
        self.member = make_user('member@example.com')

    def test_an_unauthenticated_request_cannot_list_documents(self):
        response = self.client.get(DOCUMENTS_URL)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.error_code(response), 'NOT_AUTHENTICATED')

    def test_an_unauthenticated_request_cannot_upload(self):
        response = self.client.post(
            DOCUMENTS_URL, {'file': text_upload()}, format='multipart'
        )
        self.assertEqual(response.status_code, 401)
        self.assertFalse(Document.objects.exists())

    def test_a_signed_in_non_admin_cannot_list_documents(self):
        self.sign_in(self.member)
        response = self.client.get(DOCUMENTS_URL)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.error_code(response), 'FORBIDDEN')

    def test_a_signed_in_non_admin_cannot_upload(self):
        self.sign_in(self.member)
        response = self.client.post(
            DOCUMENTS_URL, {'file': text_upload()}, format='multipart'
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Document.objects.exists())

    def test_a_non_admin_cannot_search_the_knowledge_base(self):
        self.sign_in(self.member)
        response = self.client.post(SEARCH_URL, {'query': 'anything'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_every_endpoint_is_closed_to_anonymous_callers(self):
        document_id = '00000000-0000-0000-0000-000000000000'
        for method, url in (
            ('get', DOCUMENTS_URL),
            ('post', DOCUMENTS_URL),
            ('get', document_url(document_id)),
            ('delete', document_url(document_id)),
            ('get', document_url(document_id, 'chunks/')),
            ('post', document_url(document_id, 'retry/')),
            ('post', document_url(document_id, 'reprocess/')),
            ('post', SEARCH_URL),
        ):
            with self.subTest(method=method, url=url):
                response = getattr(self.client, method)(url)
                self.assertEqual(response.status_code, 401)


class UploadTests(KnowledgeBaseTestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)
        self.sign_in(self.admin)

    def upload(self, upload_file, **extra):
        return self.client.post(
            DOCUMENTS_URL, {'file': upload_file, **extra}, format='multipart'
        )

    def test_an_admin_can_upload_a_supported_document(self):
        response = self.upload(text_upload(body='Warranty content. ' * 100))

        self.assertEqual(response.status_code, 201, response.content)
        document = response.json()['document']
        self.assertEqual(document['status'], DocumentStatus.READY)
        self.assertEqual(document['type'], 'Text')
        self.assertGreater(document['chunkCount'], 0)
        self.assertEqual(document['uploadedBy'], self.admin.get_username())

    def test_a_document_record_is_created_with_the_detected_type(self):
        # The client claimed text/plain in the multipart part header; the
        # stored type comes from the bytes.
        response = self.client.post(
            DOCUMENTS_URL,
            {
                'file': SimpleUploadedFile(
                    'report.pdf', pdf_upload().read(), content_type='text/plain'
                )
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201, response.content)
        document = Document.objects.get()
        self.assertEqual(document.content_type, 'application/pdf')

    def test_a_custom_display_name_is_used(self):
        response = self.upload(text_upload(), name='Company FAQ')
        self.assertEqual(response.json()['document']['name'], 'Company FAQ')

    def test_the_name_defaults_to_the_filename_without_its_extension(self):
        response = self.upload(text_upload(name='Company Policies.txt'))
        self.assertEqual(response.json()['document']['name'], 'Company Policies')

    def test_an_unsupported_file_type_is_rejected(self):
        response = self.upload(
            SimpleUploadedFile(
                'thing.bin', b'\x7fELF\x02\x01\x01\x00binary', content_type='text/plain'
            )
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.error_code(response), 'UNSUPPORTED_FILE_TYPE')
        self.assertFalse(Document.objects.exists())

    def test_a_document_renamed_to_look_supported_is_rejected(self):
        response = self.upload(
            SimpleUploadedFile(
                'invoice.pdf', docx_upload().read(), content_type='application/pdf'
            )
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.error_code(response), 'UNSUPPORTED_FILE_TYPE')

    def test_an_oversized_file_is_rejected(self):
        with override_settings(
            KNOWLEDGE_BASE={**settings.KNOWLEDGE_BASE, 'MAX_DOCUMENT_SIZE': 512}
        ):
            response = self.upload(text_upload(body='x' * 4000))

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.error_code(response), 'FILE_TOO_LARGE')
        self.assertFalse(Document.objects.exists())

    def test_an_empty_file_is_rejected(self):
        response = self.upload(
            SimpleUploadedFile('empty.txt', b'', content_type='text/plain')
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Document.objects.exists())

    def test_a_request_with_no_file_is_a_validation_error(self):
        response = self.client.post(DOCUMENTS_URL, {}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.error_code(response), 'INVALID_REQUEST')
        self.assertIn('file', response.json()['error']['details'])

    def test_uploading_the_same_bytes_twice_is_refused(self):
        self.upload(text_upload(body='Identical content. ' * 50))
        response = self.upload(text_upload(body='Identical content. ' * 50))

        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.error_code(response), 'DUPLICATE_DOCUMENT')
        self.assertEqual(Document.objects.count(), 1)

    def test_a_rejected_upload_leaves_nothing_in_storage(self):
        from django.core.files.storage import storages

        self.upload(
            SimpleUploadedFile('bad.bin', b'\x00\x01\x02\x03', content_type='text/plain')
        )

        storage = storages[settings.KNOWLEDGE_BASE_STORAGE_ALIAS]
        directories, files = storage.listdir('')
        self.assertEqual(files, [])

    def test_the_response_never_exposes_the_storage_key_or_checksum(self):
        response = self.upload(text_upload())
        document = Document.objects.get()

        body = response.content.decode()
        self.assertNotIn(document.storage_key, body)
        self.assertNotIn(document.checksum, body)
        self.assertNotIn('storageKey', response.json()['document'])


class DocumentListTests(KnowledgeBaseTestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)
        service = KnowledgeBaseService()
        self.faq = service.upload(
            text_upload(name='Company FAQ.txt', body='Questions and answers. ' * 40),
            uploaded_by=self.admin,
        )
        self.guide = service.upload(
            pdf_upload(name='Product Guide.pdf', pages=['Guide body text here.']),
            uploaded_by=self.admin,
        )
        self.sign_in(self.admin)

    def test_the_list_returns_every_document_with_meta(self):
        response = self.client.get(DOCUMENTS_URL)

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body['results']), 2)
        self.assertEqual(body['meta']['totalCount'], 2)
        self.assertEqual(body['meta']['counts']['ready'], 2)
        self.assertIn('maxFileSize', body['meta']['limits'])

    def test_search_matches_the_document_name(self):
        response = self.client.get(DOCUMENTS_URL, {'search': 'Product'})
        results = response.json()['results']
        self.assertEqual([item['name'] for item in results], ['Product Guide'])

    def test_search_matches_the_original_filename(self):
        response = self.client.get(DOCUMENTS_URL, {'search': '.pdf'})
        self.assertEqual(len(response.json()['results']), 1)

    def test_filtering_by_status(self):
        Document.objects.filter(pk=self.faq.pk).update(status=DocumentStatus.FAILED)

        response = self.client.get(DOCUMENTS_URL, {'status': 'failed'})

        results = response.json()['results']
        self.assertEqual([item['name'] for item in results], ['Company FAQ'])

    def test_filtering_by_content_type(self):
        response = self.client.get(DOCUMENTS_URL, {'contentType': 'application/pdf'})
        self.assertEqual(len(response.json()['results']), 1)

    def test_ordering_by_name(self):
        response = self.client.get(DOCUMENTS_URL, {'ordering': 'name'})
        names = [item['name'] for item in response.json()['results']]
        self.assertEqual(names, sorted(names))

    def test_an_unknown_ordering_falls_back_to_the_default(self):
        # Not an error, and not passed through to order_by — an arbitrary
        # column name from a caller is a way to probe fields the serializer
        # deliberately does not expose.
        response = self.client.get(DOCUMENTS_URL, {'ordering': 'checksum'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['results']), 2)

    def test_pagination(self):
        response = self.client.get(DOCUMENTS_URL, {'pageSize': 1, 'page': 2})
        body = response.json()
        self.assertEqual(len(body['results']), 1)
        self.assertEqual(body['meta']['page'], 2)
        self.assertEqual(body['meta']['totalPages'], 2)

    def test_the_page_size_is_capped(self):
        response = self.client.get(DOCUMENTS_URL, {'pageSize': 100000})
        self.assertLessEqual(response.json()['meta']['pageSize'], 100)


class DocumentDetailTests(KnowledgeBaseTestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)
        self.document = KnowledgeBaseService().upload(
            text_upload(body='Detail content. ' * 200), uploaded_by=self.admin
        )
        self.sign_in(self.admin)

    def test_the_detail_endpoint_returns_the_document(self):
        response = self.client.get(document_url(self.document.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['document']['id'], str(self.document.id))

    def test_an_unknown_id_is_404(self):
        response = self.client.get(
            document_url('11111111-1111-1111-1111-111111111111')
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.error_code(response), 'NOT_FOUND')

    def test_the_chunks_endpoint_previews_what_was_indexed(self):
        response = self.client.get(document_url(self.document.id, 'chunks/'))

        self.assertEqual(response.status_code, 200)
        results = response.json()['results']
        self.assertEqual(len(results), self.document.chunk_count)
        self.assertTrue(all(chunk['hasEmbedding'] for chunk in results))
        self.assertTrue(all(chunk['contentPreview'] for chunk in results))

    def test_the_chunk_preview_never_returns_a_raw_embedding(self):
        # A vector per chunk would be hundreds of floats of no use to a UI.
        response = self.client.get(document_url(self.document.id, 'chunks/'))
        self.assertNotIn('embedding"', response.content.decode())

    def test_deleting_a_document(self):
        response = self.client.delete(document_url(self.document.id))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Document.objects.filter(pk=self.document.pk).exists())

    def test_deleting_removes_the_chunks_too(self):
        from knowledge_base.models import DocumentChunk

        self.client.delete(document_url(self.document.id))
        self.assertFalse(
            DocumentChunk.objects.filter(document_id=self.document.pk).exists()
        )


class LifecycleEndpointTests(KnowledgeBaseTestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)
        self.document = KnowledgeBaseService().upload(
            text_upload(body='Lifecycle content. ' * 100), uploaded_by=self.admin
        )
        self.sign_in(self.admin)

    def test_retrying_a_healthy_document_is_refused(self):
        response = self.client.post(document_url(self.document.id, 'retry/'))

        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.error_code(response), 'DOCUMENT_NOT_RETRYABLE')

    def test_retrying_a_failed_document_reprocesses_it(self):
        Document.objects.filter(pk=self.document.pk).update(
            status=DocumentStatus.FAILED,
            error_code='EMBEDDING_FAILED',
            error_message='Processing failed. Please retry the document.',
        )

        response = self.client.post(document_url(self.document.id, 'retry/'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['document']['status'], DocumentStatus.READY)
        self.assertEqual(response.json()['document']['errorMessage'], '')

    def test_reprocessing_a_ready_document_is_allowed(self):
        response = self.client.post(document_url(self.document.id, 'reprocess/'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['document']['status'], DocumentStatus.READY)

    def test_reprocessing_a_document_that_is_already_running_is_refused(self):
        Document.objects.filter(pk=self.document.pk).update(
            status=DocumentStatus.EMBEDDING
        )

        response = self.client.post(document_url(self.document.id, 'reprocess/'))

        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.error_code(response), 'DOCUMENT_BUSY')


class SearchTests(KnowledgeBaseTestCase):
    """Retrieval, including the part that makes citations possible."""

    def setUp(self):
        super().setUp()
        self.admin = make_user('admin@example.com', is_staff=True)
        service = KnowledgeBaseService()
        self.warranty = service.upload(
            text_upload(
                name='Warranty Policy.txt',
                body=(
                    'The warranty period for every installed system is thirty six '
                    'months from the date of handover. Warranty claims are handled '
                    'by the original installation team. '
                ) * 6,
            ),
            uploaded_by=self.admin,
        )
        self.acoustics = service.upload(
            text_upload(
                name='Acoustic Notes.txt',
                body=(
                    'Room acoustics depend on absorption, diffusion and the ratio '
                    'of the room dimensions to each other. '
                ) * 6,
            ),
            uploaded_by=self.admin,
        )
        self.sign_in(self.admin)

    def search(self, **payload):
        return self.client.post(SEARCH_URL, payload, format='json')

    def test_a_query_returns_hits_with_their_source_document(self):
        response = self.search(query='how long is the warranty period')

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body['hits'])
        top = body['hits'][0]
        self.assertEqual(top['documentName'], 'Warranty Policy')
        self.assertEqual(top['documentId'], str(self.warranty.id))
        self.assertIn('warranty', top['content'].lower())

    def test_sources_are_de_duplicated_per_document(self):
        # This is the list an answer's "Sources:" section is built from.
        body = self.search(query='warranty period handover').json()

        names = [source['documentName'] for source in body['sources']]
        self.assertEqual(len(names), len(set(names)))
        self.assertEqual(names[0], 'Warranty Policy')

    def test_the_response_names_the_model_that_produced_the_vectors(self):
        body = self.search(query='warranty').json()
        self.assertEqual(body['model'], 'hashing-64')

    def test_results_can_be_restricted_to_chosen_documents(self):
        body = self.search(
            query='warranty period', documentIds=[str(self.acoustics.id)]
        ).json()

        for hit in body['hits']:
            self.assertEqual(hit['documentId'], str(self.acoustics.id))

    def test_top_k_limits_the_number_of_hits(self):
        body = self.search(query='room acoustics warranty', topK=1).json()
        self.assertLessEqual(len(body['hits']), 1)

    def test_an_empty_query_is_a_validation_error(self):
        response = self.search(query='   ')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.error_code(response), 'INVALID_REQUEST')

    def test_a_document_that_is_not_ready_is_not_retrievable(self):
        Document.objects.filter(pk=self.warranty.pk).update(
            status=DocumentStatus.PROCESSING
        )

        body = self.search(query='warranty period handover').json()

        ids = {hit['documentId'] for hit in body['hits']}
        self.assertNotIn(str(self.warranty.id), ids)

    def test_chunks_from_another_embedding_model_are_ignored(self):
        """Vectors from different models are not comparable.

        Ranking across both would return confident nonsense, so retrieval
        filters on the model rather than mixing coordinate spaces.
        """
        from knowledge_base.models import DocumentChunk

        DocumentChunk.objects.all().update(embedding_model='some-other-model')

        body = self.search(query='warranty period').json()

        self.assertEqual(body['hits'], [])

    def test_deleting_a_document_removes_it_from_search(self):
        self.client.delete(document_url(self.warranty.id))

        body = self.search(query='warranty period handover').json()

        ids = {hit['documentId'] for hit in body['hits']}
        self.assertNotIn(str(self.warranty.id), ids)
