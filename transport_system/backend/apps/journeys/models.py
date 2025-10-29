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
    tapped_in_count = models.PositiveIntegerField(default=0)
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.bus.bus_number} - {self.route.name}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE)
    seats_booked = models.PositiveIntegerField(default=1)
    booking_reference = models.CharField(max_length=20)
    base_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_fare = models.DecimalField(max_digits=10, decimal_places=2)
    available_seats = models.PositiveIntegerField(default=0)  # ✅ New field
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    pickup_stop = models.CharField(max_length=100, blank=True, null=True)
    dropoff_stop = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tapped_in = models.BooleanField(default=False)  # ✅ NEW FIELD

    # NEW: NFC Tap Simulation fields
    tap_in_stop = models.CharField(max_length=100, blank=True, null=True)
    tap_out_stop = models.CharField(max_length=100, blank=True, null=True)
    tap_in_time = models.DateTimeField(blank=True, null=True)
    tap_out_time = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking_reference} - {self.user.username}"

class FareSession(models.Model):
    passenger = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE)
    tap_in_stop = models.CharField(max_length=100, blank=True, null=True)
    tap_out_stop = models.CharField(max_length=100, blank=True, null=True)
    fare_charged = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)  # True after Tap In, False after Tap Out
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.passenger.username} - {self.journey.bus.bus_number} - {'Active' if self.is_active else 'Completed'}"
