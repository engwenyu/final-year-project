from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import DriverEarningsView
from .views import AdminTopUpWalletAPIView
from .views import PassengerWalletDetailView

router = DefaultRouter()
router.register(r'transactions', views.TransactionViewSet)
router.register(r'payment-methods', views.PaymentMethodViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('wallet/', views.WalletView.as_view(), name='wallet'),
    path('wallet/topup/', views.WalletTopupView.as_view(), name='wallet-topup'),
    path('mobile-money/', views.MobileMoneyPaymentView.as_view(), name='mobile-money'),
    path("driver/earnings/", DriverEarningsView.as_view(), name="driver-earnings"),
    path("wallet/topup/<int:user_id>/", AdminTopUpWalletAPIView.as_view(), name="admin-topup-wallet"),
    path('wallet/<int:passenger_id>/', PassengerWalletDetailView.as_view(), name='passenger-wallet-detail'),
]

