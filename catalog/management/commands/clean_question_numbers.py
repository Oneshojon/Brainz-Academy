from django.core.management.base import BaseCommand
from catalog.models import Question
import re


class Command(BaseCommand):
    help = 'Strip leading question numbers from question content in the database'

    def handle(self, *args, **kwargs):
        questions = Question.objects.all()
        updated = 0

        for q in questions:
            if not q.content:
                continue

            # Match <p>6. or <p style="...">6. at the start of content
            cleaned = re.sub(
                r'(<p[^>]*>)\s*\d+[.\)]\s*',
                r'\1',
                q.content,
                count=1  # only strip from the first paragraph
            )

            if cleaned != q.content:
                q.content = cleaned
                q.save(update_fields=['content'])
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done — {updated} questions cleaned out of {questions.count()} total.'
        ))
