from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed English Language themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='English Language')

        data = {
            'Essay Writing': [
                'Letter Writing (Formal and Informal)',
                'Speech Writing',
                'Narrative Essays',
                'Descriptive Essays',
                'Debate and Argumentative Essays',
                'Report Writing',
                'Article Writing',
                'Expository Writing',
                'Creative Writing',
                'Content, Organization, Expression and Mechanical Accuracy',
            ],
            'Comprehension': [
                'Understanding Factual Content of Passages',
                'Making Inferences from Passages',
                'Finding Appropriate Equivalents for Words and Phrases',
                'Identifying Sentiments, Emotions and Attitudes',
                'Identifying and Labelling Grammatical Structures',
                'Identifying and Explaining Literary Terms',
                'Recasting Phrases or Sentences into Grammatical Alternatives',
            ],
            'Summary Writing': [
                'Extracting Relevant Information',
                'Summarizing Points in Clear, Concise English',
                'Presenting Summaries of Specific Aspects of a Passage',
                'Avoiding Repetition, Redundancy and Extraneous Material',
            ],
            'Lexis and Vocabulary': [
                'Vocabulary of Everyday Usage',
                'Vocabulary of Finance, Commerce and Banking',
                'Vocabulary of Science and Technology',
                'Vocabulary of Government and Politics',
                'Vocabulary of Transport and Communication',
                'Vocabulary of Sports and Entertainment',
                'Idioms and Idiomatic Expressions',
                'Collocations',
                'Figurative Language and Usage',
            ],
            'Structure and Grammar': [
                'Parts of Speech (Nouns, Pronouns, Verbs, Adjectives, Adverbs)',
                'Sentence Types and Sentence Structure',
                'Sequence of Tenses',
                'Subject-Verb Agreement (Concord)',
                'Matching of Pronouns with Noun Referents',
                'Use of Correct Prepositions',
                'Active and Passive Voice',
                'Direct and Indirect Speech',
                'Conditional Sentences',
                'Conjunctions, Articles, Determiners and Structural Words',
                'Punctuation',
                'Spelling',
            ],
            'Oral English': [
                'Vowel Sounds (Pure Vowels and Diphthongs)',
                'Consonant Sounds (Single Consonants and Clusters)',
                'Word Stress and Sentence Stress',
                'Intonation',
                'Rhymes and Sound Contrasts',
                'Listening Comprehension (Dialogues and Narratives)',
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
        self.stdout.write(self.style.SUCCESS(f'English Language done — {ct} themes, {ctp} topics created.'))
