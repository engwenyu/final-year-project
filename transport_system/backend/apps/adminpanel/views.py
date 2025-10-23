from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.shortcuts import get_object_or_404
from apps.buses.models import Bus
from apps.journeys.models import Journey
from apps.authentication.models import CustomUser as User
from apps.payments.models import Wallet, Transaction
import uuid
from django.utils import timezone


# ========================= BUSES =========================
class AdminBusesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        buses = Bus.objects.all().values(
            "id", "bus_number", "license_plate", "capacity", "status", "driver_id"
        )
        return Response(list(buses))

    def post(self, request):
        data = request.data
        bus = Bus.objects.create(
            bus_number=data.get("bus_number"),
            license_plate=data.get("license_plate"),
            capacity=data.get("capacity"),
            status=data.get("status", "active"),
        )
        return Response({"id": bus.id, "message": "Bus created"}, status=status.HTTP_201_CREATED)

    def put(self, request):
        bus_id = request.data.get("id")
        bus = get_object_or_404(Bus, id=bus_id)

        bus.bus_number = request.data.get("bus_number", bus.bus_number)
        bus.license_plate = request.data.get("license_plate", bus.license_plate)
        bus.capacity = request.data.get("capacity", bus.capacity)
        bus.status = request.data.get("status", bus.status)
        bus.save()

        return Response({"message": "Bus updated"}, status=status.HTTP_200_OK)

    def delete(self, request):
        bus_id = request.data.get("id")
        bus = get_object_or_404(Bus, id=bus_id)
        bus.delete()
        return Response({"message": "Bus deleted"}, status=status.HTTP_200_OK)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from apps.authentication.models import CustomUser as User

class AssignDriverToBusView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        bus_id = request.data.get("bus_id")
        driver_id = request.data.get("driver_id")

        bus = get_object_or_404(Bus, id=bus_id)
        driver = get_object_or_404(User, id=driver_id, user_type="driver")

        # Prevent assigning if bus already has a driver
        if bus.driver:
            return Response(
                {"error": f"Bus {bus.bus_number} is already assigned to {bus.driver.first_name}."},
                status=400
            )

        bus.driver = driver
        bus.save()

        return Response(
            {"message": f"Driver {driver.first_name} assigned to Bus {bus.bus_number}"}
        )


class UnassignDriverView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        bus_id = request.data.get("bus_id")
        bus = get_object_or_404(Bus, id=bus_id)

        if not bus.driver:
            return Response(
                {"error": f"Bus {bus.bus_number} has no driver assigned."},
                status=400
            )

        old_driver = bus.driver
        bus.driver = None
        bus.save()

        return Response(
            {"message": f"Driver {old_driver.first_name} unassigned from Bus {bus.bus_number}"}
        )



# ========================= DRIVERS =========================
class AdminDriversView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        drivers = User.objects.filter(user_type="driver").values(
            "id", "first_name", "last_name", "email", "phone_number"
        )
        return Response(list(drivers))

    def delete(self, request):
        driver_id = request.data.get("id")
        driver = get_object_or_404(User, id=driver_id, user_type="driver")
        driver.delete()
        return Response({"message": "Driver deleted"}, status=status.HTTP_200_OK)


# ========================= PASSENGERS =========================
class AdminPassengersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        passengers = User.objects.filter(user_type="passenger")
        data = []
        for p in passengers:
            wallet, _ = Wallet.objects.get_or_create(user=p)
            data.append(
                {
                    "id": p.id,
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "email": p.email,
                    "phone_number": p.phone_number,
                    "wallet_balance": wallet.balance,
                }
            )
        return Response(data)

    def post(self, request):
        data = request.data
        passenger = User.objects.create_user(
            username=data.get("username"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            email=data.get("email"),
            password=data.get("password"),
            user_type="passenger",
            phone_number=data.get("phone_number"),
        )
        # Optional: create wallet
        Wallet.objects.create(user=passenger, balance=0)
        return Response({"id": passenger.id, "message": "Passenger created"}, status=status.HTTP_201_CREATED)


# ========================= JOURNEYS =========================
class AdminJourneysView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        journeys = Journey.objects.all().values(
            "id", "route__name", "bus__bus_number", "scheduled_departure", "status"
        )
        return Response(list(journeys))

    def post(self, request):
        data = request.data
        bus = get_object_or_404(Bus, id=data.get("bus_id"))

        journey = Journey.objects.create(
            bus=bus,
            route_id=data.get("route_id"),
            scheduled_departure=data.get("scheduled_departure"),
            status=data.get("status", "scheduled"),
        )
        return Response(
            {"id": journey.id, "message": "Journey created"},
            status=status.HTTP_201_CREATED,
        )

    def put(self, request):
        journey_id = request.data.get("id")
        journey = get_object_or_404(Journey, id=journey_id)

        if "bus_id" in request.data:
            journey.bus = get_object_or_404(Bus, id=request.data.get("bus_id"))

        if "route_id" in request.data:
            journey.route_id = request.data.get("route_id")

        journey.scheduled_departure = request.data.get(
            "scheduled_departure", journey.scheduled_departure
        )
        journey.status = request.data.get("status", journey.status)
        journey.save()

        return Response({"message": "Journey updated"}, status=status.HTTP_200_OK)

    def delete(self, request):
        journey_id = request.data.get("id")
        journey = get_object_or_404(Journey, id=journey_id)
        journey.delete()
        return Response({"message": "Journey deleted"}, status=status.HTTP_200_OK)


# ========================= ANALYTICS =========================
class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = {
            "totalBuses": Bus.objects.count(),
            "totalDrivers": User.objects.filter(user_type="driver").count(),
            "totalPassengers": User.objects.filter(user_type="passenger").count(),
            "totalJourneys": Journey.objects.count(),
        }
        return Response(data)


# ========================= WALLET TOP-UP =========================
class AdminWalletTopupView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        passenger_id = request.data.get("passenger_id")
        amount = request.data.get("amount")

        if not passenger_id or not amount:
            return Response(
                {"error": "Passenger ID and amount required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        passenger = get_object_or_404(User, id=passenger_id, user_type="passenger")
        wallet, _ = Wallet.objects.get_or_create(user=passenger)
        wallet.balance += amount
        wallet.save()

        Transaction.objects.create(
            user=passenger,
            transaction_type="wallet_topup",
            amount=amount,
            status="completed",
            reference_id=f"TOPUP{uuid.uuid4().hex[:8].upper()}",
            description=f"Admin top-up of UGX {amount}",
            completed_at=timezone.now(),
        )

        return Response({"new_balance": wallet.balance}, status=status.HTTP_200_OK)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.buses.models import Bus
from apps.journeys.models import Journey
from apps.authentication.models import CustomUser  # <- import your user model

@api_view(['GET'])
def admin_overview_counts(request):
    """
    Returns counts of main entities for the admin dashboard
    """
    data = {
        "buses_count": Bus.objects.count(),
        "journeys_count": Journey.objects.count(),
        "drivers_count": CustomUser.objects.filter(user_type='driver').count(),  # lowercase
        "passengers_count": CustomUser.objects.filter(user_type='passenger').count(),  # lowercase
    }
    return Response(data)
