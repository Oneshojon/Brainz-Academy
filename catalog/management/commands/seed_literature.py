from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Literature in English themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Literature in English')

        data = {
            'General Knowledge of Literature': [
                'Definition and Branches of Literature (Prose, Drama, Poetry)',
                'Literary Terms and Devices (Simile, Metaphor, Alliteration, Irony, etc.)',
                'Elements of Fiction (Plot, Setting, Theme, Character, Style)',
                'Elements of Drama (Conflict, Acts, Scenes, Stage Directions)',
                'Elements of Poetry (Rhyme, Rhythm, Tone, Mood, Imagery)',
                'Figures of Speech',
                'Unseen Prose Passages',
                'Unseen Poetry Analysis',
            ],
            'African Prose': [
                'Plot and Setting in African Prose',
                'Character and Characterisation in African Prose',
                'Theme and Subject Matter in African Prose',
                'Style and Language in African Prose',
                'Social and Cultural Context of African Prose',
            ],
            'Non-African Prose': [
                'Plot and Setting in Non-African Prose',
                'Character and Characterisation in Non-African Prose',
                'Theme and Subject Matter in Non-African Prose',
                'Style and Language in Non-African Prose',
            ],
            'Shakespearean Text': [
                'Plot Summary and Structure in Shakespeare',
                'Character Analysis in Shakespeare',
                'Themes in Shakespearean Drama',
                'Setting and Context in Shakespeare',
                'Language and Style in Shakespeare',
                'Context Questions on Prescribed Shakespearean Text',
            ],
            'African Drama': [
                'Plot and Conflict in African Drama',
                'Character and Characterisation in African Drama',
                'Themes in African Drama',
                'Dramatic Techniques in African Drama',
                'Cultural Context of African Drama',
            ],
            'Non-African Drama': [
                'Plot and Conflict in Non-African Drama',
                'Character and Characterisation in Non-African Drama',
                'Themes in Non-African Drama',
                'Dramatic Techniques in Non-African Drama',
            ],
            'African Poetry': [
                'Poetic Devices in African Poetry',
                'Themes and Subject Matter in African Poetry',
                'Tone, Mood and Attitude in African Poetry',
                'Analysis of Prescribed African Poems',
                '"Once Upon a Time" by Gabriel Okara',
                '"Not My Business" by Niyi Osundare',
                '"Night" by Wole Soyinka',
                '"New Tongue" by Elizabeth L.A. Kamara',
            ],
            'Non-African Poetry': [
                'Poetic Devices in Non-African Poetry',
                'Themes and Subject Matter in Non-African Poetry',
                'Tone, Mood and Attitude in Non-African Poetry',
                'Analysis of Prescribed Non-African Poems',
                '"She Walks in Beauty" by Lord Byron',
                '"Still I Rise" by Maya Angelou',
                '"Digging" by Seamus Heaney',
                '"The Stone" by Wilfrid Wilson Gibson',
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
        self.stdout.write(self.style.SUCCESS(f'Literature in English done — {ct} themes, {ctp} topics created.'))
