from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Bus(models.Model):
    BUS_STATUS = [
        ('active', 'Active'),
        ('under_maintenance', 'Under Maintenance'),
        ('inactive', 'Inactive'),
    ]

    BUS_TYPE_CHOICES = [
        ('incity', 'In-city'),
        ('outercity', 'Outer-city'),
    ]
    
    bus_number = models.CharField(max_length=20, unique=True)
    license_plate = models.CharField(max_length=15, unique=True)
    capacity = models.PositiveIntegerField()
    driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                             limit_choices_to={'user_type': 'driver'})
    #status = models.CharField(max_length=20, choices=BUS_STATUS, default='active')
    status = models.CharField(max_length=30, choices=BUS_STATUS, default='active')
    nfc_reader_id = models.CharField(max_length=50, unique=True)
    current_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    route = models.CharField(max_length=100, blank=True)
    bus_type = models.CharField(max_length=20, choices=BUS_TYPE_CHOICES, default='incity')
    
    def __str__(self):
        return f"Bus {self.bus_number} ({self.license_plate})"

    class Meta:
        ordering = ['id']  # 👈 this is the fix
