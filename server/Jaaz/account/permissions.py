"""Authorization — this is `requireAdmin`.

The frontend hides the console from people who should not see it. That is a
courtesy, not a control: it is code running on the visitor's machine, and it
can be edited. The decision that matters is made here, from the database row
the authentication class just loaded.
"""

from rest_framework.permissions import BasePermission, IsAuthenticated

from .roles import is_admin

__all__ = ['IsAuthenticated', 'IsAdmin']


class IsAdmin(BasePermission):
    """Console access.

    Pair it with IsAuthenticated — on its own it would also reject an
    anonymous request, but with 403 ("you may not") rather than 401 ("sign
    in"), and the frontend needs that distinction to decide between showing
    an error and redirecting to the login page.
    """

    message = 'This area is restricted to administrators.'

    def has_permission(self, request, view):
        return is_admin(request.user)
