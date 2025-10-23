from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()

class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Wallet (Balance: UGX {self.balance})"


class PaymentMethod(models.Model):
    PAYMENT_TYPES = [
        ('wallet', 'Wallet'),
        ('mobile_money', 'Mobile Money'),
        ('card', 'Credit/Debit Card'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    provider = models.CharField(max_length=50, null=True, blank=True)  # MTN, Airtel, Visa, etc.
    account_number = models.CharField(max_length=50, null=True, blank=True)  # Phone number or card number (masked)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_payment_type_display()}"


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('topup', 'Wallet Top-up'),
        ('fare_payment', 'Fare Payment'),
        ('refund', 'Refund'),
    ]
    
    TRANSACTION_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS, default='pending')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True)
    reference_id = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Transaction {self.reference_id} - UGX {self.amount}"

