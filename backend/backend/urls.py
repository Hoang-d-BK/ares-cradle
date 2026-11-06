"""
URL configuration for Ares Cradle Backend.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Phase 11 Dedicated Endpoints
    path('api/simulation/', include('apps.simulation.urls')),
    path('api/telemetry/', include('apps.telemetry.urls')),
    # Backward Compatibility v1 Routes
    path('api/v1/stages/', include('apps.simulation.urls')),
    path('api/v1/', include('apps.telemetry.urls')),
]
