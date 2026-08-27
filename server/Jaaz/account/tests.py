"""Tests for the authentication API.

These are the tests that would catch a regression that matters: a cookie
that stops being HttpOnly, a hash that reaches a response body, a role claim
that gets believed, an expired token that still opens the door.
"""

import time

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework.throttling import SimpleRateThrottle

from account.models import AccountProfile, AccountStatus
from account.tokens import issue_access_token

User = get_user_model()

COOKIE = settings.AUTH_COOKIE['NAME']
PASSWORD = 'correct-horse-battery-staple'

LOGIN_URL = '/api/auth/login/'
LOGOUT_URL = '/api/auth/logout/'
ME_URL = '/api/auth/me/'
CSRF_URL = '/api/auth/csrf/'
OVERVIEW_URL = '/api/admin/overview/'


def make_user(email, *, password=PASSWORD, is_staff=False, status_=AccountStatus.ACTIVE,
              is_active=True):
    user = User.objects.create_user(
        username=email.split('@')[0],
        email=email,
        password=password,
        is_staff=is_staff,
        is_active=is_active,
    )
    AccountProfile.objects.create(user=user, status=status_)
    return user


class AuthTestCase(APITestCase):
    """Base class that keeps the throttle counters from leaking between tests.

    DRF's throttling is cache-backed and the cache is process-global, so
    without this a test that makes several sign-in attempts would throttle
    whichever test happens to run after it.
    """

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def error_code(self, response):
        return response.json()['error']['code']


# ---------------------------------------------------------------------------
# Sign in
# ---------------------------------------------------------------------------

class LoginTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        self.user = make_user('admin@example.com', is_staff=True)

    def test_valid_credentials_return_200_and_the_user(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['user']['email'], 'admin@example.com')
        self.assertEqual(response.json()['user']['role'], 'admin')

    def test_valid_credentials_set_an_httponly_cookie(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
        )

        self.assertIn(COOKIE, response.cookies)
        cookie = response.cookies[COOKIE]
        self.assertTrue(cookie.value)
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['samesite'], settings.AUTH_COOKIE['SAMESITE'])
        self.assertEqual(cookie['path'], settings.AUTH_COOKIE['PATH'])
        self.assertEqual(int(cookie['max-age']), settings.AUTH_JWT['EXPIRES_IN'])

    def test_the_token_is_never_in_the_response_body(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
        )

        # The whole point of the HttpOnly cookie is defeated if the same
        # value is also handed to JavaScript in the JSON.
        self.assertNotIn(response.cookies[COOKIE].value, response.content.decode())

    def test_the_response_never_exposes_the_password_hash(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
        )

        body = response.content.decode()
        self.assertNotIn(self.user.password, body)
        self.assertNotIn(PASSWORD, body)
        for leaked in ('password', 'passwordHash', 'is_superuser', 'user_permissions'):
            self.assertNotIn(leaked, response.json()['user'])

    def test_the_email_is_matched_case_insensitively(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'ADMIN@Example.COM', 'password': PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_wrong_password_is_401(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': 'not-the-password'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.error_code(response), 'INVALID_CREDENTIALS')
        self.assertNotIn(COOKIE, response.cookies)

    def test_unknown_user_is_401(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'nobody@example.com', 'password': PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.error_code(response), 'INVALID_CREDENTIALS')

    def test_unknown_user_and_wrong_password_are_indistinguishable(self):
        """Otherwise the login form doubles as an account-enumeration tool."""
        unknown = self.client.post(
            LOGIN_URL,
            {'email': 'nobody@example.com', 'password': PASSWORD},
            format='json',
        )
        wrong = self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': 'not-the-password'},
            format='json',
        )

        self.assertEqual(unknown.status_code, wrong.status_code)
        self.assertEqual(unknown.json(), wrong.json())

    def test_missing_credentials_are_400(self):
        response = self.client.post(LOGIN_URL, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.error_code(response), 'INVALID_REQUEST')
        details = response.json()['error']['details']
        self.assertIn('email', details)
        self.assertIn('password', details)

    def test_a_malformed_email_is_400(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'not-an-email', 'password': PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_deactivated_account_cannot_sign_in(self):
        make_user('gone@example.com', is_active=False)

        response = self.client.post(
            LOGIN_URL,
            {'email': 'gone@example.com', 'password': PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.error_code(response), 'ACCOUNT_INACTIVE')

    def test_a_suspended_account_cannot_sign_in(self):
        make_user('paused@example.com', status_=AccountStatus.SUSPENDED)

        response = self.client.post(
            LOGIN_URL,
            {'email': 'paused@example.com', 'password': PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.error_code(response), 'ACCOUNT_INACTIVE')

    def test_account_status_is_only_revealed_after_the_password_is_correct(self):
        """A wrong password on a suspended account must look like any other
        wrong password — otherwise the status is readable without credentials."""
        make_user('paused@example.com', status_=AccountStatus.SUSPENDED)

        response = self.client.post(
            LOGIN_URL,
            {'email': 'paused@example.com', 'password': 'wrong'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.error_code(response), 'INVALID_CREDENTIALS')

    def test_a_successful_sign_in_resets_the_failure_counter(self):
        profile = self.user.account_profile
        profile.failed_login_count = 3
        profile.save()

        self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
        )

        profile.refresh_from_db()
        self.assertEqual(profile.failed_login_count, 0)
        self.assertIsNotNone(profile.last_login_at)


# ---------------------------------------------------------------------------
# Brute-force protection
# ---------------------------------------------------------------------------

@override_settings(AUTH_LOCKOUT={'MAX_FAILED_ATTEMPTS': 3, 'LOCKOUT_SECONDS': 900})
class LockoutTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        self.user = make_user('target@example.com')

    def test_repeated_failures_lock_the_account(self):
        for _ in range(3):
            self.client.post(
                LOGIN_URL,
                {'email': 'target@example.com', 'password': 'wrong'},
                format='json',
            )

        self.user.account_profile.refresh_from_db()
        self.assertTrue(self.user.account_profile.is_locked)

    def test_a_locked_account_is_refused_even_with_the_right_password(self):
        for _ in range(3):
            self.client.post(
                LOGIN_URL,
                {'email': 'target@example.com', 'password': 'wrong'},
                format='json',
            )

        response = self.client.post(
            LOGIN_URL,
            {'email': 'target@example.com', 'password': PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(self.error_code(response), 'ACCOUNT_LOCKED')


class ThrottleTests(AuthTestCase):
    """Per-IP throttling, on top of the per-account lockout.

    The rate is patched onto SimpleRateThrottle rather than through
    override_settings: DRF binds DEFAULT_THROTTLE_RATES to a class attribute
    at import time, so overriding the setting alone leaves the old dict in
    place and the test silently measures the configured production rate.
    """

    def setUp(self):
        super().setUp()
        self._rates = SimpleRateThrottle.THROTTLE_RATES
        SimpleRateThrottle.THROTTLE_RATES = {**self._rates, 'login': '3/min'}

    def tearDown(self):
        SimpleRateThrottle.THROTTLE_RATES = self._rates
        super().tearDown()

    def test_too_many_sign_in_attempts_from_one_address_are_throttled(self):
        for _ in range(3):
            self.client.post(
                LOGIN_URL,
                {'email': 'nobody@example.com', 'password': 'wrong'},
                format='json',
            )

        response = self.client.post(
            LOGIN_URL,
            {'email': 'nobody@example.com', 'password': 'wrong'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(self.error_code(response), 'TOO_MANY_REQUESTS')


# ---------------------------------------------------------------------------
# Session identity
# ---------------------------------------------------------------------------

class MeTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        self.user = make_user('admin@example.com', is_staff=True)

    def sign_in(self):
        self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
        )

    def test_with_a_valid_cookie_it_returns_the_user(self):
        self.sign_in()

        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['user']['id'], self.user.pk)

    def test_without_a_cookie_it_is_401(self):
        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_an_invalid_token_is_401(self):
        self.client.cookies[COOKIE] = 'not.a.token'

        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.error_code(response), 'NOT_AUTHENTICATED')

    def test_a_token_signed_with_another_key_is_401(self):
        forged = jwt.encode(
            {
                'sub': str(self.user.pk),
                'role': 'admin',
                'iss': settings.AUTH_JWT['ISSUER'],
                'aud': settings.AUTH_JWT['AUDIENCE'],
                'iat': int(time.time()),
                'exp': int(time.time()) + 3600,
            },
            'a-different-secret',
            algorithm='HS256',
        )
        self.client.cookies[COOKIE] = forged

        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_an_expired_token_is_401(self):
        stale = issue_access_token(
            self.user,
            issued_at=time.time() - settings.AUTH_JWT['EXPIRES_IN'] - 3600,
        )
        self.client.cookies[COOKIE] = stale

        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_a_token_for_another_audience_is_401(self):
        wrong_audience = jwt.encode(
            {
                'sub': str(self.user.pk),
                'role': 'admin',
                'iss': settings.AUTH_JWT['ISSUER'],
                'aud': 'some.other.service',
                'iat': int(time.time()),
                'exp': int(time.time()) + 3600,
            },
            settings.AUTH_JWT['SECRET'],
            algorithm='HS256',
        )
        self.client.cookies[COOKIE] = wrong_audience

        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_a_session_stops_working_when_the_account_is_suspended(self):
        """The token is still valid; the account is not. The database wins."""
        self.sign_in()
        profile = self.user.account_profile
        profile.status = AccountStatus.SUSPENDED
        profile.save()

        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.error_code(response), 'ACCOUNT_INACTIVE')

    def test_the_payload_carries_nothing_sensitive(self):
        claims = jwt.decode(
            issue_access_token(self.user),
            settings.AUTH_JWT['SECRET'],
            algorithms=['HS256'],
            audience=settings.AUTH_JWT['AUDIENCE'],
            issuer=settings.AUTH_JWT['ISSUER'],
        )

        self.assertEqual(
            set(claims), {'sub', 'role', 'iss', 'aud', 'iat', 'nbf', 'exp'}
        )
        self.assertNotIn(self.user.password, str(claims))


# ---------------------------------------------------------------------------
# Sign out
# ---------------------------------------------------------------------------

class LogoutTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        make_user('admin@example.com', is_staff=True)
        self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
        )

    def test_logout_clears_the_cookie(self):
        response = self.client.post(LOGOUT_URL)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertIn(COOKIE, response.cookies)
        self.assertEqual(response.cookies[COOKIE].value, '')
        self.assertEqual(response.cookies[COOKIE]['max-age'], 0)

    def test_the_session_is_over_afterwards(self):
        self.client.post(LOGOUT_URL)

        self.assertEqual(
            self.client.get(ME_URL).status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_logout_still_succeeds_without_a_session(self):
        self.client.cookies.clear()

        response = self.client.post(LOGOUT_URL)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# CSRF
# ---------------------------------------------------------------------------

class CsrfTests(AuthTestCase):
    """Cookie auth means the browser attaches credentials to cross-site
    requests, so every unsafe endpoint has to demand a token the attacker's
    origin cannot read."""

    def setUp(self):
        super().setUp()
        make_user('admin@example.com', is_staff=True)
        self.client = APIClient(enforce_csrf_checks=True)

    def test_sign_in_without_a_csrf_token_is_rejected(self):
        response = self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.error_code(response), 'CSRF_FAILED')

    def test_the_csrf_endpoint_hands_out_a_usable_token(self):
        primer = self.client.get(CSRF_URL)
        self.assertIn('csrftoken', primer.cookies)

        response = self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
            HTTP_X_CSRFTOKEN=self.client.cookies['csrftoken'].value,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_a_signed_in_session_still_needs_a_token_to_write(self):
        self.client.get(CSRF_URL)
        csrf = self.client.cookies['csrftoken'].value
        self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
            HTTP_X_CSRFTOKEN=csrf,
        )

        response = self.client.post(LOGOUT_URL)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reads_do_not_need_a_token(self):
        self.client.get(CSRF_URL)
        self.client.post(
            LOGIN_URL,
            {'email': 'admin@example.com', 'password': PASSWORD},
            format='json',
            HTTP_X_CSRFTOKEN=self.client.cookies['csrftoken'].value,
        )

        self.assertEqual(self.client.get(ME_URL).status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Password storage
# ---------------------------------------------------------------------------

class PasswordStorageTests(AuthTestCase):
    def test_passwords_are_stored_as_argon2id(self):
        user = make_user('admin@example.com')

        self.assertTrue(user.password.startswith('argon2$argon2id$'))
        self.assertNotIn(PASSWORD, user.password)

    def test_a_legacy_pbkdf2_hash_is_upgraded_on_sign_in(self):
        user = make_user('legacy@example.com')
        user.password = make_pbkdf2_hash(PASSWORD)
        user.save(update_fields=['password'])

        self.client.post(
            LOGIN_URL,
            {'email': 'legacy@example.com', 'password': PASSWORD},
            format='json',
        )

        user.refresh_from_db()
        self.assertTrue(user.password.startswith('argon2$'))


def make_pbkdf2_hash(raw):
    from django.contrib.auth.hashers import PBKDF2PasswordHasher

    return PBKDF2PasswordHasher().encode(raw, 'saltysalt')
