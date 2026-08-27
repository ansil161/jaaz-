"""A single error shape for the whole API.

Every failure the API returns looks like this:

    {"error": {"code": "INVALID_CREDENTIALS", "message": "..."}}

Field-level validation adds one optional key:

    {"error": {"code": "INVALID_REQUEST", "message": "...",
               "details": {"email": ["This field is required."]}}}

`code` is the stable part — clients branch on it. `message` is safe to show
to a person: nothing that reaches it is allowed to describe the database,
the token, or which half of a credential pair was wrong.
"""

import logging

from django.conf import settings
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, Throttled
from rest_framework.response import Response

logger = logging.getLogger('jaaz.security')


class ErrorCode:
    INVALID_REQUEST = 'INVALID_REQUEST'
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'
    NOT_AUTHENTICATED = 'NOT_AUTHENTICATED'
    ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE'
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED'
    CSRF_FAILED = 'CSRF_FAILED'
    FORBIDDEN = 'FORBIDDEN'
    NOT_FOUND = 'NOT_FOUND'
    TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS'
    INTERNAL_ERROR = 'INTERNAL_ERROR'

    # -- knowledge base --
    UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE'
    FILE_TOO_LARGE = 'FILE_TOO_LARGE'
    FILE_EMPTY = 'FILE_EMPTY'
    DUPLICATE_DOCUMENT = 'DUPLICATE_DOCUMENT'
    DOCUMENT_BUSY = 'DOCUMENT_BUSY'
    DOCUMENT_NOT_RETRYABLE = 'DOCUMENT_NOT_RETRYABLE'
    STORAGE_ERROR = 'STORAGE_ERROR'


class ApiError(APIException):
    """A failure the API is choosing to describe to the client.

    Anything raised as an ApiError has had its message written on purpose.
    Anything else that escapes a view becomes a generic INTERNAL_ERROR.
    """

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = ErrorCode.INVALID_REQUEST
    default_detail = 'The request could not be processed.'

    def __init__(self, code=None, message=None, status_code=None, details=None):
        self.code = code or self.default_code
        self.message = message or self.default_detail
        self.details = details
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail=self.message, code=self.code)


def error_response(code, message, status_code, details=None):
    body = {'error': {'code': code, 'message': message}}
    if details:
        body['error']['details'] = details
    return Response(body, status=status_code)


# Maps DRF's own exception classes onto our codes. Anything not listed here
# falls back to the generic code for its status class.
_STATUS_CODES = {
    status.HTTP_400_BAD_REQUEST: ErrorCode.INVALID_REQUEST,
    status.HTTP_401_UNAUTHORIZED: ErrorCode.NOT_AUTHENTICATED,
    status.HTTP_403_FORBIDDEN: ErrorCode.FORBIDDEN,
    status.HTTP_404_NOT_FOUND: ErrorCode.NOT_FOUND,
    status.HTTP_429_TOO_MANY_REQUESTS: ErrorCode.TOO_MANY_REQUESTS,
}

_SAFE_MESSAGES = {
    status.HTTP_400_BAD_REQUEST: 'The request was invalid.',
    status.HTTP_401_UNAUTHORIZED: 'Authentication is required.',
    status.HTTP_403_FORBIDDEN: 'You do not have access to this resource.',
    status.HTTP_404_NOT_FOUND: 'Not found.',
    status.HTTP_429_TOO_MANY_REQUESTS: 'Too many requests. Please try again shortly.',
}


def _validation_details(detail):
    """Flatten DRF's nested ValidationError detail into {field: [messages]}."""
    if isinstance(detail, dict):
        return {
            field: [str(item) for item in (msgs if isinstance(msgs, list) else [msgs])]
            for field, msgs in detail.items()
        }
    if isinstance(detail, list):
        return {'non_field_errors': [str(item) for item in detail]}
    return None


def api_exception_handler(exc, context):
    if isinstance(exc, Http404):
        return error_response(
            ErrorCode.NOT_FOUND, _SAFE_MESSAGES[404], status.HTTP_404_NOT_FOUND
        )

    if isinstance(exc, DjangoPermissionDenied):
        return error_response(
            ErrorCode.FORBIDDEN, _SAFE_MESSAGES[403], status.HTTP_403_FORBIDDEN
        )

    if isinstance(exc, ApiError):
        return error_response(exc.code, exc.message, exc.status_code, exc.details)

    if isinstance(exc, APIException):
        code = getattr(exc, 'default_code', None)
        status_code = exc.status_code

        if status_code == status.HTTP_400_BAD_REQUEST:
            # Field errors are the one case where echoing the detail is both
            # safe and useful: it is a description of the caller's own input.
            return error_response(
                ErrorCode.INVALID_REQUEST,
                _SAFE_MESSAGES[400],
                status_code,
                details=_validation_details(exc.detail),
            )

        if isinstance(exc, Throttled):
            message = _SAFE_MESSAGES[429]
            if exc.wait:
                message = (
                    f'Too many requests. Please try again in {int(exc.wait)} seconds.'
                )
            return error_response(
                ErrorCode.TOO_MANY_REQUESTS, message, status.HTTP_429_TOO_MANY_REQUESTS
            )

        return error_response(
            _STATUS_CODES.get(status_code, code or ErrorCode.INTERNAL_ERROR),
            _SAFE_MESSAGES.get(status_code, 'The request could not be processed.'),
            status_code,
        )

    # Anything left is a bug. Let DRF's default run first so it can handle
    # cases added by future versions, then fall back to an opaque 500 — the
    # traceback belongs in the log, not in the response body.
    #
    # Imported here rather than at module scope: DRF resolves
    # DEFAULT_AUTHENTICATION_CLASSES while `rest_framework.views` is still
    # executing, and a top-level import of it from this module closes the
    # cycle and fails at startup.
    from rest_framework.views import exception_handler as drf_exception_handler

    response = drf_exception_handler(exc, context)
    if response is not None:
        return response

    logger.exception('Unhandled exception in %s', context.get('view'))
    if settings.DEBUG:
        # Re-raise so the developer gets Django's traceback page.
        return None
    return error_response(
        ErrorCode.INTERNAL_ERROR,
        'Something went wrong. Please try again.',
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
