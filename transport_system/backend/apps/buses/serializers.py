from rest_framework import serializers
from .models import Bus
from apps.journeys.models import Booking
from apps.authentication.serializers import UserSerializer

class BusSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source="driver.get_full_name", read_only=True)
    current_bookings = serializers.SerializerMethodField()

    class Meta:
        model = Bus
        fields = ["id", "bus_number", "license_plate", "capacity", "status", "driver_name", "current_bookings"]

    def get_current_bookings(self, obj):
        bookings = Booking.objects.filter(journey__bus=obj, status="confirmed")
        return UserSerializer([b.user for b in bookings], many=True).data
    
    def get_driver_name(self, obj):
        if obj.driver:
            return f"{obj.driver.first_name} {obj.driver.last_name}"
        return "Unassigned"

    def get_is_assigned(self, obj):
        return obj.driver is not None

    class Meta:
        model = Bus
        fields = '__all__'