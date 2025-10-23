from celery import shared_task
from django.utils import timezone
from decimal import Decimal
from .models import Transaction, Wallet
from apps.websockets.utils import send_payment_notification
import uuid


@shared_task
def process_mobile_money_payment(user_id, amount, phone_number, provider):
    """
    Process mobile money payment asynchronously
    In a real implementation, this would integrate with MTN Mobile Money, Airtel Money APIs
    """
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.get(id=user_id)
        
        # Simulate API call to mobile money provider
        # In real implementation, you would call the actual API here
        
        # Create successful transaction
        transaction = Transaction.objects.create(
            user=user,
            transaction_type='topup',
            amount=Decimal(amount),
            status='completed',
            reference_id=f"MM{uuid.uuid4().hex[:8].upper()}",
            description=f"Mobile Money payment - {provider} {phone_number}",
            completed_at=timezone.now()
        )
        
        # Update wallet balance
        wallet, created = Wallet.objects.get_or_create(user=user)
        wallet.balance += Decimal(amount)
        wallet.save()
        
        # Send notification if driver is involved
        if hasattr(user, 'bus_set') and user.bus_set.exists():
            send_payment_notification(user.id, {
                'transaction_id': transaction.id,
                'amount': float(amount),
                'type': 'mobile_money_topup'
            })
        
        return {'status': 'success', 'transaction_id': transaction.id}
        
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}


@shared_task
def process_fare_payment(user_id, journey_id, fare_amount):
    """Process fare payment when passenger taps NFC card"""
    try:
        from django.contrib.auth import get_user_model
        from apps.journeys.models import Journey
        
        User = get_user_model()
        user = User.objects.get(id=user_id)
        journey = Journey.objects.get(id=journey_id)
        
        wallet = Wallet.objects.get(user=user)
        
        if wallet.balance < Decimal(fare_amount):
            return {'status': 'failed', 'error': 'Insufficient balance'}
        
        # Create payment transaction
        transaction = Transaction.objects.create(
            user=user,
            transaction_type='fare_payment',
            amount=Decimal(fare_amount),
            status='completed',
            reference_id=f"FARE{uuid.uuid4().hex[:8].upper()}",
            description=f"Fare payment for journey {journey_id}",
            completed_at=timezone.now()
        )
        
        # Deduct from wallet
        wallet.balance -= Decimal(fare_amount)
        wallet.save()
        
        # Credit driver's wallet if available
        try:
            driver = journey.bus.driver
            if driver:
                driver_wallet, _ = Wallet.objects.get_or_create(user=driver)
                driver_wallet.balance += Decimal(fare_amount)
                driver_wallet.save()
        except Exception:
            # Do not fail fare processing if driver crediting fails
            pass

        # Notify driver
        if journey.bus.driver:
            send_payment_notification(journey.bus.driver.id, {
                'transaction_id': transaction.id,
                'passenger_name': user.get_full_name(),
                'amount': float(fare_amount),
                'type': 'fare_payment'
            })
        
        return {'status': 'success', 'transaction_id': transaction.id}
        
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}
