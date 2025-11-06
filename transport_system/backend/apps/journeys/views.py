from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
from .models import Journey, Booking
from .serializers import JourneySerializer, BookingSerializer
from apps.buses.models import Bus
import uuid
from .models import FareSession
from rest_framework.decorators import api_view, permission_classes
from apps.routes.models import Route, BusRouteAssignment, Stop
from django.db import IntegrityError
from apps.routes.models import Stop
from django.db.models import Sum
from rest_framework.authentication import TokenAuthentication
from apps.payments.models import Transaction
from django.db import transaction

class JourneyViewSet(viewsets.ModelViewSet):
    queryset = Journey.objects.all()
    serializer_class = JourneySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    @action(detail=True, methods=['post'])
    def book(self, request, pk=None):
        try:
            journey = self.get_object()
            user = request.user
            seats = int(request.data.get("seats", 1))
            pickup = request.data.get("pickup_stop")
            dropoff = request.data.get("dropoff_stop")

            from apps.routes.models import Stop  # ensure imported here or globally

            # --- Helper: resolve stop name from ID, name, or placeholder ---
            def resolve_stop(value):
                if not value:
                    return None
                if isinstance(value, str) and value.lower().startswith("kampala_"):
                    return "Kampala Central"
                try:
                    if str(value).isdigit():
                        stop = Stop.objects.filter(id=int(value)).first()
                        if stop:
                            return stop.name
                except Exception:
                    pass
                stop = Stop.objects.filter(name__iexact=str(value).replace("_", " ")).first()
                if stop:
                    return stop.name
                return str(value)

            pickup_stop_name = resolve_stop(pickup)
            dropoff_stop_name = resolve_stop(dropoff)

            # --- Compute fares ---
            base_fare = getattr(journey.route, "base_fare", 0)
            actual_fare_per_seat = request.data.get("actual_fare_per_seat")
            if actual_fare_per_seat is not None:
                actual_fare_per_seat = float(actual_fare_per_seat)
            else:
                pickup_obj = Stop.objects.filter(name__iexact=pickup_stop_name).first()
                dropoff_obj = Stop.objects.filter(name__iexact=dropoff_stop_name).first()
                if pickup_obj and dropoff_obj and hasattr(pickup_obj, "fare") and hasattr(dropoff_obj, "fare"):
                    actual_fare_per_seat = abs(dropoff_obj.fare - pickup_obj.fare)
            if actual_fare_per_seat is None:
                actual_fare_per_seat = float(journey.fare or base_fare or 0)

            total_fare = actual_fare_per_seat * seats

            # --- Compute available seats ---
            bus_capacity = journey.bus.capacity  # ✅ fetch from bus
            total_booked = (
                Booking.objects.filter(journey=journey, status="confirmed")
                .aggregate(total=Sum("seats_booked"))
                .get("total") or 0
            )
            remaining_seats = max(bus_capacity - total_booked - seats, 0)  # ✅ remaining seats after booking

            user = request.user

            # Ensure only passengers can book
            if hasattr(user, 'role') and user.role != 'passenger':
             return Response({"error": "Only passengers can book"}, status=403)

            # --- Create booking ---
            booking = Booking.objects.create(
                user=user,
                journey=journey,
                seats_booked=seats,
                pickup_stop=pickup_stop_name,
                dropoff_stop=dropoff_stop_name,
                base_fare=base_fare,
                total_fare=total_fare,
                available_seats=remaining_seats,  # ✅ save remaining seats
                status="confirmed",
                booking_reference=request.data.get("booking_reference") or "",
            )

            serializer = BookingSerializer(booking)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except IntegrityError:
            return Response({"detail": "Booking conflict"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Booking error:", e)
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # 🧩 Custom endpoint for driver seat summary
    @action(detail=False, methods=["get"], url_path="seat-summary")
    def seat_summary(self, request):
        user = request.user

        # ✅ Only drivers can access their bus seat summary
        if not hasattr(user, "role") or user.role != "driver":
            return Response({"detail": "Not authorized"}, status=403)

        # Get the bus assigned to this driver
        bus = getattr(user, "bus", None)
        if not bus:
            return Response({"detail": "No bus assigned to this driver"}, status=404)

        # Get total seats for that bus
        total_seats = getattr(bus, "total_seats", 0)

        # Count booked seats from all confirmed bookings for journeys of this bus
        booked = (
            Booking.objects.filter(journey__bus=bus, status="confirmed")
            .aggregate(total=Sum("seats_booked"))
            .get("total") or 0
        )

        remaining = max(total_seats - booked, 0)

        return Response({
            "bus_number": bus.bus_number,
            "total_seats": total_seats,
            "booked_seats": booked,
            "remaining_seats": remaining,
        })
    
    @action(detail=False, methods=["get"], url_path="driver-bus-summary")
    def driver_bus_summary(self, request):
        user = request.user
        driver_buses = Bus.objects.filter(driver=user)  # get buses assigned to this driver

        summary = []

        for bus in driver_buses:
            # all journeys of this bus
            bus_journeys = Journey.objects.filter(bus=bus, status="scheduled")  # or whichever status
            for journey in bus_journeys:
                total_booked = (
                    Booking.objects.filter(journey=journey, status="confirmed")
                    .aggregate(total=Sum("seats_booked"))
                    .get("total") or 0
                )
                remaining_seats = max(bus.capacity - total_booked, 0)
                
                summary.append({
                    "journey_id": journey.id,
                    "route_name": journey.route.name if journey.route else str(journey),
                    "bus_number": bus.bus_number,
                    "total_capacity": bus.capacity,
                    "booked_seats": total_booked,
                    "available_seats": remaining_seats,
                    "scheduled_departure": journey.scheduled_departure,
                    "scheduled_arrival": journey.scheduled_arrival,
                })

        return Response(summary)
    

    @action(detail=True, methods=['post'])
    def tap_in(self, request, pk=None):
        try:
            journey = self.get_object()
            user = request.user
            # Only confirmed bookings
            booking = Booking.objects.filter(user=user, journey=journey, status="confirmed").first()
            if not booking:
                return Response({"detail": "No active booking found."}, status=404)

            booking.tapped_in = True
            # Ensure status stays confirmed
            booking.status = "confirmed"
            booking.save()

            return Response({"message": "Tapped in successfully", "tapped_in": True})
        except Exception as e:
            print("Tap In Error:", e)
            return Response({"detail": str(e)}, status=500)



    import uuid  # Add this at the top of your file
    from django.db import transaction
    from django.utils import timezone

    @action(detail=True, methods=['post'])
    def tap_out(self, request, pk=None):
        try:
            journey = self.get_object()
            user = request.user

            # 🔍 Debug: Check all bookings for this user and journey
            all_bookings = Booking.objects.filter(user=user, journey=journey)
            print(f"=== DEBUG: All bookings for user {user.username} on journey {journey.id} ===")
            for b in all_bookings:
                print(f"Booking {b.id}: status={b.status}, tapped_in={b.tapped_in}")


            booking = Booking.objects.filter(
                user=user, journey=journey, status="confirmed", tapped_in=True
            ).first()

            if not booking:
                return Response(
                    {"detail": "No active tapped-in booking found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            total_fare = booking.total_fare

            # Add safety checks
            try:
                passenger_wallet = user.wallet
                driver_wallet = journey.bus.driver.wallet
            except AttributeError as e:
                return Response(
                    {"detail": "Wallet configuration error. Please contact support."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # ---------- Atomic Transaction ----------
            with transaction.atomic():
                # Refresh from DB to avoid race conditions
                passenger_wallet.refresh_from_db()
                driver_wallet.refresh_from_db()

                if passenger_wallet.balance < total_fare:
                    return Response(
                        {
                            "detail": "Insufficient balance in passenger wallet",
                            "required": float(total_fare),
                            "current_balance": float(passenger_wallet.balance)
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Deduct from passenger
                passenger_wallet.balance -= total_fare
                passenger_wallet.save()

                # Add to driver
                driver_wallet.balance += total_fare
                driver_wallet.save()

                # Log transaction for passenger (deduction)
                Transaction.objects.create(
                    user=user,
                    transaction_type="fare_payment",
                    amount=total_fare,
                    status="completed",
                    reference_id=f"FARE-{uuid.uuid4().hex[:12].upper()}",
                    description=f"Fare paid for journey {journey.id}",
                    completed_at=timezone.now()
                )

                # Log transaction for driver (receipt)
                Transaction.objects.create(
                    user=journey.bus.driver,
                    transaction_type="fare_payment",
                    amount=total_fare,
                    status="completed",
                    reference_id=f"RECV-{uuid.uuid4().hex[:12].upper()}",
                    description=f"Fare received from {user.username} for journey {journey.id}",
                    completed_at=timezone.now()
                )

                # Mark booking as completed
                booking.tapped_in = False
                booking.status = "completed"
                booking.save()

            return Response({
                "message": "Tapped out successfully, fare deducted",
                "tapped_in": False,
                "fare_charged": float(total_fare),
                "new_balance": float(passenger_wallet.balance)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("Tap Out Error:", e)
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def driver_status(self, request, pk=None):
        journey = self.get_object()
        tapped_in_count = Booking.objects.filter(journey=journey, tapped_in=True).count()
        total_booked = Booking.objects.filter(journey=journey, status="confirmed").count()
        return Response({
            "journey_id": journey.id,
            "tapped_in_count": tapped_in_count,
            "total_booked": total_booked,
            "occupancy_percent": (tapped_in_count / total_booked * 100) if total_booked else 0
        })
    
    @action(detail=True, methods=['get'])
    def ratings(self, request, pk=None):
        """Get all ratings for a journey"""
        journey = self.get_object()
    
        # Replace 'Rating' with your actual model name
        from .models import Rating  # or JourneyRating or whatever your model is called
    
        ratings = Rating.objects.filter(journey=journey).select_related('user')
    
        ratings_data = [{
            'id': r.id,
            'rating': r.rating,
            'driver_rating': getattr(r, 'driver_rating', r.rating),  # adjust based on your model
            'bus_rating': getattr(r, 'bus_rating', r.rating),
            'service_rating': getattr(r, 'service_rating', r.rating),
            'overall_rating': getattr(r, 'overall_rating', r.rating),
            'comment': r.comment,
            'user_name': r.user.get_full_name() or r.user.username,
            'created_at': r.created_at.isoformat()
        } for r in ratings]
    
        return Response(ratings_data)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer

    def get_queryset(self):
        return (
            Booking.objects.filter(user=self.request.user)
            .select_related("journey__bus", "journey__route")  # ✅ important
            .order_by("-created_at")
        )


    def get_queryset(self):
        # Only show bookings for the logged-in user
        return (
            Booking.objects.filter(user=self.request.user)
            .select_related("journey__bus", "journey__route")  # ✅ important
            .order_by("-created_at")
        )
    
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