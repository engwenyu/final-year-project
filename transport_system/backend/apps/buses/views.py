from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Bus
from .serializers import BusSerializer
from rest_framework.views import APIView
from apps.authentication.models import CustomUser
from rest_framework import permissions
from rest_framework.permissions import IsAdminUser
from apps.journeys.models import Journey, Booking
from django.db.models import Sum


class BusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bus.objects.filter(status='active')
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def location(self, request, pk=None):
        bus = self.get_object()
        return Response({
            'bus_id': bus.id,
            'latitude': bus.current_latitude,
            'longitude': bus.current_longitude,
            'last_update': bus.last_location_update
        })
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        bus = self.get_object()
        status_value = request.data.get("status")
        if status_value not in dict(Bus.BUS_STATUS):
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        bus.status = status_value
        bus.save()
        return Response({"status": bus.status})
# Admin Views
class AdminBusesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        buses = Bus.objects.all().values(
            'id', 'bus_number', 'license_plate', 'capacity', 'status', 'driver_id'
        )

        # Add driver name if assigned
        bus_list = []
        for bus in buses:
            driver = None
            if bus['driver_id']:
                driver_obj = CustomUser.objects.filter(id=bus['driver_id']).first()
                if driver_obj:
                    driver = f"{driver_obj.first_name} {driver_obj.last_name}"
            bus['driver_name'] = driver
            bus_list.append(bus)

        return Response(bus_list)


class AssignDriverView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        bus_id = request.data.get("bus_id")
        driver_id = request.data.get("driver_id")

        if not bus_id:
            return Response({"error": "bus_id is required"}, status=400)

        try:
            bus = Bus.objects.get(id=bus_id)
        except Bus.DoesNotExist:
            return Response({"error": "Bus not found"}, status=404)

        if driver_id:
            # Assign a driver
            try:
                driver = CustomUser.objects.get(id=driver_id, user_type="driver")
            except CustomUser.DoesNotExist:
                return Response({"error": "Driver not found"}, status=404)

            bus.driver = driver
            message = "Driver assigned successfully"
        else:
            # Unassign the driver
            bus.driver = None
            message = "Driver unassigned successfully"

        # When unassigning a driver
        if not driver_id:
            # terminate all journeys for that bus
            Journey.objects.filter(bus=bus, status__in=['scheduled', 'active']).update(status='cancelled')

        bus.save()
        return Response({"message": message, "bus": BusSerializer(bus).data})

# Driver Views
class DriverAssignedBusesView(generics.ListAPIView):
    serializer_class = BusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == "driver":
            return Bus.objects.filter(driver=user)
        return Bus.objects.none()

# Bus Tracking / Location
class BusTrackingView(generics.RetrieveAPIView):
    serializer_class = BusSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'bus_id'

    def get_queryset(self):
        return Bus.objects.filter(status='active')

class UpdateLocationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.user_type != 'driver':
            return Response({'error': 'Only drivers can update location'}, status=status.HTTP_403_FORBIDDEN)
        try:
            bus = Bus.objects.get(driver=request.user)
        except Bus.DoesNotExist:
            return Response({'error': 'No bus assigned to driver'}, status=status.HTTP_400_BAD_REQUEST)

        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        if not latitude or not longitude:
            return Response({'error': 'Latitude and longitude required'}, status=status.HTTP_400_BAD_REQUEST)

        bus.current_latitude = latitude
        bus.current_longitude = longitude
        bus.last_location_update = timezone.now()
        bus.save()

        return Response(BusSerializer(bus).data)

# Optional: List all buses
class BusListView(generics.ListAPIView):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAdminUser]


class PassengerAvailableBusesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        buses = Bus.objects.filter(status="active")
        serializer = BusSerializer(buses, many=True)
        return Response(serializer.data)
    
class AvailableBusesView(generics.ListAPIView):
    queryset = Bus.objects.filter(status='active')
    serializer_class = BusSerializer
    permission_classes = [permissions.IsAuthenticated]


class BusAvailableViewSet(viewsets.ViewSet):
    def list(self, request):
        buses = Bus.objects.filter(status='active')
        data = []
        
        for bus in buses:
            today_journeys = Journey.objects.filter(
                bus=bus,
                scheduled_departure__date=timezone.now().date()
            )
            
            bus_data = {
                'id': bus.id,
                'bus_number': bus.bus_number,
                'license_plate': bus.license_plate,
                'capacity': bus.capacity,
                'status': bus.status,
                'journeys': []
            }
            
            for journey in today_journeys:
                booked = Booking.objects.filter(
                    journey=journey,
                    status='confirmed'
                ).aggregate(total=Sum('seats_booked'))['total'] or 0
                
                available = journey.available_seats - booked
                
                bus_data['journeys'].append({
                    'id': journey.id,
                    'route_name': journey.route.name,
                    'fare': float(journey.fare),
                    'available_seats': available,
                    'booked_seats': booked,
                    'total_capacity': bus.capacity,
                    'scheduled_departure': journey.scheduled_departure.isoformat(),
                })
            
            if bus_data['journeys']:
                data.append(bus_data)
        
        return Response(data)
    
from rest_framework.decorators import api_view

@api_view(['PATCH'])
def update_bus_status(request, pk):
    try:
        bus = Bus.objects.get(pk=pk)
    except Bus.DoesNotExist:
        return Response({'error': 'Bus not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in ["active", "inactive", "under_maintenance"]:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    bus.status = new_status
    bus.save()
    return Response({'message': f'Bus {bus.bus_number} status updated to {new_status}'}, status=status.HTTP_200_OK)
