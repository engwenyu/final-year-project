from django.contrib import admin
from .models import Journey,  Booking

@admin.register(Journey)
class JourneyAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'route',
        'bus',
        'scheduled_departure',
        'scheduled_arrival',
        'status',
        'fare',
        'available_seats',
        'created_at',
        'cancellation_reason',
        
    )
    list_filter = ('status','route', 'scheduled_departure', 'scheduled_arrival', 'created_at')
    autocomplete_fields = ['bus', 'route']
    
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "booking_reference",
        "user",
        "journey",
        "seats_booked",
        "available_seats",  # ✅ now stored
        "total_fare",
        "status",
        "pickup_stop",
        "dropoff_stop",
        "created_at",
        "tapped_in"
    )
    list_filter = ('status', 'created_at','tapped_in')
    search_fields = ('booking_reference', 'user__username', 'journey__id')
    ordering = ('-created_at',)
