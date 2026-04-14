from django.db import models, IntegrityError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import timedelta

User = get_user_model()


# ══════════════════════════════════════════════════════════════════════════════
# 1. CONTENT HIERARCHY  (Subject → Theme → Topic)
# ══════════════════════════════════════════════════════════════════════════════

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def save(self, *args, **kwargs):
        self.name = self.name.strip().title()
        super().save(*args, **kwargs)

    @classmethod
    def get_or_create_safe(cls, name):
        name = name.strip().title()
        try:
            return cls.objects.get_or_create(name=name)
        except IntegrityError:
            return cls.objects.get(name=name), False

    def __str__(self):
        return self.name


class Theme(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='themes')
    name    = models.CharField(max_length=200)
    order   = models.PositiveIntegerField(default=0)

    class Meta:
        ordering        = ['order', 'name']
        unique_together = ('subject', 'name')

    def __str__(self):
        return f"{self.subject.name} — {self.name}"

    def topic_count(self):
        return self.topics.count()

    @classmethod
    def get_or_create_safe(cls, subject, name, order):
        try:
            return cls.objects.get_or_create(
                subject=subject, name=name, defaults={'order': order}
            )
        except IntegrityError:
            return cls.objects.get(subject=subject, name=name), False


class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    theme   = models.ForeignKey(
                  'Theme', on_delete=models.SET_NULL,
                  null=True, blank=True, related_name='topics'
              )
    name    = models.CharField(max_length=200)

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


# ══════════════════════════════════════════════════════════════════════════════
# 2. LEARNING MATERIALS  (LessonNote · Worksheet)
# ══════════════════════════════════════════════════════════════════════════════

class LessonNote(models.Model):
    """One lesson note (PDF) per topic. May be human-uploaded or AI-generated."""

    topic           = models.OneToOneField(
                          'Topic', on_delete=models.CASCADE,
                          related_name='lesson_note'
                      )
    title           = models.CharField(max_length=255)
    pdf_file        = models.FileField(
                          upload_to='lesson_notes/',
                          null=True, blank=True,
                      )
    description     = models.TextField(blank=True)
    is_ai_generated = models.BooleanField(default=False)
    ai_content      = models.TextField(
                          blank=True,
                          help_text="Raw AI text — can be rendered as HTML or "
                                    "converted to PDF by an admin."
                      )
    video_url       = models.URLField(null=True, blank=True,
                          help_text="Short video summary for this topic")
    uploaded_by     = models.ForeignKey(
                          settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                          null=True, blank=True, related_name='uploaded_notes'
                      )
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

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

    topic           = models.OneToOneField(
                          'Topic', on_delete=models.CASCADE,
                          related_name='worksheet'
                      )
    title           = models.CharField(max_length=255)
    pdf_file        = models.FileField(upload_to='worksheets/', null=True, blank=True)
    ai_content      = models.TextField(blank=True)
    video_url       = models.URLField(null=True, blank=True,
                          help_text="Video walkthrough of worksheet solutions")
    is_ai_generated = models.BooleanField(default=False)
    uploaded_by     = models.ForeignKey(
                          settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                          null=True, blank=True, related_name='uploaded_worksheets'
                      )
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['topic__name']

    def __str__(self):
        return f"Worksheet: {self.topic.name}"


# ══════════════════════════════════════════════════════════════════════════════
# 3. EXAM STRUCTURE  (ExamBoard → ExamSeries → Question · Choice · TheoryAnswer)
# ══════════════════════════════════════════════════════════════════════════════

class ExamBoard(models.Model):
    """Represents an exam body e.g. WAEC, NECO, JAMB."""

    name         = models.CharField(max_length=100, unique=True)
    abbreviation = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.abbreviation


class ExamSeries(models.Model):
    """Represents a specific sitting of an exam e.g. WAEC May/June 2023."""

    SITTING_CHOICES = [
        ('MAY_JUNE', 'May/June'),
        ('NOV_DEC',  'Nov/Dec'),
        ('MOCK',     'Mock'),
        ('OTHER',    'Other'),
    ]

    exam_board = models.ForeignKey(ExamBoard, on_delete=models.CASCADE, related_name='series')
    subject    = models.ForeignKey(Subject,   on_delete=models.CASCADE, related_name='exam_series')
    year       = models.PositiveIntegerField()
    sitting    = models.CharField(max_length=20, choices=SITTING_CHOICES, default='MAY_JUNE')

    class Meta:
        unique_together  = ('exam_board', 'subject', 'year', 'sitting')
        verbose_name_plural = 'Exam series'
        indexes = [
            models.Index(fields=['subject', 'exam_board', 'year']),
            models.Index(fields=['year']),
        ]

    def __str__(self):
        return (
            f"{self.exam_board.abbreviation} {self.subject.name} "
            f"{self.get_sitting_display()} {self.year}"
        )


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
    video_url    = models.URLField(null=True, blank=True,
                       help_text='YouTube or other video walkthrough URL')
    uploaded_by  = models.ForeignKey(
                       settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                       null=True, blank=True, related_name='uploaded_papers'
                   )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('exam_series', 'paper_type')
        ordering        = ['-exam_series__year', 'paper_type']
        indexes         = [models.Index(fields=['exam_series', 'paper_type'])]

    def __str__(self):
        return f"{self.exam_series} — {self.get_paper_type_display()}"

    @property
    def video_embed_url(self):
        import re
        url = self.video_url
        if not url:
            return None
        if 'youtube.com/embed/' in url:
            return url.split('?')[0]
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
        ('OBJ',    'Objective'),
        ('THEORY', 'Theory'),
    ]

    DIFFICULTY_CHOICES = [
        ('EASY',   'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD',   'Hard'),
    ]

    subject         = models.ForeignKey(Subject,    on_delete=models.CASCADE, related_name='questions')
    topics          = models.ManyToManyField(Topic, blank=True,               related_name='questions')
    exam_series     = models.ForeignKey(
                          ExamSeries, on_delete=models.SET_NULL,
                          null=True, blank=True, related_name='questions'
                      )
    question_number = models.PositiveIntegerField()
    question_type   = models.CharField(max_length=10, choices=QUESTION_TYPES, default='OBJ')
    content         = models.TextField()
    image           = models.ImageField(upload_to='questions/', null=True, blank=True)
    marks           = models.PositiveIntegerField(default=1)
    difficulty      = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, null=True, blank=True)

    class Meta:
        unique_together = ('exam_series', 'question_number')
        ordering        = ['question_number']
        indexes         = [
            models.Index(fields=['subject', 'question_type']),
            models.Index(fields=['difficulty']),
        ]

    def __str__(self):
        return f"Q{self.question_number} - {self.subject.name}"


class Choice(models.Model):
    """Answer options for objective (multiple choice) questions."""

    question    = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    label       = models.CharField(max_length=10)         # A, B, C, D
    choice_text = models.TextField()
    is_correct  = models.BooleanField(default=False)
    explanation = models.TextField(null=True, blank=True)
    video_url   = models.URLField(null=True, blank=True,
                      help_text="Link to a video explaining this answer")

    class Meta:
        unique_together = ('question', 'label')

    def __str__(self):
        return f"{self.question} — {self.label}"


class TheoryAnswer(models.Model):
    """Model answer for theory questions."""

    question      = models.OneToOneField(Question, on_delete=models.CASCADE, related_name='theory_answer')
    content       = models.TextField()
    marking_guide = models.TextField(
                        null=True, blank=True,
                        help_text="Notes for teachers on how marks should be awarded"
                    )
    video_url     = models.URLField(null=True, blank=True,
                        help_text="Link to a video walkthrough of this answer")

    def __str__(self):
        return f"Answer for {self.question}"


# ══════════════════════════════════════════════════════════════════════════════
# 4. SUBSCRIPTIONS  (SubscriptionPlan · UserSubscription)
# ══════════════════════════════════════════════════════════════════════════════

class SubscriptionPlan(models.Model):
    """
    Defines available subscription tiers.
    Prices live here for display; actual charge happens via Paystack.
    """

    PLAN_TYPE_CHOICES = [
        ('STUDENT_BASIC', 'Student Basic'),
        ('TEACHER_PRO',   'Teacher Pro'),
    ]

    DURATION_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('TERMLY',  'Termly (3 months)'),
        ('YEARLY',  'Yearly'),
    ]

    plan_type          = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    duration           = models.CharField(max_length=10, choices=DURATION_CHOICES)
    name               = models.CharField(max_length=100,
                             help_text="Display name e.g. 'Student Basic — Monthly'")
    price              = models.DecimalField(max_digits=10, decimal_places=2,
                             help_text="Price in Naira (NGN)")
    description        = models.TextField(blank=True,
                             help_text="Shown on the pricing page")
    features           = models.TextField(blank=True,
                             help_text="Comma-separated list of features")
    is_active          = models.BooleanField(default=True,
                             help_text="Inactive plans are hidden from the pricing page")
    paystack_plan_code = models.CharField(max_length=100, blank=True,
                             help_text="Paystack plan code for recurring billing")
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('plan_type', 'duration')
        ordering        = ['plan_type', 'price']

    def __str__(self):
        return f"{self.name} — ₦{self.price}"

    @property
    def duration_days(self):
        return {'MONTHLY': 30, 'TERMLY': 90, 'YEARLY': 365}.get(self.duration, 30)

    @property
    def features_list(self):
        return [f.strip() for f in self.features.split(',') if f.strip()]


class UserSubscription(models.Model):
    """Tracks a user's active or past subscription. One active per user at a time."""

    STATUS_CHOICES = [
        ('ACTIVE',    'Active'),
        ('EXPIRED',   'Expired'),
        ('CANCELLED', 'Cancelled'),
        ('PENDING',   'Pending Payment'),
    ]

    user               = models.ForeignKey(
                             settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='subscriptions'
                         )
    plan               = models.ForeignKey(
                             SubscriptionPlan, on_delete=models.PROTECT,
                             related_name='subscriptions'
                         )
    status             = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    started_at         = models.DateTimeField(null=True, blank=True)
    expires_at         = models.DateTimeField(null=True, blank=True)
    paystack_reference = models.CharField(max_length=200, blank=True,
                             help_text="Paystack transaction reference")
    paystack_sub_code  = models.CharField(max_length=200, blank=True,
                             help_text="Paystack subscription code for recurring billing")
    amount_paid        = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'expires_at']),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.plan.name} ({self.status})"

    @property
    def is_active(self):
        if self.status != 'ACTIVE':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    @property
    def days_remaining(self):
        if not self.expires_at:
            return 0
        return max(0, (self.expires_at - timezone.now()).days)

    def activate(self, reference=''):
        self.status             = 'ACTIVE'
        self.started_at         = timezone.now()
        self.expires_at         = timezone.now() + timedelta(days=self.plan.duration_days)
        self.paystack_reference = reference
        self.save()

    def cancel(self):
        self.status = 'CANCELLED'
        self.save(update_fields=['status', 'updated_at'])


# ══════════════════════════════════════════════════════════════════════════════
# 5. PLATFORM SETTINGS  (singleton — admin controls subscription gate & limits)
# ══════════════════════════════════════════════════════════════════════════════

class PlatformSettings(models.Model):
    """
    Singleton model for global platform configuration.
    Access via PlatformSettings.get() or cache_utils.get_platform_settings().

    Admin workflow:
      - Uncheck subscription_required  → entire platform becomes free instantly
      - Re-check                        → paid mode restored (cache TTL: 5 min)
      - Adjust free_* fields            → free tier limits update without deploy
    """

    # ── Access gate ───────────────────────────────────────────────────────────
    subscription_required = models.BooleanField(
        default=True,
        help_text="Uncheck to make the platform fully free for all users."
    )

    # ── Free tier limits ──────────────────────────────────────────────────────
    free_daily_sessions       = models.PositiveIntegerField(default=5,
        help_text="Daily practice sessions allowed for free users.")
    free_question_limit       = models.PositiveIntegerField(default=15,
        help_text="Max questions per session for free users.")
    free_test_builder_trials  = models.PositiveIntegerField(default=2,
        help_text="Lifetime test builder trials for free teachers.")
    free_lesson_note_slots    = models.PositiveIntegerField(default=5,
        help_text="Unique topic slots for free teachers in lesson notes.")

    # ── Audit ─────────────────────────────────────────────────────────────────
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+'
    )

    class Meta:
        verbose_name = "Platform Settings"

    def __str__(self):
        status = "FREE" if not self.subscription_required else "PAID"
        return f"Platform Settings [{status}]"

    @classmethod
    def get(cls):
        """Always returns the singleton, creating it on first call if needed."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


@receiver(post_save, sender=PlatformSettings)
def on_platform_settings_save(sender, instance, **kwargs):
    """Bust the cache whenever an admin saves platform settings."""
    from catalog.cache_utils import invalidate_platform_settings
    invalidate_platform_settings()


# ══════════════════════════════════════════════════════════════════════════════
# 6. FREE TIER TRACKING  (FreeUsageTracker · FreeTeacherTopicAccess)
# ══════════════════════════════════════════════════════════════════════════════

class FreeUsageTracker(models.Model):
    """
    Tracks free-tier usage limits per user.
    Limits are driven by PlatformSettings, not hardcoded constants.

    Students:  daily session cap, question cap per session
    Teachers:  same daily cap + lifetime test builder trials
    """

    user                     = models.OneToOneField(
                                   settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                   related_name='free_usage'
                               )
    date                     = models.DateField(default=timezone.now)
    session_count            = models.PositiveIntegerField(default=0)
    test_builder_trials_used = models.PositiveIntegerField(default=0)
    updated_at               = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['user'])]

    def __str__(self):
        ps = self._settings()
        return (
            f"{self.user.email} — "
            f"sessions: {self.session_count}/{ps.free_daily_sessions} today, "
            f"trials: {self.test_builder_trials_used}/{ps.free_test_builder_trials}"
        )

    def _settings(self):
        from catalog.cache_utils import get_platform_settings
        return get_platform_settings()

    # ── Daily reset ───────────────────────────────────────────────────────────

    def reset_if_new_day(self):
        today     = timezone.now().date()
        last_date = self.date.date() if hasattr(self.date, 'date') else self.date
        if last_date < today:
            self.session_count = 0
            self.date          = today
            self.save(update_fields=['date', 'session_count', 'updated_at'])

    # ── Practice session checks ───────────────────────────────────────────────

    def can_start_session(self):
        self.reset_if_new_day()
        return self.session_count < self._settings().free_daily_sessions

    def sessions_remaining_today(self):
        self.reset_if_new_day()
        return max(0, self._settings().free_daily_sessions - self.session_count)

    def increment_session(self):
        self.reset_if_new_day()
        self.session_count += 1
        self.save(update_fields=['session_count', 'updated_at'])

    # ── Test builder trial checks (teachers) ──────────────────────────────────

    def can_use_test_builder(self):
        return self.test_builder_trials_used < self._settings().free_test_builder_trials

    def trials_remaining(self):
        return max(0, self._settings().free_test_builder_trials - self.test_builder_trials_used)

    def increment_test_builder_trial(self):
        self.test_builder_trials_used += 1
        self.save(update_fields=['test_builder_trials_used', 'updated_at'])


class FreeTeacherTopicAccess(models.Model):
    """
    Records each unique topic a free-tier teacher has accessed lesson notes for.

    Rules:
    - Free teachers can access notes for up to N distinct topics (N from PlatformSettings)
    - Re-viewing an already-accessed topic does NOT consume another slot
    - Subscribed teachers (TEACHER_PRO) bypass this entirely
    """

    user        = models.ForeignKey(
                      settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                      related_name='free_topic_accesses'
                  )
    topic       = models.ForeignKey(
                      'Topic', on_delete=models.CASCADE,
                      related_name='free_accesses'
                  )
    accessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'topic')
        ordering        = ['accessed_at']

    def __str__(self):
        return f"{self.user.email} → {self.topic.name}"

    # ── Helpers ───────────────────────────────────────────────────────────────

    @classmethod
    def _limit(cls):
        from catalog.cache_utils import get_platform_settings
        return get_platform_settings().free_lesson_note_slots

    @classmethod
    def topics_accessed_count(cls, user):
        return cls.objects.filter(user=user).count()

    @classmethod
    def has_accessed(cls, user, topic):
        return cls.objects.filter(user=user, topic=topic).exists()

    @classmethod
    def slots_remaining(cls, user):
        return max(0, cls._limit() - cls.topics_accessed_count(user))

    @classmethod
    def can_access(cls, user, topic):
        """Returns (allowed: bool, reason: str)."""
        if cls.has_accessed(user, topic):
            return True, ''
        if cls.slots_remaining(user) > 0:
            return True, ''
        return False, (
            f"You have reached the free limit of {cls._limit()} lesson note topics. "
            f"Upgrade to Teacher Pro for unlimited access."
        )

    @classmethod
    def record_access(cls, user, topic):
        """Safe to call multiple times. Returns True if a new slot was consumed."""
        _, created = cls.objects.get_or_create(user=user, topic=topic)
        return created


# ══════════════════════════════════════════════════════════════════════════════
# 7. FEATURE FLAGS
# ══════════════════════════════════════════════════════════════════════════════

class FeatureFlag(models.Model):
    """
    Admin-controlled on/off switches for any platform feature.

    Usage in views:
        @feature_required('lesson_notes')
        def lesson_notes(request): ...

    Usage in templates:
        {% load feature_tags %}
        {% if_feature 'lesson_notes' %} ... {% end_if_feature %}
    """

    ROLE_CHOICES = [
        ('ALL',     'All users'),
        ('STUDENT', 'Students only'),
        ('TEACHER', 'Teachers only'),
    ]

    key         = models.SlugField(unique=True,
                      help_text="Snake_case identifier used in code, e.g. 'lesson_notes'")
    label       = models.CharField(max_length=120,
                      help_text="Human-readable name shown in admin panel")
    description = models.TextField(blank=True,
                      help_text="What this feature does")
    is_enabled  = models.BooleanField(default=True)
    visible_to  = models.CharField(max_length=10, choices=ROLE_CHOICES, default='ALL',
                      help_text="Which role this flag gates.")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['label']

    def __str__(self):
        status = '✅' if self.is_enabled else '❌'
        return f"{status} {self.label} ({self.key})"


INITIAL_FLAGS = [
    {
        'key': 'referral_leaderboard', 'label': 'Referral Leaderboard',
        'description': 'Shows public referral leaderboard on the referrals page.',
        'is_enabled': False, 'visible_to': 'STUDENT',
    },
    {
        'key': 'test_builder_random', 'label': 'Test Builder — Random Mode',
        'description': 'Random/filter question generation.',
        'is_enabled': True, 'visible_to': 'TEACHER',
    },
    {
        'key': 'test_builder_manual', 'label': 'Test Builder — Manual Mode',
        'description': 'Manual step-by-step question selection.',
        'is_enabled': True, 'visible_to': 'TEACHER',
    },
    {
        'key': 'lesson_notes', 'label': 'Lesson Notes',
        'description': 'Allows teachers to browse and download lesson notes, '
                       'and students to receive topic recommendations.',
        'is_enabled': True, 'visible_to': 'ALL',
    },
    {
        'key': 'ai_lesson_notes', 'label': 'AI-Generated Lesson Notes',
        'description': 'When no PDF exists for a topic, offer AI-generated notes '
                       'as a fallback. Teachers must accept before content is shown.',
        'is_enabled': True, 'visible_to': 'TEACHER',
    },
    {
        'key': 'practice', 'label': 'Practice / CBT',
        'description': 'Student practice sessions and exam simulation.',
        'is_enabled': True, 'visible_to': 'STUDENT',
    },
    {
        'key': 'analytics', 'label': 'Analytics & Progress',
        'description': 'Student analytics dashboard with charts.',
        'is_enabled': True, 'visible_to': 'STUDENT',
    },
    {
        'key': 'leaderboard', 'label': 'Leaderboard',
        'description': 'Public student leaderboard.',
        'is_enabled': True, 'visible_to': 'STUDENT',
    },
    {
        'key': 'bookmarks', 'label': 'Bookmarks',
        'description': 'Students can bookmark questions for later revision.',
        'is_enabled': True, 'visible_to': 'STUDENT',
    },
    {
        'key': 'referral', 'label': 'Referral Programme',
        'description': 'Student referral links and rewards.',
        'is_enabled': True, 'visible_to': 'STUDENT',
    },
    {
        'key': 'test_builder', 'label': 'Test Builder',
        'description': 'React-based teacher tool to build custom question sets.',
        'is_enabled': True, 'visible_to': 'TEACHER',
    },
    {
        'key': 'docx_upload', 'label': 'DOCX Question Upload',
        'description': 'Admin tool to bulk-import questions from Word documents.',
        'is_enabled': True, 'visible_to': 'TEACHER',
    },
    {
        'key': 'csv_upload', 'label': 'CSV Question Upload',
        'description': 'Admin tool to bulk-import questions from CSV files.',
        'is_enabled': True, 'visible_to': 'TEACHER',
    },
]


def _seed_flags():
    """
    Populate initial feature flags. Safe to call multiple times.

    python manage.py shell -c "from catalog.models import _seed_flags; _seed_flags()"
    """
    for flag_data in INITIAL_FLAGS:
        FeatureFlag.objects.get_or_create(key=flag_data['key'], defaults=flag_data)
    print(f"✅ {len(INITIAL_FLAGS)} feature flags seeded.")


# ══════════════════════════════════════════════════════════════════════════════
# 8. SUBSCRIPTION PLANS SEED DATA
# ══════════════════════════════════════════════════════════════════════════════

INITIAL_PLANS = [
    # ── Student Basic ─────────────────────────────────────────────────────────
    {
        'plan_type': 'STUDENT_BASIC', 'duration': 'MONTHLY',
        'name': 'Student Basic — Monthly', 'price': 3000, 'is_active': True,
        'description': 'Full access to all student features for one month.',
        'features': 'Unlimited practice sessions,Full analytics & weak topic insights,'
                    'Lesson notes access,AI-generated notes,Priority support',
    },
    {
        'plan_type': 'STUDENT_BASIC', 'duration': 'TERMLY',
        'name': 'Student Basic — Termly', 'price': 7000, 'is_active': False,
        'description': 'Full access for a full school term (3 months). Save ₦2,000.',
        'features': 'Unlimited practice sessions,Full analytics & weak topic insights,'
                    'Lesson notes access,AI-generated notes,Priority support',
    },
    {
        'plan_type': 'STUDENT_BASIC', 'duration': 'YEARLY',
        'name': 'Student Basic — Yearly', 'price': 27000, 'is_active': False,
        'description': 'Best value — full access for a whole year. Save ₦9,000.',
        'features': 'Unlimited practice sessions,Full analytics & weak topic insights,'
                    'Lesson notes access,AI-generated notes,Priority support',
    },
    # ── Teacher Pro ───────────────────────────────────────────────────────────
    {
        'plan_type': 'TEACHER_PRO', 'duration': 'MONTHLY',
        'name': 'Teacher Pro — Monthly', 'price': 5000, 'is_active': True,
        'description': 'Full teacher portal access for one month.',
        'features': 'Test builder,DOCX & CSV question upload,'
                    'Student performance dashboard,Lesson note management,'
                    'AI-generated lesson notes,Priority support',
    },
    {
        'plan_type': 'TEACHER_PRO', 'duration': 'TERMLY',
        'name': 'Teacher Pro — Termly', 'price': 10000, 'is_active': False,
        'description': 'Full teacher portal access for a full term. Save ₦5,000.',
        'features': 'Test builder,DOCX & CSV question upload,'
                    'Student performance dashboard,Lesson note management,'
                    'AI-generated lesson notes,Priority support',
    },
    {
        'plan_type': 'TEACHER_PRO', 'duration': 'YEARLY',
        'name': 'Teacher Pro — Yearly', 'price': 45000, 'is_active': False,
        'description': 'Best value for teachers — full access for a whole year. Save ₦15,000.',
        'features': 'Test builder,DOCX & CSV question upload,'
                    'Student performance dashboard,Lesson note management,'
                    'AI-generated lesson notes,Priority support',
    },
]


# ══════════════════════════════════════════════════════════════════════════════
# 9. TEST BUILDER  (SavedTest · SavedTestQuestion)
# ══════════════════════════════════════════════════════════════════════════════

class SavedTest(models.Model):
    FORMAT_CHOICES = [('pdf', 'PDF'), ('docx', 'Word')]
    COPY_CHOICES   = [('student', 'Student'), ('teacher', 'Teacher')]
    MODE_CHOICES   = [('manual', 'Manual'), ('random', 'Random')]

    teacher        = models.ForeignKey(
                         settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                         related_name='saved_tests'
                     )
    title          = models.CharField(max_length=255)
    questions      = models.ManyToManyField('Question', through='SavedTestQuestion')
    format         = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    copy_type      = models.CharField(max_length=10, choices=COPY_CHOICES, default='student')
    builder_mode   = models.CharField(max_length=10, choices=MODE_CHOICES, default='manual')
    question_count = models.PositiveIntegerField(default=0)
    total_marks    = models.PositiveIntegerField(default=0)
    cloned_from    = models.ForeignKey(
                         'self', null=True, blank=True,
                         on_delete=models.SET_NULL, related_name='clones'
                     )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({self.teacher.email})"


class SavedTestQuestion(models.Model):
    saved_test   = models.ForeignKey(SavedTest, on_delete=models.CASCADE, related_name='test_questions')
    question     = models.ForeignKey('Question', on_delete=models.CASCADE, related_name='saved_in_tests')
    custom_marks = models.PositiveIntegerField(default=1)
    order        = models.PositiveIntegerField(default=0)

    class Meta:
        ordering        = ['order']
        unique_together = ['saved_test', 'question']

    def __str__(self):
        return f"{self.saved_test.title} → Q{self.question.question_number}"
