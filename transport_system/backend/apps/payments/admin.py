from django.contrib import admin
from .models import Wallet, PaymentMethod, Transaction


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'balance', 'created_at', 'updated_at')
    search_fields = ('user__username',)
    ordering = ('-updated_at',)


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'payment_type',
        'provider',
        'account_number',
        'is_default',
        'is_active',
        'created_at',
    )
    list_filter = ('payment_type', 'is_active', 'is_default', 'created_at')
    search_fields = ('user__username', 'provider', 'account_number')
    ordering = ('-created_at',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'reference_id',
        'user',
        'transaction_type',
        'amount',
        'status',
        'payment_method',
        'created_at',
        'completed_at',
    )
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('reference_id', 'user__username', 'description')
    ordering = ('-created_at',)
