from django.core.management.base import BaseCommand
from django.core.management import call_command
from catalog.models import Subject


class Command(BaseCommand):
    help = 'Seed all WAEC subjects'

    def handle(self, *args, **kwargs):
        # Ensure Mathematics and Physics exist before their seeders run
        Subject.objects.get_or_create(name='Mathematics')
        Subject.objects.get_or_create(name='Physics')

        commands = [
            'seed_plans',
            'seed_boards',
            'maths_seed',
            'seed_physics',
            'seed_biology',
            'seed_chemistry',
            'seed_economics',
            'seed_government',
            'seed_geography',
            'seed_english',
            'seed_literature',
            'seed_agric',
            'seed_further_maths',
            'seed_commerce',
            'seed_accounting',
            'seed_crs',
            'seed_irs',
            'seed_computer',
        ]
        for cmd in commands:
            self.stdout.write(f'Running {cmd}...')
            call_command(cmd)
        self.stdout.write(self.style.SUCCESS('All subjects seeded successfully!'))