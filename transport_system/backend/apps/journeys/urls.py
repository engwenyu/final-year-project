from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import DriverJourneysView
from .views import JourneyViewSet, BookingViewSet
from .views import cancel_booking
from .views import PassengerAvailableBusesView
from .views import CompleteJourneyView
from .views import CancelJourneyView

router = DefaultRouter()
router.register(r'journeys', JourneyViewSet, basename='journey')
router.register(r'bookings', BookingViewSet, basename='bookings')
router.register(r'nfc-transactions', views.NFCTransactionViewSet)
router.register(r'journeys/bookings', BookingViewSet, basename='booking')


urlpatterns = router.urls + [
    path('', include(router.urls)),
    path("available/", PassengerAvailableBusesView.as_view(), name="available-journeys"),
    path('active-journeys/', views.ActiveJourneysView.as_view(), name='active-journeys'),
    path('driver-journeys/', DriverJourneysView.as_view(), name='driver-journeys'),
    path('nfc-checkin/', views.NFCCheckInView.as_view(), name='nfc-checkin'),
    path('<int:pk>/tap-in/', JourneyViewSet.as_view({'post': 'tap_in'}), name='tap-in'),
    path('<int:pk>/tap-out/', JourneyViewSet.as_view({'post': 'tap_out'}), name='tap-out'),
    path('bookings/cancel/', cancel_booking, name='cancel-booking'),
    path('complete/<int:journey_id>/', CompleteJourneyView.as_view(), name='complete-journey'),
    path('cancel/<int:journey_id>/', CancelJourneyView.as_view(), name='cancel-journey'),
    path('<int:route_id>/available/', views.get_journeys_by_route, name='get_journeys_by_route'),
    #path("available/", views.available_journeys, name="available_journeys"),
    path('available/', views.available_journeys, name='available-journeys'),
] 