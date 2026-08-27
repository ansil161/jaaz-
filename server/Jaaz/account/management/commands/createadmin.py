"""Create or promote a console administrator.

`createsuperuser` also works — this exists because the API keys on email
rather than username, and because it runs the password validators and
creates the AccountProfile in the same step.

    python manage.py createadmin --email you@example.com

The password is read from a hidden prompt, or from JAAZ_ADMIN_PASSWORD when
there is no terminal to prompt on (provisioning, CI). It is never accepted as
a command-line argument: arguments show up in shell history and in the
process list, where an environment variable scoped to a single command does
not. This mirrors how Django's own `createsuperuser` handles
DJANGO_SUPERUSER_PASSWORD.
"""

import getpass
import os
import sys

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from account.models import AccountProfile, AccountStatus


class Command(BaseCommand):
    help = 'Create or promote an administrator for the JAAZ console.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True)
        parser.add_argument(
            '--username',
            help='Defaults to the local part of the email address.',
        )

    def handle(self, *args, **options):
        user_model = get_user_model()
        email = options['email'].strip().lower()
        username = (options['username'] or email.split('@')[0]).strip()

        existing = user_model.objects.filter(email__iexact=email).first()
        password = self._prompt_for_password(existing)

        with transaction.atomic():
            if existing:
                user = existing
                self.stdout.write(f'Updating existing account {user.pk} ({email}).')
            else:
                if user_model.objects.filter(username=username).exists():
                    raise CommandError(
                        f'The username {username!r} is taken. '
                        f'Pass --username to choose another.'
                    )
                user = user_model(username=username, email=email)

            self._validate(password, user)
            user.set_password(password)
            user.is_staff = True
            user.is_active = True
            user.save()

            profile, _ = AccountProfile.objects.get_or_create(user=user)
            profile.status = AccountStatus.ACTIVE
            profile.failed_login_count = 0
            profile.locked_until = None
            profile.save()

        self.stdout.write(
            self.style.SUCCESS(f'{email} can now sign in to the console as an admin.')
        )

    def _prompt_for_password(self, existing):
        from_environment = os.environ.get('JAAZ_ADMIN_PASSWORD')
        if from_environment:
            return from_environment

        if not sys.stdin.isatty():
            raise CommandError(
                'There is no terminal to prompt on. Set JAAZ_ADMIN_PASSWORD '
                'for this command instead.'
            )

        prompt = 'New password: ' if existing else 'Password: '
        password = getpass.getpass(prompt)
        if password != getpass.getpass('Confirm: '):
            raise CommandError('The two passwords did not match.')
        if not password:
            raise CommandError('A password is required.')
        return password

    def _validate(self, password, user):
        try:
            validate_password(password, user)
        except ValidationError as exc:
            raise CommandError('\n'.join(exc.messages)) from exc
