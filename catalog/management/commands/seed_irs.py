from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Islamic Religious Studies themes and topics'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Islamic Religious Studies')

        data = {
            'Tawhid (Belief in Allah)': [
                'The Oneness of Allah (Tawhid)',
                'Attributes of Allah (Asmaul Husna)',
                'Belief in Angels and Their Functions',
                'Belief in the Books of Allah',
                'Belief in the Prophets and Messengers',
                'Belief in the Last Day (Yawm al-Qiyamah)',
                'Al-Qadar: Belief in Divine Decree',
            ],
            'Ibadah (Acts of Worship)': [
                'Shahada: The Declaration of Faith',
                'Salat: Obligatory Prayers (Times, Conditions, Procedure)',
                'Zakat: Almsgiving (Conditions, Nisab, Recipients)',
                'Sawm: Fasting in Ramadan (Rules, Benefits, Exemptions)',
                'Hajj: Pilgrimage to Makkah (Conditions, Rites, Significance)',
                "Voluntary Acts of Worship (Nafl, Dhikr, Du'a)",
            ],
            'The Quran': [
                'Introduction to the Quran: Meaning and Significance',
                'Revelation and Compilation of the Quran',
                'Selected Surahs and Their Meanings',
                'Tafsir: Interpretation of the Quran',
                'Tajweed: Rules of Quranic Recitation',
                'Virtues of Reciting the Quran',
            ],
            'Hadith and Sunnah': [
                'Importance and Authority of Hadith',
                "Classification of Hadith (Sahih, Hasan, Da'if)",
                'Selected Hadiths and Their Teachings',
                'The Sunnah of the Prophet (SAW)',
            ],
            'History of Islam': [
                'Arabia Before Islam (Pre-Islamic Period)',
                'Birth and Early Life of Prophet Muhammad (SAW)',
                'Prophethood and the First Revelation',
                'Persecution in Makkah and Hijra to Madinah',
                'The Islamic State in Madinah',
                'Conquest of Makkah and Spread of Islam in Arabia',
                'The Rightly Guided Caliphs (Abu Bakr, Umar, Uthman, Ali)',
                'Spread of Islam in West Africa',
                'Islam in Nigeria: History and Development',
            ],
            'Islamic Ethics and Values': [
                'Honesty and Truthfulness (Sidq and Amanah)',
                'Respect for Parents and Elders',
                'Brotherhood and Unity in Islam (Ukhuwwah)',
                'Justice and Equity (Adl)',
                'Islamic Family Law: Marriage (Nikah) and Conditions',
                "Islamic Family Law: Divorce (Talaq) and Khul')",
                'Islamic Law of Inheritance (Mirath)',
                'Halal and Haram: Permissible and Forbidden Things',
                'Islamic Social Ethics (Community Life, Good Character)',
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
                topic, tc = Topic.get_or_create_normalized(
                    subject=subject, name=name, defaults={'theme': theme}
                )
                if tc:
                    ctp += 1
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])
        self.stdout.write(self.style.SUCCESS(f'Islamic Religious Studies done — {ct} themes, {ctp} topics created.'))
