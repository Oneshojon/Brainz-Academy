from django.apps import AppConfig


class ContactConfig(AppConfig):
    """App config for the standalone Contact Us feature."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "contact"