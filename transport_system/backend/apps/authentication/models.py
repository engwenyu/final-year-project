from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    USER_TYPES = [
        ('passenger', 'Passenger'),
        ('driver', 'Driver'),
        ('admin', 'Admin'),
    ]
    
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='passenger')
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    nfc_card_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    must_change_password = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"