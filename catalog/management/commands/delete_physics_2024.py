from django.core.management.base import BaseCommand
from catalog.models import ExamSeries, Question

class Command(BaseCommand):
    help = 'One-off: delete WAEC Physics MAY_JUNE 2024 questions'

    def handle(self, *args, **kwargs):
        try:
            series = ExamSeries.objects.get(
                exam_board__abbreviation='WAEC',
                subject__name='Physics',
                year=2024,
                sitting='MAY_JUNE'
            )
            count, _ = Question.objects.filter(exam_series=series).delete()
            self.stdout.write(f'Deleted {count} questions from {series}')
        except ExamSeries.DoesNotExist:
            self.stdout.write('ExamSeries not found — nothing deleted')