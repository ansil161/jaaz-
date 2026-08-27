"""Double-submit CSRF enforcement, in the API's own error shape.

Django ships `@csrf_protect`, but it answers with an HTML 403 page, and a
JSON client that gets HTML back reports "something went wrong" instead of
"reload and try again". This wraps the same middleware and raises an ApiError
so the failure arrives looking like every other failure.

Why it is needed at all: DRF wraps every APIView in `csrf_exempt`, so the
global CsrfViewMiddleware in MIDDLEWARE never inspects these requests. The
check has to be re-applied by hand — once here, called from the two
unauthenticated write endpoints, and once from JWTCookieAuthentication for
everything that arrives with a session cookie.
"""

import logging

from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import status

from common.errors import ApiError, ErrorCode

logger = logging.getLogger('jaaz.security')

SAFE_METHODS = frozenset({'GET', 'HEAD', 'OPTIONS', 'TRACE'})


class _CsrfCheck(CsrfViewMiddleware):
    """CsrfViewMiddleware that hands back the reason instead of a response."""

    def _reject(self, request, reason):
        return reason


def enforce_csrf(request):
    """Raise if this unsafe request does not carry a matching CSRF token."""
    if request.method in SAFE_METHODS:
        return

    # DRF's Request proxies attribute reads to the underlying HttpRequest,
    # but the middleware also writes to it — hand it the real object.
    http_request = getattr(request, '_request', request)

    def get_response(_request):
        return None

    check = _CsrfCheck(get_response)
    check.process_request(http_request)
    reason = check.process_view(http_request, None, (), {})
    if reason is None:
        return

    logger.warning(
        'CSRF check failed for %s %s from %s: %s',
        request.method,
        request.path,
        http_request.META.get('REMOTE_ADDR'),
        reason,
    )
    raise ApiError(
        code=ErrorCode.CSRF_FAILED,
        message='Your session could not be verified. Please reload and try again.',
        status_code=status.HTTP_403_FORBIDDEN,
    )
