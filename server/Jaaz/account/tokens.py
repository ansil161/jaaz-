"""Access-token issue and verify.

Named `tokens` rather than `jwt` so that `import jwt` inside this package
unambiguously means PyJWT.

The payload is deliberately thin — a subject and a role, and nothing that
would be damaging to read. A JWT is signed, not encrypted: anyone holding
one can decode its body. `role` is in there as a hint the frontend may use
for rendering, never as the basis for an access decision; every protected
endpoint re-derives the role from the database row.
"""

import time

import jwt
from django.conf import settings

from .roles import role_for


class TokenError(Exception):
    """The token was absent, malformed, expired, or not ours."""


def issue_access_token(user, *, issued_at=None):
    config = settings.AUTH_JWT
    now = int(issued_at if issued_at is not None else time.time())

    payload = {
        'sub': str(user.pk),
        'role': role_for(user),
        'iss': config['ISSUER'],
        'aud': config['AUDIENCE'],
        'iat': now,
        'nbf': now,
        'exp': now + config['EXPIRES_IN'],
    }
    return jwt.encode(payload, config['SECRET'], algorithm=config['ALGORITHM'])


def decode_access_token(token):
    """Verify a token and return its claims.

    Raises TokenError for every failure mode, so callers never have to know
    which PyJWT exception means what — and so no PyJWT message can reach a
    response body by accident.
    """
    if not token:
        raise TokenError('No token supplied.')

    config = settings.AUTH_JWT
    try:
        return jwt.decode(
            token,
            config['SECRET'],
            # Pinned, so a token whose header claims `alg: none` or a
            # different algorithm is rejected rather than accommodated.
            algorithms=[config['ALGORITHM']],
            issuer=config['ISSUER'],
            audience=config['AUDIENCE'],
            leeway=config['LEEWAY'],
            options={
                'require': ['exp', 'iat', 'sub', 'iss', 'aud'],
                'verify_signature': True,
                'verify_exp': True,
                'verify_iat': True,
                'verify_iss': True,
                'verify_aud': True,
            },
        )
    except jwt.PyJWTError as exc:
        raise TokenError(str(exc)) from exc
