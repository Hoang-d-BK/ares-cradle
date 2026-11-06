"""
URL configuration for Ares Cradle Backend.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/stages/', include('apps.simulation.urls')),
    path('api/v1/', include('apps.telemetry.urls')),
]
