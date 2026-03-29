from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Christian Religious Studies themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Christian Religious Studies')

        data = {
            'Themes from the Old Testament': [
                'God the Creator and Controller of the Universe (Sovereignty of God)',
                'Leadership Roles: Joseph',
                'Leadership Roles: Moses',
                'Leadership Roles: Joshua',
                'Leadership Roles: Deborah',
                'Parental Responsibility: Eli and Samuel',
                "Consequences of Saul's Disobedience",
                "David's Submission to the Will of God",
                "David's Sin, Repentance and Forgiveness",
                "Solomon's Wisdom and Making Decisions",
                'The Unwise Decision of Solomon and Rehoboam',
                "Religious Tensions During Ahab's Reign (Supremacy of God)",
                'Elijah at Mount Carmel',
                'Greed and Its Effects: Ahab and Gehazi',
                'Religious Reforms: Reign of King Josiah',
                "Concern for One's Nation (Nehemiah)",
                'Faith and Courage: Daniel',
                'True Religion and Social Justice: Amos',
                "God's Divine Love: Hosea",
            ],
            'Themes from the Synoptic Gospels and Acts': [
                'The Baptism of Jesus',
                'The Temptation of Jesus',
                'The Call and Demands of Discipleship',
                "Jesus' Teaching on Forgiveness",
                'Jesus at Gethsemane',
                "Peter's Denials",
                'The Trial and Condemnation of Jesus',
                'The Crucifixion and Burial of Jesus',
                'The Resurrection of Jesus',
                'Fellowship in the Early Church',
                'The Holy Spirit at Pentecost',
                'Mission to the Gentiles',
                'Opposition to the Gospel Message',
            ],
            'Themes from Selected Epistles': [
                'Faith and Works (Epistle of James)',
                'Impartiality (Epistle of James)',
                'Effective Prayers (Epistle of James)',
                'Good Citizenship (1 Peter)',
                'Christians Living Among Non-Christians (1 Peter)',
                'Interpersonal Relationships Among Christians (1 Peter)',
            ],
        }

        ct, ctp = 0, 0
        for order, (theme_name, topics) in enumerate(data.items()):
            theme, created = Theme.objects.get_or_create(
                subject=subject, name=theme_name, defaults={'order': order + 1}
            )
            if created:
                ct += 1
            for name in topics:
                topic, tc = Topic.objects.get_or_create(
                    subject=subject, name=name, defaults={'theme': theme}
                )
                if tc:
                    ctp += 1
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])
        self.stdout.write(self.style.SUCCESS(f'Christian Religious Studies done — {ct} themes, {ctp} topics created.'))
