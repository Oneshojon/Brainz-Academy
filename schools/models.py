"""
contact/models.py

Stores Contact Us submissions for the general Inquiry / Suggestion /
Complaint track. The "Work With the Developer" card on the same page is
static (direct email/LinkedIn/X links) and has no model — nothing to store.
"""

import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


# ══════════════════════════════════════════════════════════════════════════
# Core school & staff
# ══════════════════════════════════════════════════════════════════════════

class School(models.Model):
    """A single school account. The root of every other model in this app."""

    STATUS_CHOICES = [
        ('PENDING_PAYMENT', 'Pending Payment'),
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
    ]

    name = models.CharField(max_length=200)
    state = models.CharField(max_length=100, help_text="Nigerian state the school is located in.")
    contact_email = models.EmailField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_PAYMENT')
    # Set to the CustomUser who filled the self-service registration form.
    # SET_NULL (not CASCADE) — a school must never disappear because the
    # account that registered it was later deleted.
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='schools_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.name} ({self.status})"

    @property
    def is_active(self):
        return self.status == 'ACTIVE'


class SchoolPlan(models.Model):
    """
    A purchasable School Plan tier. Deliberately separate from
    catalog.SubscriptionPlan — see module docstring.
    """

    DURATION_CHOICES = [
        ('TERMLY', 'Termly (3 months)'),
        ('YEARLY', 'Yearly'),
    ]

    name = models.CharField(max_length=100, help_text="Display name e.g. 'School Basic — Termly'")
    duration = models.CharField(max_length=10, choices=DURATION_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price in Naira (NGN)")
    seat_limit = models.PositiveIntegerField(help_text="Max combined staff + student accounts under this plan.")
    description = models.TextField(blank=True, help_text="Shown on the school pricing page")
    features = models.TextField(blank=True, help_text="Comma-separated list of features")
    is_active = models.BooleanField(default=True, help_text="Inactive plans are hidden from the pricing page")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('name', 'duration')
        ordering = ['price']

    def __str__(self):
        return f"{self.name} — ₦{self.price}"

    @property
    def duration_days(self):
        """Mirrors catalog.SubscriptionPlan.duration_days exactly (30/90/365)."""
        return {'TERMLY': 90, 'YEARLY': 365}.get(self.duration, 90)

    @property
    def features_list(self):
        return [f.strip() for f in self.features.split(',') if f.strip()]


class SchoolSubscription(models.Model):
    """
    Org-level mirror of catalog.UserSubscription. Same is_active /
    days_remaining / activate() / cancel() shape — see module docstring.
    """

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
        ('PENDING', 'Pending Payment'),
    ]

    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SchoolPlan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    started_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    paystack_reference = models.CharField(max_length=200, blank=True,
                                           help_text="Paystack transaction reference")
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', 'status']),
            models.Index(fields=['status', 'expires_at']),
        ]

    def __str__(self):
        return f"{self.school.name} — {self.plan.name} ({self.status})"

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
        self.status = 'ACTIVE'
        self.started_at = timezone.now()
        self.expires_at = timezone.now() + timedelta(days=self.plan.duration_days)
        self.paystack_reference = reference
        self.save()

    def cancel(self):
        self.status = 'CANCELLED'
        self.save()


class SchoolStaff(models.Model):
    """
    Links a CustomUser to exactly one School (OneToOne — see planning doc:
    multi-school staff use a second account, cheap to loosen to FK later
    if real demand appears).

    school_role is the broad ADMIN/TEACHER split used for permission
    checks. position is an optional named responsibility layered on top
    (Principal, VP, Exam Officer) — a person can hold a position AND be a
    cohort's class_teacher AND have school_role=TEACHER all at once, e.g.
    a Vice Principal who still teaches. Nothing here blocks that
    combination; it's expected, not an edge case.
    """

    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('TEACHER', 'Teacher'),
    ]

    POSITION_CHOICES = [
        ('PRINCIPAL', 'Principal'),
        ('VICE_PRINCIPAL', 'Vice Principal'),
        ('EXAM_OFFICER', 'Exam Officer'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='school_staff_profile',
    )
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='staff')
    school_role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, null=True, blank=True)
    is_active = models.BooleanField(default=True, help_text="False when staff has been removed from the school.")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['school', 'user__last_name']
        indexes = [
            models.Index(fields=['school', 'school_role']),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.school.name} ({self.get_school_role_display()})"

    @property
    def is_school_admin(self):
        return self.school_role == 'ADMIN'


# ══════════════════════════════════════════════════════════════════════════
# Academic structure
# ══════════════════════════════════════════════════════════════════════════

class AcademicTerm(models.Model):
    """A school-scoped term, e.g. '2026 Third Term'. Anchors everything below."""

    TERM_CHOICES = [
        ('FIRST', 'First Term'),
        ('SECOND', 'Second Term'),
        ('THIRD', 'Third Term'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='academic_terms')
    term = models.CharField(max_length=10, choices=TERM_CHOICES)
    year = models.PositiveIntegerField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    # Exactly one current term per school is expected, but not enforced at
    # the DB level (a brief overlap during term rollover is harmless and
    # easier to fix from the admin than to migrate around).
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ['-year', 'term']
        unique_together = ('school', 'term', 'year')
        indexes = [
            models.Index(fields=['school', 'is_current']),
        ]

    def __str__(self):
        return f"{self.school.name} — {self.get_term_display()} {self.year}"


class Cohort(models.Model):
    """
    A school-defined class/arm for one term, e.g. 'SS2 Gold'.

    `level` and `name` are kept separate on purpose: `level` (SS2) lets
    admins/teachers target or filter "all of SS2" across every arm, while
    `name` (SS2 Gold) is the specific arm students actually enroll in.
    """

    LEVEL_CHOICES = [
        ('JSS1', 'JSS1'), ('JSS2', 'JSS2'), ('JSS3', 'JSS3'),
        ('SS1', 'SS1'), ('SS2', 'SS2'), ('SS3', 'SS3'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='cohorts')
    academic_term = models.ForeignKey(AcademicTerm, on_delete=models.CASCADE, related_name='cohorts')
    name = models.CharField(max_length=100, help_text="Full arm name, e.g. 'SS2 Gold'")
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    # Per-cohort responsibility, not a global role — a class teacher is
    # scoped to exactly this cohort for exactly this term.
    class_teacher = models.ForeignKey(
        SchoolStaff, on_delete=models.SET_NULL, null=True, blank=True, related_name='cohorts_led',
    )

    class Meta:
        ordering = ['level', 'name']
        unique_together = ('academic_term', 'name')
        indexes = [
            models.Index(fields=['school', 'academic_term']),
            models.Index(fields=['school', 'level']),
        ]

    def __str__(self):
        return f"{self.name} ({self.academic_term})"


class ClassGroup(models.Model):
    """
    A teacher + subject + cohort pairing, e.g. "Mrs. Adeyemi's SS2 Gold
    Mathematics". This is the unit the Timetable Builder will hang slots
    off later, and what ClassEnrollment attaches students to.

    One ClassGroup per (cohort, subject) — v1 assumes a single teacher
    per subject per cohort. Co-teaching the same subject/cohort pair is a
    v2 concern if it comes up in practice.
    """

    teacher = models.ForeignKey(
        SchoolStaff, on_delete=models.SET_NULL, null=True, blank=True, related_name='class_groups',
    )
    subject = models.ForeignKey('catalog.Subject', on_delete=models.PROTECT, related_name='school_class_groups')
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='class_groups')

    class Meta:
        ordering = ['cohort', 'subject']
        unique_together = ('cohort', 'subject')

    def __str__(self):
        teacher_name = self.teacher.user.get_full_name() if self.teacher else 'Unassigned'
        return f"{self.cohort.name} {self.subject.name} — {teacher_name}"


# ══════════════════════════════════════════════════════════════════════════
# Enrollment
# ══════════════════════════════════════════════════════════════════════════

class CohortEnrollment(models.Model):
    """A student's membership of a Cohort for that cohort's term."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cohort_enrollments',
    )
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='enrollments')
    is_active = models.BooleanField(default=True, help_text="False if the student transferred or withdrew.")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-enrolled_at']
        unique_together = ('student', 'cohort')
        indexes = [
            models.Index(fields=['cohort', 'is_active']),
        ]

    def __str__(self):
        return f"{self.student.email} in {self.cohort.name}"


class ClassEnrollment(models.Model):
    """
    A student's membership of one ClassGroup, e.g. "in Mrs. Adeyemi's SS2
    Gold Maths". Cohort is reachable via class_group.cohort — never
    duplicated here, so it can't drift out of sync with CohortEnrollment.
    """

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='class_enrollments',
    )
    class_group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-enrolled_at']
        unique_together = ('student', 'class_group')

    def __str__(self):
        return f"{self.student.email} in {self.class_group}"


# ══════════════════════════════════════════════════════════════════════════
# Invites & communication
# ══════════════════════════════════════════════════════════════════════════

class SchoolInvite(models.Model):
    """
    A single model covering both admin→teacher and teacher→student
    invites, distinguished by `role` with an optional `class_group` scope
    (set for student invites targeting one specific class; left blank for
    school-wide teacher/admin invites).
    """

    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('TEACHER', 'Teacher'),
        ('STUDENT', 'Student'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='invites')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    class_group = models.ForeignKey(
        ClassGroup, on_delete=models.CASCADE, null=True, blank=True, related_name='invites',
        help_text="Set for STUDENT invites scoped to one class. Blank for school-wide invites.",
    )
    token = models.CharField(max_length=64, unique=True, editable=False)
    max_uses = models.PositiveIntegerField(default=1)
    uses_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='school_invites_sent',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', 'role']),
        ]

    def __str__(self):
        return f"{self.school.name} invite — {self.role} ({self.uses_count}/{self.max_uses})"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        if self.uses_count >= self.max_uses:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True

    def redeem(self):
        """Atomically increment uses_count. Caller is responsible for the
        surrounding is_valid check and the actual account creation."""
        self.uses_count = models.F('uses_count') + 1
        self.save(update_fields=['uses_count'])
        self.refresh_from_db(fields=['uses_count'])


class SchoolMemo(models.Model):
    """
    A school announcement. Approved timetables auto-post here once the
    Timetable Builder ships (v2) — this model is already shaped to
    support that without changes.
    """

    AUDIENCE_CHOICES = [
        ('ALL', 'Entire School'),
        ('ROLE', 'By Role'),
        ('COHORT', 'By Cohort'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='memos')
    title = models.CharField(max_length=200)
    body = models.TextField()
    audience = models.CharField(max_length=10, choices=AUDIENCE_CHOICES, default='ALL')
    # Populated only when audience='ROLE' / 'COHORT' respectively.
    target_role = models.CharField(max_length=10, choices=SchoolStaff.ROLE_CHOICES, blank=True)
    target_cohort = models.ForeignKey(
        Cohort, on_delete=models.CASCADE, null=True, blank=True, related_name='memos',
    )
    pinned = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='school_memos_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-pinned', '-published_at', '-created_at']
        indexes = [
            models.Index(fields=['school', 'is_published', '-published_at']),
        ]

    def __str__(self):
        return f"{self.school.name} — {self.title}"

    def publish(self):
        self.is_published = True
        self.published_at = timezone.now()
        self.save(update_fields=['is_published', 'published_at'])