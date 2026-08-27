"""Admin-console API.

Everything under here is gated by IsAuthenticated + IsAdmin. The gate is
declared per view rather than assumed from the URL prefix, so a view added
to this app later cannot become public by being forgotten about.

The dashboard is intentionally thin — it reads counts off models that
already exist. It is the foundation the console will grow on, not a feature
set; user management, analytics and permission editing are deliberately not
here yet.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from account.models import AccountProfile, AccountStatus
from account.permissions import IsAdmin, IsAuthenticated
from account.serializers import UserSerializer


class AdminAPIView(APIView):
    """Base class carrying the console's authorization rule.

    Subclassing rather than repeating the tuple means the rule is stated
    once, and a new endpoint gets it by construction.
    """

    permission_classes = [IsAuthenticated, IsAdmin]


class OverviewView(AdminAPIView):
    """The numbers behind the dashboard's summary cards."""

    def get(self, request):
        user_model = get_user_model()
        since = timezone.now() - timedelta(days=30)

        return Response(
            {
                'viewer': UserSerializer(request.user).data,
                'stats': {
                    'totalAccounts': user_model.objects.count(),
                    'administrators': user_model.objects.filter(
                        Q(is_staff=True) | Q(is_superuser=True)
                    ).count(),
                    'activeAccounts': AccountProfile.objects.filter(
                        status=AccountStatus.ACTIVE, user__is_active=True
                    ).count(),
                    'signedInLast30Days': user_model.objects.filter(
                        last_login__gte=since
                    ).count(),
                },
                'generatedAt': timezone.now().isoformat(),
            }
        )
