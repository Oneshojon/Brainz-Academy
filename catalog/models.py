from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
# Create your models here.

User = get_user_model()


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def save(self, *args, **kwargs):
        self.name = self.name.strip().title()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Theme(models.Model):
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name='themes'
    )
    name  = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
 
    class Meta:
        ordering       = ['order', 'name']
        unique_together = ('subject', 'name')
 
    def __str__(self):
        return f"{self.subject.name} — {self.name}"
 
    def topic_count(self):
        return self.topics.count()


class Topic(models.Model):
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name='topics'
    )
    theme = models.ForeignKey(                          # ← NEW
        'Theme', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='topics'
    )
    name = models.CharField(max_length=200)
 
    class Meta:
        unique_together = ('subject', 'name')
        indexes = [
            models.Index(fields=['subject', 'theme']),
        ]
 
    def save(self, *args, **kwargs):
        self.name = self.name.strip().title()
        super().save(*args, **kwargs)
    
    @classmethod
    def get_or_create_normalized(cls, subject, name, defaults=None):
        name = name.strip().title()
        return cls.objects.get_or_create(
            subject=subject, name=name, defaults=defaults or {}
        )
    
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

    video_url = models.URLField(
    null=True, blank=True,
    help_text="Short video summary for this topic"
)

    class Meta:
        ordering = ['topic__name']

    def __str__(self):
        tag = ' [AI]' if self.is_ai_generated else ''
        return f"{self.topic.name}{tag}"

    @property
    def subject(self):
        return self.topic.subject


class Worksheet(models.Model):
    """Solved problems worksheet per topic."""
    topic = models.OneToOneField(
        'Topic', on_delete=models.CASCADE,
        related_name='worksheet'
    )
    title        = models.CharField(max_length=255)
    pdf_file     = models.FileField(upload_to='worksheets/', null=True, blank=True)
    ai_content   = models.TextField(blank=True)
    video_url    = models.URLField(null=True, blank=True,
                       help_text="Video walkthrough of worksheet solutions")
    is_ai_generated = models.BooleanField(default=False)
    uploaded_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='uploaded_worksheets'
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['topic__name']

    def __str__(self):
        return f"Worksheet: {self.topic.name}"
    

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
        indexes = [
            models.Index(fields=['subject', 'exam_board', 'year']),
            models.Index(fields=['year']),
        ]

    def __str__(self):
        return f"{self.exam_board.abbreviation} {self.subject.name} {self.get_sitting_display()} {self.year}"

# Add to catalog/models.py after ExamSeries model

class PastPaper(models.Model):
    """A full past paper PDF (questions and/or answers) for a specific exam series."""

    PAPER_TYPE_CHOICES = [
        ('OBJ',       'Objective'),
        ('THEORY',    'Theory'),
        ('PRACTICAL', 'Practical'),
    ]

    exam_series  = models.ForeignKey(
        ExamSeries, on_delete=models.CASCADE,
        related_name='past_papers'
    )
    paper_type   = models.CharField(max_length=20, choices=PAPER_TYPE_CHOICES)
    question_pdf = models.FileField(
        upload_to='past_papers/questions/',
        null=True, blank=True,
        help_text='PDF of the questions'
    )
    answer_pdf   = models.FileField(
        upload_to='past_papers/answers/',
        null=True, blank=True,
        help_text='PDF of the answers/marking scheme'
    )
    video_url    = models.URLField(
        null=True, blank=True,
        help_text='YouTube or other video walkthrough URL'
    )
    uploaded_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='uploaded_papers'
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('exam_series', 'paper_type')
        ordering        = ['-exam_series__year', 'paper_type']
        indexes         = [
            models.Index(fields=['exam_series', 'paper_type']),
        ]

    def __str__(self):
        return f"{self.exam_series} — {self.get_paper_type_display()}"

    @property
    def video_embed_url(self):
        """Convert YouTube watch URL to embed URL."""
        import re
        url = self.video_url
        if not url:
            return None
        if 'youtube.com/embed/' in url:
            return url
        m = re.match(r'https?://youtu\.be/([^?&]+)', url)
        if m:
            return f'https://www.youtube.com/embed/{m.group(1)}'
        m = re.match(r'https?://(?:www\.)?youtube\.com/watch\?v=([^?&]+)', url)
        if m:
            return f'https://www.youtube.com/embed/{m.group(1)}'
        return url

    @property
    def has_questions(self):
        return bool(self.question_pdf)

    @property
    def has_answers(self):
        return bool(self.answer_pdf)

    @property
    def has_video(self):
        return bool(self.video_url)

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
        indexes = [
            models.Index(fields=['subject', 'question_type']),
            models.Index(fields=['difficulty']),
        ]

        

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
    'key':         'referral_leaderboard',
    'label':       'Referral Leaderboard',
    'description': 'Shows public referral leaderboard on the referrals page.',
    'is_enabled':  False,   # admin toggles this on when ready
    'visible_to':  'STUDENT',
},
    {'key': 'test_builder_random',
     'label': 'Test Builder — Random Mode', 
     'is_enabled': True, 
     'visible_to': 'TEACHER', 
     'description': 'Random/filter '
     'question generation'
     },
    {'key': 'test_builder_manual', 
     'label': 'Test Builder — Manual Mode', 
     'is_enabled': True, 
     'visible_to': 'TEACHER', 
     'description': 'Manual step-by-step '
     'question selection'
     },
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


class SubscriptionPlan(models.Model):
    """
    Defines available subscription tiers.
    Admin creates/edits these from the feature flags admin page.
    When saved, the paystack_plan_code field will hold the Paystack plan code
    (populated later when Paystack keys are available).
    """
 
    PLAN_TYPE_CHOICES = [
        ('STUDENT_BASIC', 'Student Basic'),
        ('TEACHER_PRO',   'Teacher Pro'),
    ]
 
    DURATION_CHOICES = [
        ('MONTHLY',  'Monthly'),
        ('TERMLY',   'Termly (3 months)'),
        ('YEARLY',   'Yearly'),
    ]
 
    plan_type           = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES, unique=False)
    duration            = models.CharField(max_length=10, choices=DURATION_CHOICES)
    name                = models.CharField(max_length=100,
                              help_text="Display name e.g. 'Student Basic — Monthly'")
    price               = models.DecimalField(max_digits=10, decimal_places=2,
                              help_text="Price in Naira (NGN)")
    description         = models.TextField(blank=True,
                              help_text="Shown on the pricing page")
    features            = models.TextField(blank=True,
                              help_text="Comma-separated list of features e.g. 'Unlimited practice,Full analytics,Lesson notes'")
    is_active           = models.BooleanField(default=True,
                              help_text="Inactive plans are hidden from the pricing page")
    paystack_plan_code  = models.CharField(max_length=100, blank=True,
                              help_text="Filled automatically when Paystack keys are added")
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)
 
    class Meta:
        unique_together = ('plan_type', 'duration')
        ordering = ['plan_type', 'price']
 
    def __str__(self):
        return f"{self.name} — ₦{self.price}"
 
    @property
    def duration_days(self):
        """Returns the number of days this plan covers."""
        return {
            'MONTHLY': 30,
            'TERMLY':  90,
            'YEARLY':  365,
        }.get(self.duration, 30)
 
    @property
    def features_list(self):
        """Returns features as a Python list."""
        return [f.strip() for f in self.features.split(',') if f.strip()]
 
class UserSubscription(models.Model):
    """
    Tracks a user's active or past subscription.
    One active subscription per user at a time.
    """
 
    STATUS_CHOICES = [
        ('ACTIVE',    'Active'),
        ('EXPIRED',   'Expired'),
        ('CANCELLED', 'Cancelled'),
        ('PENDING',   'Pending Payment'),  # created but not yet paid
    ]
 
    user                = models.ForeignKey(
                              settings.AUTH_USER_MODEL,
                              on_delete=models.CASCADE,
                              related_name='subscriptions',
                          )
    plan                = models.ForeignKey(
                              SubscriptionPlan,
                              on_delete=models.PROTECT,  # don't delete plan if subscriptions exist
                              related_name='subscriptions',
                          )
    status              = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    started_at          = models.DateTimeField(null=True, blank=True)
    expires_at          = models.DateTimeField(null=True, blank=True)
 
    # Payment tracking (filled when Paystack keys available)
    paystack_reference  = models.CharField(max_length=200, blank=True,
                              help_text="Paystack transaction reference")
    paystack_sub_code   = models.CharField(max_length=200, blank=True,
                              help_text="Paystack subscription code for recurring billing")
    amount_paid         = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
 
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)
 
    class Meta:
        ordering = ['-created_at']
        indexes = [
        models.Index(fields=['user', 'status']),
        models.Index(fields=['status', 'expires_at']),
    ]
        
    def __str__(self):
        return f"{self.user.email} — {self.plan.name} ({self.status})"
 
    @property
    def is_active(self):
        """True if subscription is active and not yet expired."""
        if self.status != 'ACTIVE':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True
 
    @property
    def days_remaining(self):
        if not self.expires_at:
            return 0
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)
 
    def activate(self, reference=''):
        """Mark subscription as active. Called after payment verification."""
        self.status             = 'ACTIVE'
        self.started_at         = timezone.now()
        self.expires_at         = timezone.now() + timedelta(days=self.plan.duration_days)
        self.paystack_reference = reference
        self.save()
 
    def cancel(self):
        self.status = 'CANCELLED'
        self.save(update_fields=['status', 'updated_at'])
 
 
class FreeUsageTracker(models.Model):
    """
    Tracks free-tier usage limits per user.
 
    Students:  max 5 sessions/day, max 15 questions/session
    Teachers:  max 2 test builder trials (lifetime), max 15 questions/trial
               practice access same as student free tier
    """
 
    FREE_DAILY_SESSION_LIMIT    = 5
    FREE_QUESTION_LIMIT         = 15   # max questions per free session
    FREE_TEST_BUILDER_TRIALS    = 2    # lifetime trials for free teachers
 
    user                    = models.OneToOneField(
                                  settings.AUTH_USER_MODEL,
                                  on_delete=models.CASCADE,
                                  related_name='free_usage',
                              )
    # Daily practice tracking (students + free teachers)
    date                    = models.DateField(default=timezone.now)
    session_count           = models.PositiveIntegerField(default=0)
 
    # Lifetime test builder trial tracking (teachers only)
    test_builder_trials_used = models.PositiveIntegerField(default=0)
 
    updated_at              = models.DateTimeField(auto_now=True)
 
    class Meta:
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return (
            f"{self.user.email} — "
            f"sessions: {self.session_count}/{self.FREE_DAILY_SESSION_LIMIT} today, "
            f"trials: {self.test_builder_trials_used}/{self.FREE_TEST_BUILDER_TRIALS}"
        )
 
    # ── Daily reset ───────────────────────────────────────────────────────────
 
    def reset_if_new_day(self):
        today = timezone.now().date()
         # Convert self.date to date if it's a datetime
        last_date = self.date.date() if hasattr(self.date, 'date') else self.date
        if last_date < today:
            self.session_count = 0
            self.date = today
            self.save(update_fields=['date', 'session_count', 'updated_at'])
 
    # ── Practice session checks ───────────────────────────────────────────────
 
    def can_start_session(self):
        """Returns True if user hasn't hit their daily session limit."""
        self.reset_if_new_day()
        return self.session_count < self.FREE_DAILY_SESSION_LIMIT
 
    def sessions_remaining_today(self):
        self.reset_if_new_day()
        return max(0, self.FREE_DAILY_SESSION_LIMIT - self.session_count)
 
    def increment_session(self):
        self.reset_if_new_day()
        self.session_count += 1
        self.save(update_fields=['session_count', 'updated_at'])
 
    # ── Test builder trial checks (teachers) ──────────────────────────────────
 
    def can_use_test_builder(self):
        """Returns True if teacher still has free trials remaining."""
        return self.test_builder_trials_used < self.FREE_TEST_BUILDER_TRIALS
 
    def trials_remaining(self):
        return max(0, self.FREE_TEST_BUILDER_TRIALS - self.test_builder_trials_used)
 
    def increment_test_builder_trial(self):
        self.test_builder_trials_used += 1
        self.save(update_fields=['test_builder_trials_used', 'updated_at'])


INITIAL_PLANS = [
    # ── Student Basic ─────────────────────────────────────────────────────────
    {
        'plan_type':    'STUDENT_BASIC',
        'duration':     'MONTHLY',
        'name':         'Student Basic — Monthly',
        'price':        3000,
        'description':  'Full access to all student features for one month.',
        'features':     'Unlimited practice sessions,Full analytics & weak topic insights,'
                        'Lesson notes access,AI-generated notes,Priority support',
        'is_active':    True,
    },
    {
        'plan_type':    'STUDENT_BASIC',
        'duration':     'TERMLY',
        'name':         'Student Basic — Termly',
        'price':        7000,
        'description':  'Full access for a full school term (3 months). Save ₦1,000.',
        'features':     'Unlimited practice sessions,Full analytics & weak topic insights,'
                        'Lesson notes access,AI-generated notes,Priority support',
        'is_active':    True,
    },
    {
        'plan_type':    'STUDENT_BASIC',
        'duration':     'YEARLY',
        'name':         'Student Basic — Yearly',
        'price':        27000,
        'description':  'Best value — full access for a whole year. Save ₦6,000.',
        'features':     'Unlimited practice sessions,Full analytics & weak topic insights,'
                        'Lesson notes access,AI-generated notes,Priority support',
        'is_active':    True,
    },
    # ── Teacher Pro ───────────────────────────────────────────────────────────
    {
        'plan_type':    'TEACHER_PRO',
        'duration':     'MONTHLY',
        'name':         'Teacher Pro — Monthly',
        'price':        5000,
        'description':  'Full teacher portal access for one month.',
        'features':     'Test builder,DOCX & CSV question upload,'
                        'Student performance dashboard,Lesson note management,'
                        'AI-generated lesson notes,Priority support',
        'is_active':    True,
    },
    {
        'plan_type':    'TEACHER_PRO',
        'duration':     'TERMLY',
        'name':         'Teacher Pro — Termly',
        'price':        10000,
        'description':  'Full teacher portal access for a full term. Save ₦1,500.',
        'features':     'Test builder,DOCX & CSV question upload,'
                        'Student performance dashboard,Lesson note management,'
                        'AI-generated lesson notes,Priority support',
        'is_active':    True,
    },
    {
        'plan_type':    'TEACHER_PRO',
        'duration':     'YEARLY',
        'name':         'Teacher Pro — Yearly',
        'price':        45000,
        'description':  'Best value for teachers — full access for a whole year. Save ₦11,000.',
        'features':     'Test builder,DOCX & CSV question upload,'
                        'Student performance dashboard,Lesson note management,'
                        'AI-generated lesson notes,Priority support',
        'is_active':    True,
    },
]
 
 
def _seed_plans():
    plans = [
        # Student Basic
        dict(plan_type='STUDENT_BASIC', duration='MONTHLY', price=3000,
             name='Student Basic — Monthly'),
        dict(plan_type='STUDENT_BASIC', duration='YEARLY',  price=30000,
             name='Student Basic — Yearly'),
        # Teacher Pro
        dict(plan_type='TEACHER_PRO',   duration='MONTHLY', price=5000,
             name='Teacher Pro — Monthly'),
        dict(plan_type='TEACHER_PRO',   duration='YEARLY',  price=45000,
             name='Teacher Pro — Yearly'),
    ]
    for p in plans:
        SubscriptionPlan.objects.get_or_create(
            plan_type=p['plan_type'],
            duration=p['duration'],
            defaults={
                'name':      p['name'],
                'price':     p['price'],
                'is_active': True,
            }
        )
    print("Plans seeded.")
 

class FreeTeacherTopicAccess(models.Model):
    """
    Records each unique topic a free-tier teacher has accessed lesson notes for.
 
    Rules:
    - Free teachers can access notes for up to 5 distinct topics (lifetime)
    - Re-viewing a topic they already accessed does NOT consume another slot
    - Subscribed teachers (TEACHER_PRO) bypass this entirely
 
    Example:
        Physics → Waves          (slot 1)
        Physics → Light          (slot 2)
        Maths   → Algebra        (slot 3)
        Maths   → Trigonometry   (slot 4)
        Physics → Waves (again)  (free — already accessed)
        Chemistry → Acids        (slot 5 — last free slot)
        Biology → Cells          (BLOCKED — upgrade required)
    """
 
    FREE_TOPIC_LIMIT = 5
 
    user       = models.ForeignKey(
                     settings.AUTH_USER_MODEL,
                     on_delete=models.CASCADE,
                     related_name='free_topic_accesses',
                 )
    topic      = models.ForeignKey(
                     'Topic',
                     on_delete=models.CASCADE,
                     related_name='free_accesses',
                 )
    accessed_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        unique_together = ('user', 'topic')   # prevents double-counting same topic
        ordering        = ['accessed_at']
 
    def __str__(self):
        return f"{self.user.email} → {self.topic.name}"
 
    @classmethod
    def topics_accessed_count(cls, user):
        """How many unique topics this user has accessed so far."""
        return cls.objects.filter(user=user).count()
 
    @classmethod
    def has_accessed(cls, user, topic):
        """True if this user has already opened this topic before."""
        return cls.objects.filter(user=user, topic=topic).exists()
 
    @classmethod
    def slots_remaining(cls, user):
        used = cls.topics_accessed_count(user)
        return max(0, cls.FREE_TOPIC_LIMIT - used)
 
    @classmethod
    def can_access(cls, user, topic):
        """
        Returns (allowed: bool, reason: str).
        Call this before showing a lesson note to a free teacher.
        """
        # Already accessed this topic — always allow, no slot consumed
        if cls.has_accessed(user, topic):
            return True, ''
 
        # New topic — check if slots remain
        if cls.slots_remaining(user) > 0:
            return True, ''
 
        return False, (
            f"You have reached the free limit of {cls.FREE_TOPIC_LIMIT} lesson note topics. "
            f"Upgrade to Teacher Pro for unlimited access."
        )
 
    @classmethod
    def record_access(cls, user, topic):
        """
        Record that this user accessed this topic.
        Safe to call multiple times — uses get_or_create.
        Returns (created: bool) — True if a new slot was consumed.
        """
        _, created = cls.objects.get_or_create(user=user, topic=topic)
        return created