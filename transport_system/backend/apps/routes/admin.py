from django.contrib import admin
from .models import Route, Stop

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'route_type', 'start_location', 'end_location', 'base_fare', 'is_active']
    list_filter = ['route_type', 'is_active']  # remove 'created_at'
    search_fields = ['name', 'start_location', 'end_location']
    ordering = ['name']  # remove 'created_at'

@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ['route', 'order', 'name', 'fare']  # remove distance, lat, lon
    list_filter = ['route']
    search_fields = ['name', 'route__name']
    ordering = ['route', 'order']