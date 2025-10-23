from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import DriverListView, PassengerListView
from .views import PassengerDetailAPIView

router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('drivers/', DriverListView.as_view(), name="driver-list"),
    path('passengers/', PassengerListView.as_view(), name="passenger-list"),
    path('passenger/', PassengerDetailAPIView.as_view(), name='passenger-detail'),
]
