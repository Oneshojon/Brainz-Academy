from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Clear all question, topic and theme data with reset IDs for reseeding'

    def handle(self, *args, **kwargs):
        tables = [
            'catalog_choice',
            'catalog_theoryanswer',
            'catalog_question_topics',  # M2M through table
            'catalog_question',
            'catalog_examseries',
            'catalog_topic',
            'catalog_theme',
        ]

        with connection.cursor() as cursor:
            for table in tables:
                self.stdout.write(f'Truncating {table}...')
                cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')

        self.stdout.write(self.style.SUCCESS('✅ All cleared with reset IDs. Now run seed_all.'))