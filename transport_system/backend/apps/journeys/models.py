from django.db import models
from django.contrib.auth import get_user_model
from apps.buses.models import Bus
from apps.routes.models import Route
from apps.payments.models import Transaction
from django.conf import settings
from apps.authentication.models import CustomUser

User = get_user_model()

class Journey(models.Model):
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name="journeys")
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="journeys")
    scheduled_departure = models.DateTimeField()
    scheduled_arrival = models.DateTimeField()
    status = models.CharField(max_length=20, choices=[
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ])
    fare = models.DecimalField(max_digits=10, decimal_places=2)
    available_seats = models.PositiveIntegerField()
    total_seats = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)  # ✅ needed for admin
    cancellation_reason = models.TextField(blank=True, null=True)  # ✅ new field
    
    def __str__(self):
        return f"{self.bus.bus_number} - {self.route.name}"

class NFCTransaction(models.Model):
    TRANSACTION_TYPE = [
        ('tap_in', 'Tap In'),
        ('tap_out', 'Tap Out'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE)
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE)
    nfc_card_id = models.CharField(max_length=50)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE)
    stop_name = models.CharField(max_length=100, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    fare_charged = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    payment_transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.user.username} on Journey {self.journey.id}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE)
    seats_booked = models.PositiveIntegerField(default=1)
    #booking_reference = models.CharField(max_length=20, unique=True)
    booking_reference = models.CharField(max_length=20)
    total_fare = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    pickup_stop = models.CharField(max_length=100, blank=True, null=True)
    dropoff_stop = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)  # ✅ needed for admin

    def __str__(self):
        return f"{self.booking_reference} - {self.user.username}"