"""
URL configuration for Jaaz project.

Two prefixes, matching the two apps:

    /api/auth/   → account   — sign in, sign out, who am I
    /api/admin/  → admin     — console data, admins only

`/django-admin/` is Django's own site. It is kept, because it is where an
operator manages accounts and releases a lockout, but moved off `/admin/`
so it does not collide with the console's own URL space on the frontend.
"""

from django.contrib import admin as django_admin
from django.urls import include, path, re_path

from common.views import ApiNotFoundView

urlpatterns = [
    path('django-admin/', django_admin.site.urls),
    path('api/auth/', include('account.urls')),
    path('api/admin/', include('admin.urls')),
    # The assistant. Any authenticated user, not just administrators — and
    # the only route by which a browser reaches the AI service.
    path('api/chat/', include('chat.urls')),
    # Anything else under /api/ answers in the API's own error shape. Django's
    # default 404 is an HTML page, and with DEBUG on it prints the entire
    # URLconf — neither belongs in a response to a JSON client.
    re_path(r'^api/', ApiNotFoundView.as_view()),
]
