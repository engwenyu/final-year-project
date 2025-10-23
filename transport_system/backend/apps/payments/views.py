from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from .models import Wallet, PaymentMethod, Transaction
from .serializers import WalletSerializer, PaymentMethodSerializer, TransactionSerializer
import uuid
from django.db import models
from rest_framework import generics, permissions
from datetime import timedelta

class WalletView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet


class WalletTopupView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        amount = request.data.get('amount')
        payment_method_id = request.data.get('payment_method_id')
        
        if not amount or Decimal(amount) <= 0:
            return Response(
                {'error': 'Invalid amount'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        
        # Create transaction record
        transaction = Transaction.objects.create(
            user=request.user,
            transaction_type='topup',
            amount=Decimal(amount),
            status='completed',  # In real app, would be pending until payment confirmed
            reference_id=f"TOP{uuid.uuid4().hex[:8].upper()}",
            description=f"Wallet top-up of UGX {amount}",
            completed_at=timezone.now()
        )
        
        # Add to wallet balance
        wallet.balance += Decimal(amount)
        wallet.save()
        
        return Response({
            'transaction': TransactionSerializer(transaction).data,
            'new_balance': wallet.balance
        }, status=status.HTTP_201_CREATED)


class MobileMoneyPaymentView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        phone_number = request.data.get('phone_number')
        amount = request.data.get('amount')
        provider = request.data.get('provider', 'MTN')  # MTN, Airtel
        
        if not phone_number or not amount:
            return Response(
                {'error': 'Phone number and amount required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # In a real implementation, you would integrate with mobile money APIs
        # For now, we'll simulate a successful payment
        
        transaction = Transaction.objects.create(
            user=request.user,
            transaction_type='topup',
            amount=Decimal(amount),
            status='completed',
            reference_id=f"MM{uuid.uuid4().hex[:8].upper()}",
            description=f"Mobile Money payment - {provider} {phone_number}",
            completed_at=timezone.now()
        )
        
        return Response(
            TransactionSerializer(transaction).data, 
            status=status.HTTP_201_CREATED
        )


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')


class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DriverEarningsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.user_type != "driver":
            return Response({"error": "Only drivers can view earnings"}, status=403)

        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_month = today.replace(day=1)

        # Filter driver transactions (fare payments linked to their bus journeys)
        today_total = Transaction.objects.filter(
            user=user,
            transaction_type="fare_payment",
            completed_at__date=today,
            status="completed",
        ).aggregate(total=models.Sum("amount"))["total"] or 0

        week_total = Transaction.objects.filter(
            user=user,
            transaction_type="fare_payment",
            completed_at__date__gte=start_of_week,
            status="completed",
        ).aggregate(total=models.Sum("amount"))["total"] or 0

        month_total = Transaction.objects.filter(
            user=user,
            transaction_type="fare_payment",
            completed_at__date__gte=start_of_month,
            status="completed",
        ).aggregate(total=models.Sum("amount"))["total"] or 0

        return Response({
            "today": today_total,
            "week": week_total,
            "month": month_total
        })
    
# payments/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
#from payments.models import Wallet
from decimal import Decimal

User = get_user_model()

class AdminTopUpWalletAPIView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        try:
            amount = Decimal(request.data.get("amount", "0"))
            if amount <= 0:
                return Response({"error": "Amount must be greater than 0"}, status=400)

            user = User.objects.get(id=user_id)
            wallet, created = Wallet.objects.get_or_create(user=user)
            wallet.balance += amount
            wallet.save()

            return Response({
                "success": True,
                "user": user.username,
                "new_balance": wallet.balance
            })
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

