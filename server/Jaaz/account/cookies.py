"""Reading and writing the session cookie.

One place, so the attributes cannot drift between the login response and the
logout response — a `clear` that misses `path` or `domain` leaves the
original cookie in the browser and the user stays signed in.
"""

from django.conf import settings


def cookie_name():
    return settings.AUTH_COOKIE['NAME']


def read_token(request):
    return request.COOKIES.get(cookie_name())


def _attributes():
    config = settings.AUTH_COOKIE
    return {
        'path': config['PATH'],
        'domain': config['DOMAIN'],
        'secure': config['SECURE'],
        'samesite': config['SAMESITE'],
    }


def set_auth_cookie(response, token):
    """Attach the access token as an HttpOnly cookie.

    `httponly=True` is the whole point: it is why no frontend code in this
    repository reads or stores a token, and why an XSS payload on the console
    cannot exfiltrate the session.

    `max_age` is matched to the token's own lifetime so the browser drops the
    cookie at the same moment the server would start rejecting it — a cookie
    that outlives its token just produces confusing 401s.
    """
    response.set_cookie(
        cookie_name(),
        token,
        max_age=settings.AUTH_JWT['EXPIRES_IN'],
        httponly=True,
        **_attributes(),
    )
    return response


def clear_auth_cookie(response):
    """Remove the cookie, using the same attributes it was set with."""
    attributes = _attributes()
    response.delete_cookie(
        cookie_name(),
        path=attributes['path'],
        domain=attributes['domain'],
        samesite=attributes['samesite'],
    )
    return response
