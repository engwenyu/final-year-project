from rest_framework import serializers
from .models import Journey, Booking
from apps.routes.serializers import RouteSerializer
from apps.buses.serializers import BusSerializer

class JourneySerializer(serializers.ModelSerializer):
    #bus_number = serializers.CharField(source="bus.bus_number", read_only=True)
    #route_name = serializers.CharField(source="route.name", read_only=True)
    route_name = serializers.CharField(source="route.name", read_only=True)
    bus_number = serializers.CharField(source="bus.bus_number", read_only=True)

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
        

# apps/journeys/serializers.py
from rest_framework import serializers
from .models import Booking
from apps.journeys.models import Journey  # adjust import path if necessary
# If you have Stop model: from apps.routes.models import Stop

from django.db.models import Sum

class BookingSerializer(serializers.ModelSerializer):
    journey = JourneySerializer(read_only=True)
    journey_route_name = serializers.SerializerMethodField()
    pickup_stop_name = serializers.CharField(source="pickup_stop", read_only=True)
    dropoff_stop_name = serializers.CharField(source="dropoff_stop", read_only=True)
    journey_details = serializers.SerializerMethodField()
    route_name = serializers.SerializerMethodField()
    bus_number = serializers.SerializerMethodField()
    available_seats = serializers.SerializerMethodField()  # ✅ NEW FIELD

    class Meta:
        model = Booking
        fields = [
            "id",
            "booking_reference",
            "user",
            "journey",
            "journey_route_name",
            "journey_details",
            "route_name",
            "bus_number",
            "available_seats",  # ✅ added
            "seats_booked",
            "pickup_stop",
            "pickup_stop_name",
            "dropoff_stop",
            "dropoff_stop_name",
            "base_fare",
            "total_fare",
            "status",
            "created_at",
            'tapped_in'
        ]
        read_only_fields = [
            "booking_reference",
            "base_fare",
            "total_fare",
            "status",
            "created_at",
            "user"
        ]

    def get_available_seats(self, obj):
        """
        Calculate remaining seats for this booking's bus:
        Bus capacity - sum of booked seats on that journey.
        """
        if not obj.journey or not obj.journey.bus:
            return 0

        bus_capacity = obj.journey.bus.capacity

        # Sum all confirmed bookings for this journey
        total_booked = (
            Booking.objects.filter(journey=obj.journey, status="confirmed")
            .aggregate(total=Sum("seats_booked"))
            .get("total") or 0
        )

        remaining = bus_capacity - total_booked
        return max(remaining, 0)


    def get_route(self, obj):
        """Expose route name directly"""
        if obj.journey and obj.journey.route:
            return obj.journey.route.name
        return None

    def get_route_name(self, obj):
        """Get readable route name"""
        try:
            if obj.journey and obj.journey.route:
                route = obj.journey.route
                return route.name or f"{getattr(route, 'start', '')} → {getattr(route, 'destination', '')}"
        except Exception:
            pass
        return "Unknown Route"

    def get_bus_number(self, obj):
        if obj.journey and obj.journey.bus:
            return obj.journey.bus.bus_number
        return "Unknown Bus"

    def get_journey_route_name(self, obj):
        if obj.journey:
            return str(obj.journey)
        return None

    def get_journey_details(self, obj):
        j = obj.journey
        if not j:
            return None
        return {
            "id": j.id,
            "bus_number": getattr(j.bus, "bus_number", None),
            "route_name": getattr(j.route, "name", None) or str(j),
            "scheduled_departure": j.scheduled_departure,
            "scheduled_arrival": j.scheduled_arrival,
            "journey_fare": j.fare,
            "total_seats": getattr(j, "total_seats", None),
            "available_seats": getattr(j, "available_seats", None),
        }
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
