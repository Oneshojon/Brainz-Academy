from django.core.management.base import BaseCommand
from catalog.models import _seed_plans

class Command(BaseCommand):
    help = 'Seed subscription plans'

    def handle(self, *args, **kwargs):
        _seed_plans()