from django.urls import path
from . import views
from .views import admin_overview_counts

urlpatterns = [
    path("buses/", views.AdminBusesView.as_view(), name="admin-buses"),
    path("buses/assign-driver/", views.AssignDriverToBusView.as_view(), name="assign-driver-bus"),
    path("drivers/", views.AdminDriversView.as_view(), name="admin-drivers"),
    path("passengers/", views.AdminPassengersView.as_view(), name="admin-passengers"),
    path("journeys/", views.AdminJourneysView.as_view(), name="admin-journeys"),
    path("analytics/", views.AdminAnalyticsView.as_view(), name="admin-analytics"),
    path("wallet/topup/", views.AdminWalletTopupView.as_view(), name="admin-wallet-topup"),
    path('unassign-driver/', views.UnassignDriverView.as_view(), name='unassign-driver'),
    path('overview-counts/', admin_overview_counts, name='admin-overview-counts'),
]
