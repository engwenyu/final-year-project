from django.urls import path
from . import views
from .views import admin_overview_counts
# In your urls.py (wherever you define admin routes)
from django.urls import path
from .views import (
    AdminBusesView,
    AdminDriversView,
    AdminPassengersView,
    AdminPassengerDetailView,
    AdminPassengerBookingsView,
    AdminPassengerTransactionsView,
    AdminJourneysView,
    AdminAnalyticsView,
    AdminWalletTopupView,
    AssignDriverToBusView,
    UnassignDriverView,
    admin_overview_counts,
)

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
    path('passengers/<int:passenger_id>/', AdminPassengerDetailView.as_view(), name='admin-passenger-detail'),
    path('passengers/<int:passenger_id>/bookings/', AdminPassengerBookingsView.as_view(), name='admin-passenger-bookings'),
    path('passengers/<int:passenger_id>/transactions/', AdminPassengerTransactionsView.as_view(), name='admin-passenger-transactions'),
]
