from django.db import models
from catalog.models import Subject, ExamSeries, Question, Choice
# Create your models here.
from django.contrib.auth import get_user_model

User = get_user_model()

class PracticeSession(models.Model):
    """Represents one sitting/attempt by a student"""

    SESSION_TYPES = [
        ('EXAM', 'Full Exam Practice'),
        ('TOPIC', 'Topic Practice'),
        ('CUSTOM', 'Custom Selection'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='practice_sessions')
    session_type = models.CharField(max_length=10, choices=SESSION_TYPES, default='EXAM')
    exam_series = models.ForeignKey(
        ExamSeries, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='practice_sessions'
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='practice_sessions'
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveIntegerField(null=True, blank=True)
    total_marks = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'completed_at']),  # dashboard queries
            models.Index(fields=['user', 'subject']),        # analytics queries
            models.Index(fields=['completed_at']),           # admin recent sessions
        ]

    @property
    def is_completed(self):
        return self.completed_at is not None

    @property
    def score_percentage(self):
        if self.score is not None and self.total_marks:
            return round((self.score / self.total_marks) * 100, 1)
        return None

    def __str__(self):
        return f"{self.user} — {self.subject} — {self.started_at.strftime('%Y-%m-%d %H:%M')}"


class UserAnswer(models.Model):
    """Records a student's answer to a single question within a session"""
    session = models.ForeignKey(
        PracticeSession, on_delete=models.CASCADE, related_name='answers'
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='user_answers')
    selected_choice = models.ForeignKey(
        Choice, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='user_answers',
        help_text="For objective questions"
    )
    theory_response = models.TextField(
        null=True, blank=True,
        help_text="For theory questions"
    )
    is_correct = models.BooleanField(null=True, blank=True)  # null for unevaluated theory answers
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'question')
        indexes = [
                models.Index(fields=['session', 'question']),    # results page
                models.Index(fields=['is_correct']),             # analytics
            ]

    def __str__(self):
        return f"{self.session.user} — {self.question} — Session {self.session.id}"

# Bookmark — user saves a question
class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'question')

    def __str__(self):
        return f"{self.user} — {self.question}"