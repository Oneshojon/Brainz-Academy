from django.db import models
from django.contrib.auth import get_user_model
# Create your models here.

User = get_user_model()


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = ('subject', 'name')

    def __str__(self):
        return f"{self.subject.name}: {self.name}"


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

    def __str__(self):
        return f"Answer for {self.question}"