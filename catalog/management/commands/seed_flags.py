from django.core.management.base import BaseCommand
from catalog.models import _seed_flags

class Command(BaseCommand):
    help = 'Seed feature flags'

    def handle(self, *args, **kwargs):
        _seed_flags()