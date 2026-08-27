"""The sign-in decision.

All of it lives here rather than in the view, so the rule set is readable in
one place and testable without an HTTP request. The view's only job is to
turn the result into a response and a cookie.

The order of the checks below is deliberate and is the security-relevant
part of this file. Password verification happens *before* anything about the
account's status is consulted, so that a wrong password and a suspended
account are indistinguishable from outside — otherwise the endpoint answers
"does this address have an account here, and is it switched on?" for anyone
who asks.
"""

import logging

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status

from common.errors import ApiError, ErrorCode

from .models import profile_for

logger = logging.getLogger('jaaz.security')

# One message for every way sign-in can fail on credentials. Distinguishing
# "no such account" from "wrong password" would turn the login form into an
# account-enumeration tool.
INVALID_CREDENTIALS_MESSAGE = 'Unable to sign in. Please check your credentials.'


def _invalid_credentials():
    return ApiError(
        code=ErrorCode.INVALID_CREDENTIALS,
        message=INVALID_CREDENTIALS_MESSAGE,
        status_code=status.HTTP_401_UNAUTHORIZED,
    )


def _find_user_by_email(email):
    user_model = get_user_model()
    # auth_user.email carries no unique constraint out of the box. A partial
    # unique index is added by account migration 0002, but this code still
    # refuses to guess if it somehow finds two — signing someone into an
    # ambiguous account is worse than failing.
    matches = list(user_model.objects.filter(email__iexact=email).exclude(email='')[:2])
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        logger.error(
            'Multiple accounts share the email %r; refusing to authenticate.', email
        )
    return None


def _burn_equivalent_time(password):
    """Hash against a throwaway user so an unknown address costs the same.

    Without this, "no such account" returns in microseconds while "wrong
    password" pays for a full Argon2id verification, and the difference is
    measurable from outside. This is what Django's own ModelBackend does.
    """
    get_user_model()().set_password(password)


def authenticate_credentials(*, email, password, ip_address=None):
    """Return the user for these credentials, or raise an ApiError.

    Never returns a user who is not permitted to hold a session.
    """
    user = _find_user_by_email(email)

    if user is None:
        _burn_equivalent_time(password)
        logger.info('Sign-in failed for unknown address %r from %s', email, ip_address)
        raise _invalid_credentials()

    profile = profile_for(user)

    if profile.is_locked:
        remaining = int((profile.locked_until - timezone.now()).total_seconds())
        logger.warning(
            'Sign-in attempt on locked account %s from %s (%ss remaining)',
            user.pk,
            ip_address,
            remaining,
        )
        raise ApiError(
            code=ErrorCode.ACCOUNT_LOCKED,
            message=(
                'Too many failed attempts. This account is temporarily locked. '
                'Please try again later.'
            ),
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if not user.check_password(password):
        locked = profile.register_failed_attempt()
        logger.warning(
            'Sign-in failed for account %s from %s%s',
            user.pk,
            ip_address,
            ' — account now locked' if locked else '',
        )
        raise _invalid_credentials()

    # Only now, with the password proven, is it safe to say anything about
    # the state of the account.
    if not profile.can_authenticate:
        logger.warning(
            'Sign-in refused for %s account %s from %s',
            profile.status,
            user.pk,
            ip_address,
        )
        raise ApiError(
            code=ErrorCode.ACCOUNT_INACTIVE,
            message='This account is not active. Please contact an administrator.',
            status_code=status.HTTP_403_FORBIDDEN,
        )

    _record_successful_login(user, profile, ip_address)
    return user


def _record_successful_login(user, profile, ip_address):
    profile.register_successful_login(ip_address=ip_address)
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])
    logger.info('Sign-in succeeded for account %s from %s', user.pk, ip_address)
