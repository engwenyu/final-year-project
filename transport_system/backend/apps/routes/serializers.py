# apps/routes/serializers.py

from rest_framework import serializers
from .models import Route, Stop, BusRouteAssignment
#from apps.buses.models import Bus

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = ['id', 'name', 'fare']

class RouteSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'route_type', 'start_location', 'end_location', 'stops', 'base_fare']

class BusRouteAssignmentSerializer(serializers.ModelSerializer):
    bus = serializers.StringRelatedField()
    route = RouteSerializer()

    class Meta:
        model = BusRouteAssignment
        fields = ['id', 'bus', 'route']
