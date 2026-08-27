"""Role derivation.

Django already ships an authorization system — `is_staff`, `is_superuser`,
groups and permissions — and it is already migrated into this database. A
second `role` column would be a second source of truth: two places to
update, two places to get out of step, and one of them silently winning.

So `role` here is *derived*, not stored. It exists because the API and the
JWT need a short string to talk about, and it is computed from the flags
Django is already maintaining. Granting console access stays a matter of
setting `is_staff` — in the Django admin, in a shell, or in a migration —
exactly as it would be for any other Django project.
"""

ROLE_ADMIN = 'admin'
ROLE_MEMBER = 'member'


def is_admin(user):
    """Whether this account may use the admin console.

    Mirrors Django's own definition of an administrative account rather than
    inventing a parallel one. `is_superuser` is included for the case of a
    superuser created programmatically without `is_staff`.
    """
    return bool(user and (user.is_staff or user.is_superuser))


def role_for(user):
    return ROLE_ADMIN if is_admin(user) else ROLE_MEMBER
