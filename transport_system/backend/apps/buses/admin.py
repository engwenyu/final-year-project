from django.contrib import admin
from .models import Bus

@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'bus_number',
        'license_plate',
        'capacity',
        'driver',
        'status',
        'nfc_reader_id',
        'current_latitude',
        'current_longitude',
        'last_location_update',
        'created_at',
    )
    list_filter = ('status', 'created_at')
    search_fields = ('bus_number', 'license_plate', 'nfc_reader_id')
    ordering = ('id',)
