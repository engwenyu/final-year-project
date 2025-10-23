from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/routes/', include('apps.routes.urls')),
    path('api/ratings/', include('apps.ratings.urls')),
    path('api/journeys/', include('apps.journeys.urls')),
    path("api/buses/", include("apps.buses.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/admin/", include("apps.adminpanel.urls")),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/driver/journeys/", include("apps.journeys.urls")),
    path("api/", include("apps.authentication.urls")),  # <--- This makes /api/passenger/ valid
]
