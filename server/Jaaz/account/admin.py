"""Django-admin surface for the account profile.

Attached to the existing User admin as an inline rather than registered on
its own, so `status` and the lockout state are visible in the one place
someone already goes to manage a user — and so a locked-out colleague can be
released without a shell.
"""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import AccountProfile

User = get_user_model()


class AccountProfileInline(admin.StackedInline):
    model = AccountProfile
    can_delete = False
    verbose_name_plural = 'Account profile'
    readonly_fields = (
        'failed_login_count',
        'last_login_ip',
        'last_login_at',
        'created_at',
        'updated_at',
    )
    fields = (
        'status',
        'locked_until',
        'failed_login_count',
        'last_login_at',
        'last_login_ip',
        'created_at',
        'updated_at',
    )


class UserAdmin(BaseUserAdmin):
    inlines = [AccountProfileInline]
    list_display = (
        'username',
        'email',
        'is_staff',
        'is_active',
        'account_status',
    )

    @admin.display(description='Account status')
    def account_status(self, user):
        profile = getattr(user, 'account_profile', None)
        return profile.status if profile else '—'


admin.site.unregister(User)
admin.site.register(User, UserAdmin)
