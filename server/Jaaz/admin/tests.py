"""Tests for the admin-console API.

The one that matters most is `test_a_forged_role_claim_is_ignored`. The JWT
carries a `role`, and the whole design rests on that claim being a hint for
rendering and never an input to an access decision.
"""

import time

import jwt
from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from account.tests import PASSWORD, make_user

COOKIE = settings.AUTH_COOKIE['NAME']
LOGIN_URL = '/api/auth/login/'
OVERVIEW_URL = '/api/admin/overview/'


class AdminAccessTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = make_user('admin@example.com', is_staff=True)
        self.member = make_user('member@example.com')

    def tearDown(self):
        cache.clear()

    def sign_in(self, email):
        response = self.client.post(
            LOGIN_URL, {'email': email, 'password': PASSWORD}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_an_unauthenticated_request_is_401(self):
        response = self.client.get(OVERVIEW_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.json()['error']['code'], 'NOT_AUTHENTICATED')

    def test_a_non_admin_is_403(self):
        self.sign_in('member@example.com')

        response = self.client.get(OVERVIEW_URL)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json()['error']['code'], 'FORBIDDEN')

    def test_an_admin_is_200(self):
        self.sign_in('admin@example.com')

        response = self.client.get(OVERVIEW_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['viewer']['role'], 'admin')
        self.assertEqual(response.json()['stats']['totalAccounts'], 2)
        self.assertEqual(response.json()['stats']['administrators'], 1)

    def test_a_forged_role_claim_is_ignored(self):
        """A correctly signed token is not a licence to self-declare a role.

        This is only reachable by someone holding the signing key, but it is
        the exact failure the 'never trust the frontend' rule is about: the
        answer has to come from the database row, not the claim.
        """
        forged = jwt.encode(
            {
                'sub': str(self.member.pk),
                'role': 'admin',
                'iss': settings.AUTH_JWT['ISSUER'],
                'aud': settings.AUTH_JWT['AUDIENCE'],
                'iat': int(time.time()),
                'exp': int(time.time()) + 3600,
            },
            settings.AUTH_JWT['SECRET'],
            algorithm='HS256',
        )
        self.client.cookies[COOKIE] = forged

        response = self.client.get(OVERVIEW_URL)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_revoking_staff_ends_console_access_immediately(self):
        self.sign_in('admin@example.com')
        self.assertEqual(self.client.get(OVERVIEW_URL).status_code, status.HTTP_200_OK)

        self.admin.is_staff = False
        self.admin.save(update_fields=['is_staff'])

        # Same cookie, same token, different answer — because the decision is
        # re-made from the row on every request.
        self.assertEqual(
            self.client.get(OVERVIEW_URL).status_code, status.HTTP_403_FORBIDDEN
        )

    def test_the_overview_never_exposes_a_password_hash(self):
        self.sign_in('admin@example.com')

        body = self.client.get(OVERVIEW_URL).content.decode()

        self.assertNotIn(self.admin.password, body)
        self.assertNotIn(PASSWORD, body)
