"""Make the sign-in identifier actually unique.

`auth_user.email` has no unique constraint out of the box — Django keys on
`username`. This API keys on email, and without a constraint two rows can
share one address, at which point "who is signing in" has no answer.

Enforced in the database rather than in application code because the Django
admin, `createsuperuser`, a data import and a shell session all write to this
table, and only the database sees all of them.

  * `LOWER(email)` — addresses are matched case-insensitively at sign-in, so
    the constraint has to be case-insensitive too, or Alice@ and alice@ both
    get in and neither can be resolved.
  * `WHERE email <> ''` — Django permits a blank email. A plain unique index
    would let exactly one account have no address; a partial one leaves
    address-less accounts (service users, legacy rows) alone.

This runs against an empty auth_user in the current database. On a table
that already holds duplicates it will fail loudly, which is the intended
behaviour: the duplicates have to be resolved by a person, not by whichever
row a query happened to return first.
"""

from django.db import migrations

INDEX_NAME = 'auth_user_email_ci_unique'


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                f'CREATE UNIQUE INDEX IF NOT EXISTS {INDEX_NAME} '
                "ON auth_user (LOWER(email)) WHERE email <> '';"
            ),
            reverse_sql=f'DROP INDEX IF EXISTS {INDEX_NAME};',
        ),
    ]
