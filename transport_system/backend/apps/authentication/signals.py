# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.payments.models import Wallet

User = get_user_model()

@receiver(post_save, sender=User)
def create_wallet_for_passenger(sender, instance, created, **kwargs):
    if created and instance.user_type == "passenger":
        Wallet.objects.get_or_create(user=instance)
