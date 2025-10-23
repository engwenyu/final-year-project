import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from apps.buses.models import Bus
from apps.journeys.models import NFCTransaction, Journey
from django.utils import timezone

User = get_user_model()


class BusTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.bus_id = self.scope['url_route']['kwargs']['bus_id']
        self.bus_group_name = f'bus_tracking_{self.bus_id}'

        # Join bus tracking group
        await self.channel_layer.group_add(
            self.bus_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial bus location
        bus_data = await self.get_bus_location()
        if bus_data:
            await self.send(text_data=json.dumps({
                'type': 'location_update',
                'data': bus_data
            }))

    async def disconnect(self, close_code):
        # Leave bus tracking group
        await self.channel_layer.group_discard(
            self.bus_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'update_location':
            # Driver updating bus location
            await self.update_bus_location(data)
            
            # Broadcast to all subscribers
            await self.channel_layer.group_send(
                self.bus_group_name,
                {
                    'type': 'location_broadcast',
                    'data': data
                }
            )

    async def location_broadcast(self, event):
        # Send location update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_bus_location(self):
        try:
            bus = Bus.objects.get(id=self.bus_id)
            return {
                'bus_id': bus.id,
                'bus_number': bus.bus_number,
                'latitude': str(bus.current_latitude) if bus.current_latitude else None,
                'longitude': str(bus.current_longitude) if bus.current_longitude else None,
                'last_update': bus.last_location_update.isoformat() if bus.last_location_update else None,
                'driver_name': bus.driver.get_full_name() if bus.driver else None
            }
        except Bus.DoesNotExist:
            return None

    @database_sync_to_async
    def update_bus_location(self, data):
        try:
            bus = Bus.objects.get(id=self.bus_id)
            if data.get('latitude') and data.get('longitude'):
                bus.current_latitude = data['latitude']
                bus.current_longitude = data['longitude']
                bus.last_location_update = timezone.now()
                bus.save()
                return True
        except Bus.DoesNotExist:
            pass
        return False


class DriverNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.driver_id = self.scope['url_route']['kwargs']['driver_id']
        self.driver_group_name = f'driver_notifications_{self.driver_id}'

        # Join driver notification group
        await self.channel_layer.group_add(
            self.driver_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave driver notification group
        await self.channel_layer.group_discard(
            self.driver_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Handle driver-specific messages if needed
        pass

    async def passenger_checkin(self, event):
        # Send passenger check-in notification to driver
        await self.send(text_data=json.dumps({
            'type': 'passenger_checkin',
            'data': event['data']
        }))

    async def payment_notification(self, event):
        # Send payment notification to driver
        await self.send(text_data=json.dumps({
            'type': 'payment_received',
            'data': event['data']
        }))


class PassengerUpdateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.passenger_group_name = f'passenger_updates_{self.user_id}'

        # Join passenger update group
        await self.channel_layer.group_add(
            self.passenger_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave passenger update group
        await self.channel_layer.group_discard(
            self.passenger_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Handle passenger-specific messages if needed
        pass

    async def booking_confirmation(self, event):
        # Send booking confirmation to passenger
        await self.send(text_data=json.dumps({
            'type': 'booking_confirmed',
            'data': event['data']
        }))

    async def journey_update(self, event):
        # Send journey updates to passenger
        await self.send(text_data=json.dumps({
            'type': 'journey_update',
            'data': event['data']
        }))