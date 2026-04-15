from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Civic Education themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.get_or_create_safe(name='Civic Education')

        data = {
            'National Ethics, Discipline, Rights, and Obligations': [
                'Values: Definition, Types, and Importance to Society',
                'Citizenship and Nationalism',
                'Human Rights',
                'Law and Order',
                'Responsible Parenthood',
                'Traffic Regulations',
                'Inter-Personal Relationships',
            ],
            'Emerging Issues in the Society': [
                'Cultism',
                'Drugs and Drug Abuse',
                'Human Trafficking',
                'HIV/AIDS',
                'Youth Empowerment',
            ],
            'Governmental System and Processes': [
                'Structure and Functions of Government',
                'Democracy, Rule of Law and National Development',
                'Political Apathy',
                'Civil Society and Popular Participation',
                'Public Service in Democracy',
            ],
        }

        ct, ctp = 0, 0
        for order, (theme_name, topics) in enumerate(data.items()):
            theme, created = Theme.get_or_create_safe(
                subject=subject, name=theme_name, order=order + 1
            )
            if created:
                ct += 1
            for name in topics:
                topic, tc = Topic.get_or_create_normalized(
                    subject=subject, name=name, defaults={'theme': theme}
                )
                if tc:
                    ctp += 1
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])
        self.stdout.write(self.style.SUCCESS(
            f'Civic Education done — {ct} themes, {ctp} topics created.'
        ))