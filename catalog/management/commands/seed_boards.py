from django.core.management.base import BaseCommand
from catalog.models import ExamBoard


class Command(BaseCommand):
    help = 'Seed Nigerian exam boards'

    def handle(self, *args, **kwargs):
        boards = [
            {'name': 'West African Examinations Council', 'abbreviation': 'WAEC'},
            {'name': 'National Examinations Council', 'abbreviation': 'NECO'},
            {'name': 'Joint Admissions and Matriculation Board', 'abbreviation': 'JAMB'},
        ]

        ct = 0
        for board in boards:
            _, created = ExamBoard.objects.get_or_create(
                abbreviation=board['abbreviation'],
                defaults={'name': board['name']}
            )
            if created:
                ct += 1

        self.stdout.write(self.style.SUCCESS(f'Exam boards done — {ct} boards created.'))