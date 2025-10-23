from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

channel_layer = get_channel_layer()


def send_passenger_checkin_notification(driver_id, checkin_data):
    """Send real-time notification to driver when passenger checks in"""
    async_to_sync(channel_layer.group_send)(
        f'driver_notifications_{driver_id}',
        {
            'type': 'passenger_checkin',
            'data': checkin_data
        }
    )


def send_payment_notification(driver_id, payment_data):
    """Send payment notification to driver"""
    async_to_sync(channel_layer.group_send)(
        f'driver_notifications_{driver_id}',
        {
            'type': 'payment_notification',
            'data': payment_data
        }
    )


def send_booking_confirmation(user_id, booking_data):
    """Send booking confirmation to passenger"""
    async_to_sync(channel_layer.group_send)(
        f'passenger_updates_{user_id}',
        {
            'type': 'booking_confirmation',
            'data': booking_data
        }
    )


def send_journey_update(user_id, journey_data):
    """Send journey updates to passenger"""
    async_to_sync(channel_layer.group_send)(
        f'passenger_updates_{user_id}',
        {
            'type': 'journey_update',
            'data': journey_data
        }
    )