from django.contrib import admin
from .models import Rating

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'journey',
        'driver_rating',
        'bus_rating',
        'service_rating',
        'overall_rating',
        'created_at',
    )
    list_filter = ('driver_rating', 'bus_rating', 'service_rating', 'overall_rating', 'created_at')
    search_fields = ('user__username', 'journey__id', 'comment')
    ordering = ('-created_at',)
