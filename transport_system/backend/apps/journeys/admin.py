from django.contrib import admin
from .models import Journey, NFCTransaction, Booking

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
        'cancellation_reason'
    )
    list_filter = ('status', 'scheduled_departure', 'scheduled_arrival', 'created_at')
    list_filter = ('status', 'route')
    autocomplete_fields = ['bus', 'route']
    
@admin.register(NFCTransaction)
class NFCTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'journey',
        'bus',
        'nfc_card_id',
        'transaction_type',
        'stop_name',
        'fare_charged',
        'timestamp',
    )
    list_filter = ('transaction_type', 'timestamp')
    search_fields = ('user__username', 'nfc_card_id', 'journey__id')
    ordering = ('-timestamp',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'booking_reference',
        'user',
        'journey',
        'seats_booked',
        'total_fare',
        'status',
        'pickup_stop',
        'dropoff_stop',
        'created_at',
    )
    list_filter = ('status', 'created_at')
    search_fields = ('booking_reference', 'user__username', 'journey__id')
    ordering = ('-created_at',)
