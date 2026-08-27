"""The authentication API.

Thin on purpose. Each view validates, calls into services.py, and turns the
result into a response plus a cookie. No authentication rule is decided here.

Note the `authentication_classes = []` on login and logout. Leaving the
default class in place would mean a *stale* cookie is decoded before the
request reaches the view — and an expired token raises 401, which would make
it impossible to sign in again without manually clearing cookies. These two
endpoints must work regardless of what the browser is already carrying, so
they skip authentication and enforce CSRF directly instead.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import client_ip
from .cookies import clear_auth_cookie, set_auth_cookie
from .csrf import enforce_csrf
from .serializers import LoginSerializer, UserSerializer
from .services import authenticate_credentials
from .tokens import issue_access_token


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    """Primes the `csrftoken` cookie before the first write.

    The login page calls this on mount. Without it there is nothing for the
    frontend to echo back in `X-CSRFToken`, and the very first sign-in of a
    session would fail the CSRF check.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'auth-read'

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        enforce_csrf(request)

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate_credentials(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
            ip_address=client_ip(request),
        )

        response = Response({'user': UserSerializer(user).data})
        return set_auth_cookie(response, issue_access_token(user))


class LogoutView(APIView):
    """Ends the browser session by removing the cookie.

    Deliberately AllowAny: signing out has to work even when the token has
    already expired, and the outcome — no cookie — is the same either way.

    The token itself is stateless, so it is not revoked server-side; it is
    simply no longer held by anyone. A copy captured before logout would
    remain valid until `exp`. That is the trade this design accepts in
    exchange for having no session store, and it is why the lifetime is
    hours rather than weeks. A denylist would be the answer if that window
    ever stops being acceptable.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'auth-read'

    def post(self, request):
        enforce_csrf(request)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        return clear_auth_cookie(response)


class MeView(APIView):
    """Who the browser is currently signed in as.

    This is the only thing the frontend uses to decide whether it is
    authenticated. It cannot inspect the cookie, so it asks.
    """

    permission_classes = [IsAuthenticated]
    throttle_scope = 'auth-read'

    def get(self, request):
        return Response({'user': UserSerializer(request.user).data})
