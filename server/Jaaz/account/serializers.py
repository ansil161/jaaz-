"""Request validation and the safe user representation.

Validation runs here, on the server, on every field — the login form does
its own checking so people are not made to wait for a round trip to learn
they left a box empty, but nothing the browser reports is believed.
"""

from rest_framework import serializers

from .roles import role_for


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        max_length=254,
        trim_whitespace=True,
        error_messages={
            'required': 'Enter your email address.',
            'blank': 'Enter your email address.',
            'invalid': 'Enter a valid email address.',
        },
    )
    # An upper bound only. There is no minimum and no complexity rule at the
    # sign-in door: strength is enforced when a password is *set*, and a
    # length rule here would only tell an attacker how short to stop trying.
    # The cap exists because the hash function's cost is a function of input
    # size, so an unbounded field is a cheap way to burn server CPU.
    password = serializers.CharField(
        max_length=256,
        trim_whitespace=False,
        style={'input_type': 'password'},
        error_messages={
            'required': 'Enter your password.',
            'blank': 'Enter your password.',
        },
    )

    def validate_email(self, value):
        return value.strip().lower()


class UserSerializer(serializers.Serializer):
    """What the API is willing to say about an account.

    An explicit allow-list rather than a ModelSerializer over auth.User. A
    ModelSerializer with `exclude` leaks whatever field is added next; this
    one can only ever emit what is written below, and `password` is not.
    """

    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    lastLoginAt = serializers.SerializerMethodField()

    def get_name(self, user):
        return user.get_full_name() or user.get_username()

    def get_role(self, user):
        return role_for(user)

    def get_lastLoginAt(self, user):
        return user.last_login.isoformat() if user.last_login else None
