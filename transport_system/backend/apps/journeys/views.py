from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from .models import Journey, Booking, NFCTransaction
from .serializers import JourneySerializer, BookingSerializer, NFCTransactionSerializer
from apps.payments.models import Transaction, Wallet
from apps.buses.models import Bus
import uuid
from rest_framework.decorators import api_view, permission_classes
from apps.routes.models import Route, BusRouteAssignment, Stop


class JourneyViewSet(viewsets.ModelViewSet):
    queryset = Journey.objects.all()
    serializer_class = JourneySerializer
    permission_classes = [IsAuthenticated]
    
    # Inside your JourneyViewSet book() method
    @action(detail=True, methods=['post'])
    def book(self, request, pk=None):
        journey = self.get_object()
        seats = int(request.data.get('seats', 1))

        if journey.available_seats < seats:
            return Response({'error': 'Not enough seats available'}, status=status.HTTP_400_BAD_REQUEST)

        total_fare = journey.fare * seats

        # Try multiple times to create a unique booking reference
        for _ in range(5):
            booking_reference = f"BK{uuid.uuid4().hex[:8].upper()}"
            try:
                booking = Booking.objects.create(
                    user=request.user,
                    journey=journey,
                    seats_booked=seats,
                    booking_reference=booking_reference,
                    total_fare=total_fare,
                    status="confirmed"
                )

                # Reduce available seats
                journey.available_seats -= seats
                journey.save()

                return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

            except IntegrityError:
                # Try again if booking reference duplicated
                continue

        return Response({"error": "Failed to generate unique booking reference"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer

    def get_queryset(self):
        # Only show bookings belonging to the logged-in user
        return Booking.objects.filter(user=self.request.user)
    
    # DELETE /journeys/<id>/
    def destroy(self, request, *args, **kwargs):
        journey = self.get_object()
        journey.delete()
        return Response({"detail": "Journey deleted successfully"})

    def perform_create(self, serializer):
        user = self.request.user
        route_id = self.request.data.get('route_id')
        bus_id = self.request.data.get('bus_id')
        stop_id = self.request.data.get('stop_id')

        # ✅ Validate route and bus assignment
        try:
            route = Route.objects.get(id=route_id)
        except Route.DoesNotExist:
            return Response({"error": "Selected route does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bus_assignment = BusRouteAssignment.objects.get(bus_id=bus_id, route=route)
        except BusRouteAssignment.DoesNotExist:
            return Response({"error": "This bus is not assigned to the selected route"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Fetch the correct fare (for incity route)
        fare = 0
        if stop_id:
            try:
                stop = Stop.objects.get(id=stop_id, route=route)
                fare = stop.fare
            except Stop.DoesNotExist:
                return Response({"error": "Invalid stop selected"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # For outercity routes, you can store a base fare in the Route model
            fare = getattr(route, "base_fare", 0)

        # ✅ Create the booking
        booking = serializer.save(
            user=user,
            route=route,
            bus=bus_assignment.bus,
            fare=fare,
        )

        # ✅ Optional: deduct fare from wallet (if wallet integration exists)
        if hasattr(user, "wallet"):
            wallet = user.wallet
            if wallet.balance >= fare:
                wallet.balance -= fare
                wallet.save()
            else:
                return Response({"error": "Insufficient wallet balance"}, status=status.HTTP_400_BAD_REQUEST)

        return booking

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = "cancelled"
        booking.save()
        # Restore seats
        booking.journey.available_seats += booking.seats_booked
        booking.journey.save()
        return Response({"message": "Booking cancelled successfully"}, status=status.HTTP_200_OK)


class NFCTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NFCTransaction.objects.all()
    serializer_class = NFCTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type == 'driver':
            # Driver sees all transactions for their bus
            return NFCTransaction.objects.filter(bus__driver=self.request.user)
        else:
            # Passengers see only their transactions
            return NFCTransaction.objects.filter(user=self.request.user)


class ActiveJourneysView(generics.ListAPIView):
    serializer_class = JourneySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Journey.objects.filter(status__in=['scheduled','active']).order_by('scheduled_departure', 'id')


class DriverJourneysView(generics.ListAPIView):
    serializer_class = JourneySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type != 'driver':
            return Journey.objects.none()

        # ✅ Get all buses assigned to this driver
        driver_buses = Bus.objects.filter(driver=user)

        # ✅ Fetch all journeys assigned to those buses
        return (
            Journey.objects.filter(bus__in=driver_buses)
            .select_related("bus", "route")
            .order_by("-scheduled_departure")
        )


class NFCCheckInView(generics.CreateAPIView):
    serializer_class = NFCTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        nfc_card_id = request.data.get('nfc_card_id')
        bus_id = request.data.get('bus_id')
        transaction_type = request.data.get('transaction_type', 'tap_in')
        
        # Get user by NFC card
        try:
            user = request.user.__class__.objects.get(nfc_card_id=nfc_card_id)
        except request.user.__class__.DoesNotExist:
            return Response(
                {'error': 'Invalid NFC card'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get bus
        bus = get_object_or_404(Bus, id=bus_id)
        
        # Get active journey for this bus
        journey = Journey.objects.filter(
            bus=bus, 
            status='active',
            scheduled_departure__date=timezone.now().date()
        ).first()
        
        if not journey:
            return Response(
                {'error': 'No active journey for this bus'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create NFC transaction
        nfc_transaction = NFCTransaction.objects.create(
            user=user,
            journey=journey,
            bus=bus,
            nfc_card_id=nfc_card_id,
            transaction_type=transaction_type,
            stop_name=request.data.get('stop_name'),
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude')
        )
        
        # ✅ Deduct fare only on tap_out
        if transaction_type == 'tap_out':
            wallet = get_object_or_404(Wallet, user=user)
            fare = journey.fare
            
            if wallet.balance < fare:
                return Response(
                    {'error': 'Insufficient wallet balance'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create payment transaction
            payment_transaction = Transaction.objects.create(
                user=user,
                transaction_type='fare_payment',
                amount=fare,
                status='completed',
                reference_id=f"PAY{uuid.uuid4().hex[:8].upper()}",
                description=f"Fare payment for journey {journey.id}",
                completed_at=timezone.now()
            )
            
            # Deduct from wallet
            wallet.balance -= fare
            wallet.save()
            
            # Link payment to NFC transaction
            nfc_transaction.fare_charged = fare
            nfc_transaction.payment_transaction = payment_transaction
            nfc_transaction.save()
            
            # 🔑 New: Tell frontend to show rating popup
            return Response({
                "message": f"💳 UGX {fare} deducted from wallet",
                "new_balance": wallet.balance,
                "transaction": NFCTransactionSerializer(nfc_transaction).data,
                "show_rating": True  # 👈 frontend should check this
            }, status=status.HTTP_201_CREATED)
        
        # For tap_in, just return the transaction
        return Response(NFCTransactionSerializer(nfc_transaction).data, 
                       status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def book_bus(request, journey_id):
    user = request.user
    seats_requested = int(request.data.get("seats", 1))

    try:
        journey = Journey.objects.get(id=journey_id)
    except Journey.DoesNotExist:
        return Response({"error": "Journey not found."}, status=status.HTTP_404_NOT_FOUND)

    if journey.available_seats < seats_requested:
        return Response({"error": "Not enough seats available."}, status=status.HTTP_400_BAD_REQUEST)

    # Create booking
    booking = Booking.objects.create(
        user=user,
        journey=journey,
        seats_booked=seats_requested,
        total_fare=journey.fare * seats_requested,
        status="confirmed",
    )

    # Reduce available seats
    journey.available_seats -= seats_requested
    journey.save()

    return Response(
        {"message": "Booking successful!", "booking_id": booking.id},
        status=status.HTTP_201_CREATED
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request):
    user = request.user
    booking_id = request.data.get("booking_id")

    if not booking_id:
        return Response({"error": "Booking ID required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        booking = Booking.objects.get(id=booking_id, user=user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

    if booking.status != "confirmed":
        return Response({"error": "This booking cannot be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

    # Restore available seats
    journey = booking.journey
    journey.available_seats += booking.seats_booked
    journey.save()

    booking.status = "cancelled"
    booking.save()

    return Response({"message": "Booking cancelled successfully."})

from rest_framework import generics, permissions
from .models import Journey
from .serializers import PassengerJourneySerializer

class PassengerAvailableBusesView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PassengerJourneySerializer

    def get_queryset(self):
        return Journey.objects.filter(status__in=["active", "scheduled"]).select_related("bus", "route")


from rest_framework.views import APIView

from django.utils import timezone

class CompleteJourneyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, journey_id):
        user = request.user

        try:
            journey = Journey.objects.get(id=journey_id)
        except Journey.DoesNotExist:
            return Response({"error": "Journey not found"}, status=404)

        if journey.bus.driver != user:
            return Response({"error": "Not authorized"}, status=403)

        # 🔒 Safeguard: cannot complete before scheduled departure
        now = timezone.now()
        if journey.scheduled_departure > now:
            return Response(
                {"error": "Cannot complete journey before its scheduled departure."},
                status=400
            )

        journey.status = "completed"
        journey.save()

        return Response({"success": True, "journey_id": journey.id})


class CancelJourneyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, journey_id):
        user = request.user
        reason = request.data.get("reason", "").strip()

        if not reason:
            return Response({"error": "Cancellation reason is required"}, status=400)

        try:
            journey = Journey.objects.get(id=journey_id)
        except Journey.DoesNotExist:
            return Response({"error": "Journey not found"}, status=404)

        # Only the driver assigned to the bus can cancel it
        if journey.bus.driver != user:
            return Response({"error": "Not authorized"}, status=403)

        journey.status = "cancelled"
        journey.cancellation_reason = reason  # make sure Journey model has this field
        journey.save()

        return Response({"success": True, "journey_id": journey.id})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_journey(request, journey_id):
    journey = get_object_or_404(Journey, id=journey_id)
    
    reason = request.data.get("cancellation_reason")
    if not reason:
        return Response({"detail": "Cancellation reason is required."}, status=400)
    
    journey.status = "cancelled"
    journey.cancellation_reason = reason
    journey.save()
    
    return Response({"detail": "Journey cancelled successfully."})

@api_view(['GET'])
def get_journeys_by_route(request, route_id):
    journeys = Journey.objects.filter(route_id=route_id, status='scheduled')
    data = [
        {
            'id': j.id,
            'bus': str(j.bus),
            'departure_time': j.scheduled_departure,
            'arrival_time': j.scheduled_arrival,
        }
        for j in journeys
    ]
    return Response(data)


#@api_view(["GET"])
#@permission_classes([IsAuthenticated])
#def available_journeys(request):
 #   """
  #  Returns available (scheduled) journeys.
   # Optional query param: ?route_id=<id>
    #"""
    #route_id = request.GET.get("route_id")

    # Base query: only scheduled journeys
    #journeys = Journey.objects.filter(status="scheduled")

    # ✅ Filter by route if provided
    #if route_id:
     #   journeys = journeys.filter(route_id=route_id)

    #serializer = JourneySerializer(journeys, many=True)
    #return Response(serializer.data)


#@api_view(['GET'])
#@permission_classes([IsAuthenticated])
#def available_journeys(request):
  #  route_id = request.GET.get('route_id')
   # pickup = request.GET.get('pickup')
    #dropoff = request.GET.get('dropoff')
    
    #if not all([route_id, pickup, dropoff]):
     #   return Response({'error': 'Missing parameters'}, status=400)
    
    # Get journeys for this route that are scheduled or active
    #journeys = Journey.objects.filter(
     #   route_id=route_id,
      #  status__in=['scheduled', 'active'],
       # scheduled_departure__gte=timezone.now()
    #).select_related('bus', 'route').order_by('scheduled_departure')
    
    #data = []
    #for journey in journeys:
     #   data.append({
      #      'id': journey.id,
       #     'bus_number': journey.bus.bus_number,
        #    'bus_license_plate': journey.bus.license_plate,
         #   'scheduled_departure': journey.scheduled_departure.isoformat(),
          #  'scheduled_arrival': journey.scheduled_arrival.isoformat(),
           # 'fare': float(journey.fare),
            #'available_seats': journey.available_seats,
            #'status': journey.status,
        #})
    
    #return Response(data)

from django.db import models

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_journeys(request):
    route_id = request.GET.get('route_id')
    pickup = request.GET.get('pickup')
    dropoff = request.GET.get('dropoff')
    
    if not all([route_id, pickup, dropoff]):
        return Response({'error': 'Missing parameters'}, status=400)
    
    # ✅ Get journeys for THIS SPECIFIC ROUTE with assigned buses
    journeys = Journey.objects.filter(
        route_id=route_id,  # Only this route
        bus__isnull=False,  # Bus must be assigned
        bus__driver__isnull=False,  # Driver must be assigned to bus
        bus__status='active',  # Bus must be active
        status__in=['scheduled', 'active'],
        scheduled_departure__gte=timezone.now()
    ).select_related('bus', 'route', 'bus__driver').order_by('scheduled_departure')
    
    if not journeys.exists():
        return Response({
            'message': 'No buses currently assigned to this route',
            'results': []
        })
    
    data = []
    for journey in journeys:
        # Calculate actually booked seats
        from .models import Booking
        booked = Booking.objects.filter(
            journey=journey,
            status='confirmed'
        ).aggregate(total=models.Sum('seats_booked'))['total'] or 0
        
        available = journey.available_seats - booked
        
        data.append({
            'id': journey.id,
            'route_name': journey.route.name,
            'bus_number': journey.bus.bus_number,
            'bus_license_plate': journey.bus.license_plate,
            'driver_name': journey.bus.driver.get_full_name() if journey.bus.driver else 'No driver',
            'scheduled_departure': journey.scheduled_departure.isoformat(),
            'scheduled_arrival': journey.scheduled_arrival.isoformat(),
            'fare': float(journey.fare),
            'available_seats': available,
            'total_capacity': journey.bus.capacity,
            'booked_seats': booked,
            'status': journey.status,
        })
    
    return Response(data)