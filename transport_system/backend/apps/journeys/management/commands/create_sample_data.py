from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.buses.models import Bus
from apps.routes.models import Route, RouteStop
from apps.journeys.models import Journey
from apps.payments.models import Wallet
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create users
        self.create_users()
        
        # Create routes
        self.create_routes()
        
        # Create buses
        self.create_buses()
        
        # Create journeys
        self.create_journeys()
        
        self.stdout.write('Sample data created successfully!')

    def create_users(self):
        # Create admin
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@transport.com',
                'first_name': 'System',
                'last_name': 'Admin',
                'user_type': 'admin',
                'phone_number': '+256700000000'
            }
        )
        if created:
            admin.set_password('password123')
            admin.save()

        # Create drivers
        drivers_data = [
            {'username': 'driver1', 'name': 'John Mukasa', 'phone': '+256700000001'},
            {'username': 'driver2', 'name': 'Mary Nakato', 'phone': '+256700000002'},
            {'username': 'driver3', 'name': 'Peter Okello', 'phone': '+256700000003'},
        ]
        
        for driver_data in drivers_data:
            driver, created = User.objects.get_or_create(
                username=driver_data['username'],
                defaults={
                    'email': f"{driver_data['username']}@transport.com",
                    'first_name': driver_data['name'].split()[0],
                    'last_name': driver_data['name'].split()[1],
                    'user_type': 'driver',
                    'phone_number': driver_data['phone']
                }
            )
            if created:
                driver.set_password('password123')
                driver.save()

        # Create passengers
        passengers_data = [
            {'username': 'passenger1', 'name': 'Alice Nambi', 'phone': '+256700000011'},
            {'username': 'passenger2', 'name': 'Bob Kiprotich', 'phone': '+256700000012'},
            {'username': 'passenger3', 'name': 'Grace Aceng', 'phone': '+256700000013'},
            {'username': 'passenger4', 'name': 'David Ssali', 'phone': '+256700000014'},
        ]
        
        for passenger_data in passengers_data:
            passenger, created = User.objects.get_or_create(
                username=passenger_data['username'],
                defaults={
                    'email': f"{passenger_data['username']}@transport.com",
                    'first_name': passenger_data['name'].split()[0],
                    'last_name': passenger_data['name'].split()[1],
                    'user_type': 'passenger',
                    'phone_number': passenger_data['phone'],
                    'nfc_card_id': f"NFC{uuid.uuid4().hex[:8].upper()}"
                }
            )
            if created:
                passenger.set_password('password123')
                passenger.save()
                
                # Create wallet with initial balance
                Wallet.objects.create(user=passenger, balance=50000)

    def create_routes(self):
        # Intercity routes
        intercity_routes = [
            {
                'name': 'Kampala - Entebbe Express',
                'start': 'Kampala Central',
                'end': 'Entebbe Airport',
                'distance': 35,
                'duration': 45,
                'fare': 5000,
                'stops': [
                    {'name': 'Kampala Central', 'lat': 0.3136, 'lng': 32.5811, 'distance': 0},
                    {'name': 'Kibuye', 'lat': 0.2876, 'lng': 32.5511, 'distance': 8},
                    {'name': 'Kajjansi', 'lat': 0.2234, 'lng': 32.5234, 'distance': 18},
                    {'name': 'Entebbe Town', 'lat': 0.0565, 'lng': 32.4637, 'distance': 30},
                    {'name': 'Entebbe Airport', 'lat': 0.0422, 'lng': 32.4435, 'distance': 35}
                ]
            },
            {
                'name': 'Kampala - Jinja Highway',
                'start': 'Kampala Central',
                'end': 'Jinja Main',
                'distance': 82,
                'duration': 90,
                'fare': 8000,
                'stops': [
                    {'name': 'Kampala Central', 'lat': 0.3136, 'lng': 32.5811, 'distance': 0},
                    {'name': 'Nakawa', 'lat': 0.3344, 'lng': 32.6078, 'distance': 5},
                    {'name': 'Mukono', 'lat': 0.3533, 'lng': 32.7553, 'distance': 25},
                    {'name': 'Lugazi', 'lat': 0.4086, 'lng': 32.9372, 'distance': 50},
                    {'name': 'Jinja Main', 'lat': 0.4244, 'lng': 33.2042, 'distance': 82}
                ]
            }
        ]
        
        # Outcity routes
        outcity_routes = [
            {
                'name': 'Kampala - Mbarara Express',
                'start': 'Kampala Central',
                'end': 'Mbarara Town',
                'distance': 266,
                'duration': 300,
                'fare': 25000,
                'stops': [
                    {'name': 'Kampala Central', 'lat': 0.3136, 'lng': 32.5811, 'distance': 0},
                    {'name': 'Masaka', 'lat': -0.3517, 'lng': 31.7325, 'distance': 132},
                    {'name': 'Lyantonde', 'lat': -0.4103, 'lng': 31.1519, 'distance': 180},
                    {'name': 'Mbarara Town', 'lat': -0.6067, 'lng': 30.6583, 'distance': 266}
                ]
            },
            {
                'name': 'Kampala - Arua Highway',
                'start': 'Kampala Central',
                'end': 'Arua Town',
                'distance': 518,
                'duration': 480,
                'fare': 35000,
                'stops': [
                    {'name': 'Kampala Central', 'lat': 0.3136, 'lng': 32.5811, 'distance': 0},
                    {'name': 'Luweero', 'lat': 0.8492, 'lng': 32.4736, 'distance': 72},
                    {'name': 'Masindi', 'lat': 1.6839, 'lng': 31.7153, 'distance': 200},
                    {'name': 'Nebbi', 'lat': 2.4778, 'lng': 31.0889, 'distance': 350},
                    {'name': 'Arua Town', 'lat': 3.0197, 'lng': 30.9108, 'distance': 518}
                ]
            },
            {
                'name': 'Kampala - Gulu Express',
                'start': 'Kampala Central',
                'end': 'Gulu Main',
                'distance': 340,
                'duration': 360,
                'fare': 30000,
                'stops': [
                    {'name': 'Kampala Central', 'lat': 0.3136, 'lng': 32.5811, 'distance': 0},
                    {'name': 'Luweero', 'lat': 0.8492, 'lng': 32.4736, 'distance': 72},
                    {'name': 'Karuma', 'lat': 2.2447, 'lng': 32.1958, 'distance': 220},
                    {'name': 'Gulu Main', 'lat': 2.7797, 'lng': 32.2994, 'distance': 340}
                ]
            }
        ]
        
        all_routes = []
        all_routes.extend([{**route, 'type': 'intercity'} for route in intercity_routes])
        all_routes.extend([{**route, 'type': 'outcity'} for route in outcity_routes])
        
        for route_data in all_routes:
            route, created = Route.objects.get_or_create(
                name=route_data['name'],
                defaults={
                    'route_type': route_data['type'],
                    'start_location': route_data['start'],
                    'end_location': route_data['end'],
                    'distance_km': route_data['distance'],
                    'estimated_duration_minutes': route_data['duration'],
                    'base_fare': route_data['fare'],
                    'is_active': True
                }
            )
            
            if created:
                # Create route stops
                for i, stop_data in enumerate(route_data['stops']):
                    RouteStop.objects.create(
                        route=route,
                        stop_name=stop_data['name'],
                        latitude=stop_data['lat'],
                        longitude=stop_data['lng'],
                        stop_order=i + 1,
                        distance_from_start=stop_data['distance']
                    )

    def create_buses(self):
        buses_data = [
            {'number': 'KAM-001', 'plate': 'UAX 001A', 'capacity': 50, 'driver': 'driver1'},
            {'number': 'KAM-002', 'plate': 'UAX 002B', 'capacity': 45, 'driver': 'driver2'},
            {'number': 'KAM-003', 'plate': 'UAX 003C', 'capacity': 55, 'driver': 'driver3'},
            {'number': 'KAM-004', 'plate': 'UAX 004D', 'capacity': 50, 'driver': None},
        ]
        
        for bus_data in buses_data:
            driver = None
            if bus_data['driver']:
                try:
                    driver = User.objects.get(username=bus_data['driver'])
                except User.DoesNotExist:
                    pass
            
            bus, created = Bus.objects.get_or_create(
                bus_number=bus_data['number'],
                defaults={
                    'license_plate': bus_data['plate'],
                    'capacity': bus_data['capacity'],
                    'driver': driver,
                    'status': 'active',
                    'nfc_reader_id': f"NFC_READER_{uuid.uuid4().hex[:8].upper()}",
                    'current_latitude': 0.3136 + (0.001 * len(Bus.objects.all())),
                    'current_longitude': 32.5811 + (0.001 * len(Bus.objects.all())),
                    'last_location_update': timezone.now()
                }
            )

    def create_journeys(self):
        routes = Route.objects.all()
        buses = Bus.objects.filter(status='active')
        
        if not routes or not buses:
            return
        
        # Create journeys for today and tomorrow
        for day_offset in [0, 1]:
            date = timezone.now().date() + timedelta(days=day_offset)
            
            for route in routes:
                # Create 2-3 journeys per route per day
                journey_times = [
                    timezone.datetime.combine(date, timezone.datetime.min.time().replace(hour=6, minute=0)),
                    timezone.datetime.combine(date, timezone.datetime.min.time().replace(hour=10, minute=0)),
                    timezone.datetime.combine(date, timezone.datetime.min.time().replace(hour=14, minute=0)),
                    timezone.datetime.combine(date, timezone.datetime.min.time().replace(hour=18, minute=0)),
                ]
                
                for i, departure_time in enumerate(journey_times[:2]):  # Limit to 2 journeys per route
                    if i >= len(buses):
                        break
                        
                    bus = buses[i % len(buses)]
                    arrival_time = departure_time + timedelta(minutes=route.estimated_duration_minutes)
                    
                    journey, created = Journey.objects.get_or_create(
                        route=route,
                        bus=bus,
                        scheduled_departure=departure_time,
                        defaults={
                            'scheduled_arrival': arrival_time,
                            'status': 'scheduled' if day_offset > 0 else 'active',
                            'fare': route.base_fare,
                            'available_seats': bus.capacity - 5  # Some seats already booked
                        }
                    )
