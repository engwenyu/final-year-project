from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.buses.models import Bus
from apps.journeys.nfc_service import NFCService
import time
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Simulate NFC card taps for testing'

    def add_arguments(self, parser):
        parser.add_argument('--bus-id', type=int, help='Bus ID to simulate taps for')
        parser.add_argument('--count', type=int, default=5, help='Number of taps to simulate')

    def handle(self, *args, **options):
        bus_id = options['bus_id']
        count = options['count']
        
        if not bus_id:
            buses = Bus.objects.filter(status='active')
            if not buses:
                self.stdout.write('No active buses found')
                return
            bus_id = buses.first().id

        # Get passengers with NFC cards
        passengers = User.objects.filter(
            user_type='passenger',
            nfc_card_id__isnull=False
        )
        
        if not passengers:
            self.stdout.write('No passengers with NFC cards found')
            return

        stops = [
            {'name': 'Kampala Central', 'lat': 0.3136, 'lng': 32.5811},
            {'name': 'Nakawa', 'lat': 0.3344, 'lng': 32.6078},
            {'name': 'Ntinda', 'lat': 0.3542, 'lng': 32.6139},
            {'name': 'Kyanja', 'lat': 0.3678, 'lng': 32.6234},
        ]

        for i in range(count):
            passenger = random.choice(passengers)
            stop = random.choice(stops)
            
            result = NFCService.process_nfc_tap(
                nfc_card_id=passenger.nfc_card_id,
                bus_id=bus_id,
                transaction_type='tap_in',
                location_data={
                    'stop_name': stop['name'],
                    'latitude': stop['lat'],
                    'longitude': stop['lng']
                }
            )
            
            if result['success']:
                self.stdout.write(
                    f'✓ Simulated tap-in for {passenger.get_full_name()} at {stop["name"]}'
                )
            else:
                self.stdout.write(
                    f'✗ Failed to simulate tap for {passenger.get_full_name()}: {result["error"]}'
                )
            
            time.sleep(2)  # Wait 2 seconds between taps
