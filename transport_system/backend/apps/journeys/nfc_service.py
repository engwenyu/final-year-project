from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import NFCTransaction, Journey
from apps.buses.models import Bus
from apps.payments.tasks import process_fare_payment
from apps.websockets.utils import send_passenger_checkin_notification
from decimal import Decimal


class NFCService:
    @staticmethod
    def process_nfc_tap(nfc_card_id, bus_id, transaction_type, location_data=None):
        """
        Process NFC card tap (check-in or check-out)
        """
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Get user by NFC card
            user = get_object_or_404(User, nfc_card_id=nfc_card_id)
            
            # Get bus
            bus = get_object_or_404(Bus, id=bus_id)
            
            # Get active journey for this bus
            journey = Journey.objects.filter(
                bus=bus,
                status='active',
                scheduled_departure__date=timezone.now().date()
            ).first()
            
            if not journey:
                return {
                    'success': False,
                    'error': 'No active journey for this bus'
                }
            
            # Create NFC transaction
            nfc_transaction = NFCTransaction.objects.create(
                user=user,
                journey=journey,
                bus=bus,
                nfc_card_id=nfc_card_id,
                transaction_type=transaction_type,
                stop_name=location_data.get('stop_name') if location_data else None,
                latitude=location_data.get('latitude') if location_data else None,
                longitude=location_data.get('longitude') if location_data else None
            )
            
            # Process payment for check-in
            if transaction_type == 'tap_in':
                fare = journey.fare
                
                # Process fare payment asynchronously
                payment_result = process_fare_payment.delay(
                    user.id, 
                    journey.id, 
                    float(fare)
                )
                
                # Update NFC transaction with fare info
                nfc_transaction.fare_charged = fare
                nfc_transaction.save()
                
                # Send real-time notification to driver
                send_passenger_checkin_notification(bus.driver.id, {
                    'passenger_name': user.get_full_name(),
                    'passenger_id': user.id,
                    'nfc_card_id': nfc_card_id,
                    'stop_name': location_data.get('stop_name') if location_data else 'Unknown',
                    'fare_charged': float(fare),
                    'transaction_type': transaction_type,
                    'timestamp': nfc_transaction.timestamp.isoformat()
                })
            
            return {
                'success': True,
                'transaction_id': nfc_transaction.id,
                'fare_charged': float(nfc_transaction.fare_charged or 0),
                'passenger_name': user.get_full_name()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
