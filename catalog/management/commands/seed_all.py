from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Seed all WAEC subjects'

    def handle(self, *args, **kwargs):
        commands = [
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