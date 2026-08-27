"""Account state that Django's `auth_user` table does not already carry.

`auth_user` is already migrated in this database and already holds id, email,
the password hash, the permission flags and `date_joined`. Swapping in a
custom AUTH_USER_MODEL now would mean dropping the database, and duplicating
those columns into a second table would mean two answers to "who is this".

So this model is strictly the delta: a status richer than `is_active`, an
`updated_at`, and the failed-login counters — which live on a row rather than
in a cache because a lockout that a process restart or a second worker
forgets is not a lockout.
"""

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class AccountStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    # Invited but not yet through first sign-in. Cannot authenticate.
    PENDING = 'pending', 'Pending activation'
    # Deliberately switched off by an administrator, as distinct from
    # `is_active=False`, which Django also uses for soft deletion.
    SUSPENDED = 'suspended', 'Suspended'


class AccountProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='account_profile',
    )
    status = models.CharField(
        max_length=16,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
        db_index=True,
    )

    failed_login_count = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'account profile'
        verbose_name_plural = 'account profiles'

    def __str__(self):
        return f'{self.user} ({self.status})'

    # -- status ----------------------------------------------------------

    @property
    def is_locked(self):
        return self.locked_until is not None and self.locked_until > timezone.now()

    @property
    def can_authenticate(self):
        """Both gates must be open: Django's own flag and ours.

        `is_active` stays authoritative so that deactivating someone through
        the Django admin locks them out here too, without anyone having to
        remember this table exists.
        """
        return self.user.is_active and self.status == AccountStatus.ACTIVE

    # -- failed-login bookkeeping ----------------------------------------

    def register_failed_attempt(self):
        """Count a failure and lock the account once the threshold is hit.

        Returns True if this attempt tripped the lock.
        """
        config = settings.AUTH_LOCKOUT
        self.failed_login_count += 1
        tripped = self.failed_login_count >= config['MAX_FAILED_ATTEMPTS']
        if tripped:
            self.locked_until = timezone.now() + timedelta(
                seconds=config['LOCKOUT_SECONDS']
            )
            self.failed_login_count = 0
        self.save(update_fields=['failed_login_count', 'locked_until', 'updated_at'])
        return tripped

    def register_successful_login(self, ip_address=None):
        self.failed_login_count = 0
        self.locked_until = None
        self.last_login_at = timezone.now()
        self.last_login_ip = ip_address
        self.save(
            update_fields=[
                'failed_login_count',
                'locked_until',
                'last_login_at',
                'last_login_ip',
                'updated_at',
            ]
        )


def profile_for(user):
    """Fetch (or backfill) the profile for a user.

    `auth_user` predates this table, so existing rows have no profile. Rather
    than a data migration that would go stale the moment someone adds a user
    through the Django admin, the profile is created on first need.
    """
    profile, _ = AccountProfile.objects.get_or_create(user=user)
    return profile
