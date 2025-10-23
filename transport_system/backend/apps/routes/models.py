from django.db import models
from apps.buses.models import Bus

# routes/models.py

from django.db import models

class Route(models.Model):
    ROUTE_TYPES = [
        #("incity", "In-city"),
        #("outercity", "Outer-city"),
        ('intercity', 'Intercity'),
        ('outercity', 'Outer City'),
    ]
    
    name = models.CharField(max_length=100)
    route_type = models.CharField(max_length=20, choices=ROUTE_TYPES)
    start_location = models.CharField(max_length=100)
    end_location = models.CharField(max_length=100)
    base_fare = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Stop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="stops")
    name = models.CharField(max_length=100)
    fare = models.PositiveIntegerField()
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.route.name} - {self.name}"

class BusRouteAssignment(models.Model):
    bus = models.OneToOneField(Bus, on_delete=models.CASCADE, related_name='route_assignment')
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='assigned_buses')

    def __str__(self):
        return f"{self.bus.bus_number} → {self.route}"