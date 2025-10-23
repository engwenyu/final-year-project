from rest_framework import serializers
from .models import Journey, Booking, NFCTransaction
from apps.routes.serializers import RouteSerializer
from apps.buses.serializers import BusSerializer

class JourneySerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source="bus.bus_number", read_only=True)
    route_name = serializers.CharField(source="route.name", read_only=True)

    class Meta:
        model = Journey
        fields = [
            "id",
            "bus",
            "route",
            "bus_number",
            "route_name",
            "scheduled_departure",
            "scheduled_arrival",
            "status",
            "fare",
            "available_seats",
            "total_seats",
            'cancellation_reason',
        ]

    def create(self, validated_data):
        route = validated_data.get('route')
        # Automatically set fare from the route's base_fare
        validated_data['fare'] = route.base_fare if route else 0
        return super().create(validated_data)
        
class BookingSerializer(serializers.ModelSerializer):
    journey_details = JourneySerializer(source='journey', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'booking_reference', 'seats_booked', 'total_fare', 'status', 'journey_details']
        read_only_fields = ['user']

class NFCTransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    journey_route = serializers.CharField(source='journey.route.name', read_only=True)
    
    class Meta:
        model = NFCTransaction
        fields = '__all__'
        read_only_fields = ('user', 'timestamp')

from rest_framework import serializers
from django.db.models import Sum  # ✅ make sure this import exists
from .models import Journey, Booking


class PassengerJourneySerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    total_seats = serializers.IntegerField(source='bus.capacity', read_only=True)
    available_seats = serializers.SerializerMethodField()
    current_bookings = serializers.SerializerMethodField()

    class Meta:
        model = Journey
        fields = [
            "id",
            "bus_number",
            "route_name",
            "fare",
            "total_seats",
            "available_seats",
            "current_bookings",
            "scheduled_departure",
            "scheduled_arrival",
            "status",
        ]

    def get_available_seats(self, obj):
        # ✅ Sum all confirmed bookings for this journey
        total_booked = (
            Booking.objects.filter(journey=obj, status="confirmed")
            .aggregate(total=Sum("seats_booked"))
            .get("total") or 0
        )

        # ✅ Calculate available seats
        return max(obj.bus.capacity - total_booked, 0)

    def get_current_bookings(self, obj):
        return list(
            Booking.objects.filter(journey=obj, status="confirmed").values(
                "user__username", "seats_booked"
            )
        )
