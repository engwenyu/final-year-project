from django.urls import path
from . import views
from .views import PassengerAvailableBusesView
from .views import AvailableBusesView
from .views import BusViewSet, BusAvailableViewSet
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'buses', BusViewSet, basename='bus')
router.register(r'buses', views.BusViewSet, basename='buses')
router.register(r'available', BusAvailableViewSet, basename='bus-available')

urlpatterns = [
    # Admin
    path('admin-buses/', views.AdminBusesView.as_view(), name='admin-buses'),
    path('assign-driver/', views.AssignDriverView.as_view(), name='assign-driver'),

    # Driver
    path('driver-buses/', views.DriverAssignedBusesView.as_view(), name='driver-buses'),

    # Bus tracking / location
    path('update-location/', views.UpdateLocationView.as_view(), name='update-location'),
    path('bus-location/<int:bus_id>/', views.BusTrackingView.as_view(), name='bus-location'),

    # General: list all buses (for dropdowns, etc.)
    path('buses-list/', views.BusListView.as_view(), name='bus-list'),
    # List all buses for general use (matches frontend call /buses/)
    path('buses/', views.BusListView.as_view(), name='buses'),

    path("buses/available/", PassengerAvailableBusesView.as_view(), name="available-buses"),
    path('available/', AvailableBusesView.as_view(), name='available-buses'),
    path('<int:pk>/update_status/', views.update_bus_status, name='update-bus-status'),
    
]
urlpatterns += router.urls