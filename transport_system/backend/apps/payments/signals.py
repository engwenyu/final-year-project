from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Wallet


User = get_user_model()


@receiver(post_save, sender=User)
def create_wallet_for_user(sender, instance, created, **kwargs):
    """
    Ensure every passenger and driver has a Wallet created automatically
    upon account creation. Admins can be skipped unless needed later.
    """
    if not created:
        return

    try:
        user_type = getattr(instance, 'user_type', None)
        if user_type in ('passenger', 'driver'):
            Wallet.objects.get_or_create(user=instance)
    except Exception:
        # Avoid breaking user creation due to wallet issues
        pass


