"""The DRF authentication class — this is `requireAuth`.

It runs on every request the API serves, because it is wired in as
DEFAULT_AUTHENTICATION_CLASSES. Its job is to turn an HttpOnly cookie into a
`request.user`, and to refuse to do so unless the token verifies *and* the
account behind it is still allowed in.

Two things are deliberately not delegated to the token:

  * account status. A token stays valid for its full lifetime, so a
    suspended or deactivated account would keep working until it expired if
    the claims were trusted on their own. The database row is re-read on
    every request instead.

  * CSRF. The cookie is ambient authority — the browser attaches it to any
    request to this origin, including one initiated by another site.
    HttpOnly stops a script from *reading* the token; it does nothing about
    a request from elsewhere that rides on it. See csrf.py.
"""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authentication import BaseAuthentication

from common.errors import ApiError, ErrorCode

from .cookies import read_token
from .csrf import enforce_csrf
from .models import profile_for
from .tokens import TokenError, decode_access_token

logger = logging.getLogger('jaaz.security')


def _not_authenticated(message='Your session has ended. Please sign in again.'):
    return ApiError(
        code=ErrorCode.NOT_AUTHENTICATED,
        message=message,
        status_code=status.HTTP_401_UNAUTHORIZED,
    )


class JWTCookieAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = read_token(request)
        if not token:
            # No credentials at all is not a failure — it is an anonymous
            # request. The permission classes decide whether that is allowed.
            return None

        try:
            claims = decode_access_token(token)
        except TokenError as exc:
            # The reason (expired / bad signature / wrong audience) is useful
            # to us and useless-to-harmful to the client.
            logger.info('Rejected token from %s: %s', client_ip(request), exc)
            raise _not_authenticated() from exc

        user = self._load_user(claims, request)
        enforce_csrf(request)
        return (user, token)

    def authenticate_header(self, request):
        # Truthy so DRF answers an unauthenticated request with 401 rather
        # than 403. There is no real challenge to issue: the client is
        # expected to send the browser to the login page.
        return 'Cookie'

    # -- internals -------------------------------------------------------

    def _load_user(self, claims, request):
        user_model = get_user_model()
        try:
            user = user_model.objects.select_related('account_profile').get(
                pk=claims['sub']
            )
        except (user_model.DoesNotExist, ValueError, TypeError) as exc:
            # A well-signed token for a user that no longer exists. Only
            # reachable after a deletion, or with a leaked signing key.
            logger.warning(
                'Valid token for unknown user %r from %s',
                claims.get('sub'),
                client_ip(request),
            )
            raise _not_authenticated() from exc

        if not profile_for(user).can_authenticate:
            logger.info('Token presented by non-active account %s', user.pk)
            raise ApiError(
                code=ErrorCode.ACCOUNT_INACTIVE,
                message='This account is no longer active.',
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        return user


def client_ip(request):
    """Best-effort client address for the audit log.

    X-Forwarded-For is only consulted when the deployment has declared it
    trustworthy, because a client can send that header itself and would
    otherwise be able to write whatever it likes into the security log and
    sidestep per-IP throttling.
    """
    if settings.TRUST_X_FORWARDED_FOR:
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
