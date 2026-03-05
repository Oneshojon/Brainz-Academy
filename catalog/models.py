from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
# Create your models here.

User = get_user_model()


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def save(self, *args, **kwargs):
        self.name = self.name.strip().title()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = ('subject', 'name')

    def save(self, *args, **kwargs):
        self.name = self.name.strip().title()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.subject.name}: {self.name}"


class LessonNote(models.Model):
    """One lesson note (PDF) per topic. May be human-uploaded or AI-generated."""

    topic        = models.OneToOneField(
                       'Topic',                        # one note per topic
                       on_delete=models.CASCADE,
                       related_name='lesson_note',
                   )
    title        = models.CharField(max_length=255)
    pdf_file     = models.FileField(
                       upload_to='lesson_notes/',
                       null=True, blank=True,          # null while AI is generating
                   )
    description  = models.TextField(blank=True)
    is_ai_generated = models.BooleanField(default=False)
    ai_content   = models.TextField(
                       blank=True,
                       help_text="Raw AI text, stored so it can be rendered as HTML "
                                 "or later converted to a real PDF by an admin."
                   )
    uploaded_by  = models.ForeignKey(
                       settings.AUTH_USER_MODEL,
                       on_delete=models.SET_NULL,
                       null=True, blank=True,
                       related_name='uploaded_notes',
                   )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['topic__name']

    def __str__(self):
        tag = ' [AI]' if self.is_ai_generated else ''
        return f"{self.topic.name}{tag}"

    @property
    def subject(self):
        return self.topic.subject


class ExamBoard(models.Model):
    """Represents an exam body e.g. WAEC, NECO, JAMB"""
    name = models.CharField(max_length=100, unique=True)
    abbreviation = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.abbreviation


class ExamSeries(models.Model):
    """Represents a specific sitting of an exam e.g. WAEC May/June 2023"""

    SITTING_CHOICES = [
        ('MAY_JUNE', 'May/June'),
        ('NOV_DEC', 'Nov/Dec'),
        ('MOCK', 'Mock'),
        ('OTHER', 'Other'),
    ]

    exam_board = models.ForeignKey(ExamBoard, on_delete=models.CASCADE, related_name='series')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exam_series')
    year = models.PositiveIntegerField()
    sitting = models.CharField(max_length=20, choices=SITTING_CHOICES, default='MAY_JUNE')

    class Meta:
        unique_together = ('exam_board', 'subject', 'year', 'sitting')
        verbose_name_plural = 'Exam series'

    def __str__(self):
        return f"{self.exam_board.abbreviation} {self.subject.name} {self.get_sitting_display()} {self.year}"


class Question(models.Model):
    QUESTION_TYPES = [
        ('OBJ', 'Objective'),
        ('THEORY', 'Theory'),
    ]

    DIFFICULTY_CHOICES = [
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    ]

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='questions')
    topics = models.ManyToManyField(Topic, blank=True, related_name='questions')
    exam_series = models.ForeignKey(
        ExamSeries, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions'
    )
    question_number = models.PositiveIntegerField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='OBJ')
    content = models.TextField()
    image = models.ImageField(upload_to='questions/', null=True, blank=True)
    marks = models.PositiveIntegerField(default=1)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, null=True, blank=True)

    class Meta:
        unique_together = ('exam_series', 'question_number')
        ordering = ['question_number']
        

    def __str__(self):
        return f"Q{self.question_number} - {self.subject.name}"
    
    
class Choice(models.Model):
    """Answer options for objective (multiple choice) questions"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    label = models.CharField(max_length=10)  # A, B, C, D
    choice_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    explanation = models.TextField(null=True, blank=True)
    video_url = models.URLField(null=True, blank=True, help_text="Link to a video explaining this answer")
    class Meta:
        unique_together = ('question', 'label')

    def __str__(self):
        return f"{self.question} — {self.label}"


class TheoryAnswer(models.Model):
    """Model answer for theory questions"""
    question = models.OneToOneField(
        Question, on_delete=models.CASCADE, related_name='theory_answer'
    )
    content = models.TextField()
    marking_guide = models.TextField(
        null=True, blank=True,
        help_text="Notes for teachers on how marks should be awarded"
    )
    video_url = models.URLField(null=True, blank=True, help_text="Link to a video walkthrough of this answer")

    def __str__(self):
        return f"Answer for {self.question}"


class FeatureFlag(models.Model):
    """
    Admin-controlled on/off switches for any platform feature.

    Usage in views:
        @feature_required('lesson_notes')
        def lesson_notes(request): ...

    Usage in templates:
        {% load feature_tags %}
        {% if_feature 'lesson_notes' %}
            <a href="...">Lesson Notes</a>
        {% end_if_feature %}
    """

    ROLE_CHOICES = [
        ('ALL',     'All users'),
        ('STUDENT', 'Students only'),
        ('TEACHER', 'Teachers only'),
    ]

    key         = models.SlugField(
                      unique=True,
                      help_text="Snake_case identifier used in code, e.g. 'lesson_notes'"
                  )
    label       = models.CharField(max_length=120,
                      help_text="Human-readable name shown in admin panel")
    description = models.TextField(blank=True,
                      help_text="What this feature does — shown in admin panel")
    is_enabled  = models.BooleanField(default=True)
    visible_to  = models.CharField(
                      max_length=10, choices=ROLE_CHOICES, default='ALL',
                      help_text="Which role this flag gates. "
                                "Disabling 'TEACHER' flag still works for STUDENT views."
                  )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['label']

    def __str__(self):
        status = '✅' if self.is_enabled else '❌'
        return f"{status} {self.label} ({self.key})"
    
# ── INITIAL FLAGS (run via data migration or management command) ───────────────
# Call _seed_flags() once after running migrations.

INITIAL_FLAGS = [
    {
        'key':         'lesson_notes',
        'label':       'Lesson Notes',
        'description': 'Allows teachers to browse and download lesson notes, '
                       'and students to receive topic recommendations.',
        'is_enabled':  True,
        'visible_to':  'ALL',
    },
    {
        'key':         'ai_lesson_notes',
        'label':       'AI-Generated Lesson Notes',
        'description': 'When no PDF exists for a topic, offer AI-generated notes '
                       'as a fallback. Teachers must accept before content is shown.',
        'is_enabled':  True,
        'visible_to':  'TEACHER',
    },
    {
        'key':         'practice',
        'label':       'Practice / CBT',
        'description': 'Student practice sessions and exam simulation.',
        'is_enabled':  True,
        'visible_to':  'STUDENT',
    },
    {
        'key':         'analytics',
        'label':       'Analytics & Progress',
        'description': 'Student analytics dashboard with charts.',
        'is_enabled':  True,
        'visible_to':  'STUDENT',
    },
    {
        'key':         'leaderboard',
        'label':       'Leaderboard',
        'description': 'Public student leaderboard.',
        'is_enabled':  True,
        'visible_to':  'STUDENT',
    },
    {
        'key':         'bookmarks',
        'label':       'Bookmarks',
        'description': 'Students can bookmark questions for later revision.',
        'is_enabled':  True,
        'visible_to':  'STUDENT',
    },
    {
        'key':         'referral',
        'label':       'Referral Programme',
        'description': 'Student referral links and rewards.',
        'is_enabled':  True,
        'visible_to':  'STUDENT',
    },
    {
        'key':         'test_builder',
        'label':       'Test Builder',
        'description': 'React-based teacher tool to build custom question sets.',
        'is_enabled':  True,
        'visible_to':  'TEACHER',
    },
    {
        'key':         'docx_upload',
        'label':       'DOCX Question Upload',
        'description': 'Admin tool to bulk-import questions from Word documents.',
        'is_enabled':  True,
        'visible_to':  'TEACHER',
    },
    {
    'key':         'csv_upload',
    'label':       'CSV Question Upload',
    'description': 'Admin tool to bulk-import questions from CSV files.',
    'is_enabled':  True,
    'visible_to':  'TEACHER',
},
]


def _seed_flags():
    """
    Call once to populate initial feature flags.
    Safe to call multiple times — uses get_or_create.

    python manage.py shell -c "from catalog.models import _seed_flags; _seed_flags()"
    """
    for flag_data in INITIAL_FLAGS:
        FeatureFlag.objects.get_or_create(
            key=flag_data['key'],
            defaults=flag_data,
        )
    print(f"✅ {len(INITIAL_FLAGS)} feature flags seeded.")