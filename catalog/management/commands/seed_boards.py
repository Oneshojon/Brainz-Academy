from django.core.management.base import BaseCommand
from catalog.models import ExamBoard


class Command(BaseCommand):
    help = 'Seed Nigerian exam boards'

    def handle(self, *args, **kwargs):
        boards = [
            {'name': 'WAEC', 'abbreviation': 'WAEC'},
            {'name': 'NECO', 'abbreviation': 'NECO'},
            {'name': 'JAMB', 'abbreviation': 'JAMB'},
            {'name': 'OTHER', 'abbreviation': 'OTHER'},
        ]

        ct = 0
        for board in boards:
            obj, created = ExamBoard.objects.get_or_create(
                abbreviation=board['abbreviation'],
                defaults={'name': board['name']}
            )
            if not created and obj.name != board['name']:
                obj.name = board['name']
                obj.save(update_fields=['name'])
            if created:
                ct += 1

        self.stdout.write(self.style.SUCCESS(f'Exam boards done — {ct} created.'))