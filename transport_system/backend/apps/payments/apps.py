from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.payments'

    def ready(self):
        # Import signals to ensure they are registered on app load
        from . import signals  # noqa: F401