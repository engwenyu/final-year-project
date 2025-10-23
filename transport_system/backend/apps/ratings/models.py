from django.db import models
from django.contrib.auth import get_user_model
from apps.journeys.models import Journey

User = get_user_model()

class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE)
    driver_rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    bus_rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    service_rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    overall_rating = models.DecimalField(max_digits=3, decimal_places=2)
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'journey']

    def save(self, *args, **kwargs):
        # Calculate overall rating as average
        self.overall_rating = (self.driver_rating + self.bus_rating + self.service_rating) / 3
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Rating by {self.user.username} for Journey {self.journey.id} - {self.overall_rating}★"