"""Shared views that belong to no single app."""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from .errors import ErrorCode, error_response


class ApiNotFoundView(APIView):
    """Catch-all for unmatched paths under /api/.

    Without it, Django answers with its own 404 page: HTML to a client that
    only parses JSON, and — while DEBUG is on — a printed list of every URL
    pattern the project defines. Neither is something an API should hand out.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def _respond(self, request, *args, **kwargs):
        return error_response(
            ErrorCode.NOT_FOUND, 'Not found.', status.HTTP_404_NOT_FOUND
        )

    get = post = put = patch = delete = head = options = _respond
