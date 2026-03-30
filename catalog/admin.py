from django.contrib import admin
from catalog.models import Worksheet, LessonNote, FeatureFlag, SubscriptionPlan, UserSubscription
from .models import Subject, Topic, ExamBoard, ExamSeries, Question, Choice, TheoryAnswer
from catalog.models import PastPaper


@admin.register(PastPaper)
class PastPaperAdmin(admin.ModelAdmin):
    list_display  = ['exam_series', 'paper_type', 'has_questions', 'has_answers', 'has_video', 'updated_at']
    list_filter   = ['paper_type', 'exam_series__exam_board', 'exam_series__year']
    search_fields = ['exam_series__subject__name']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject')
    list_filter = ('subject',)
    search_fields = ('name',)
    ordering = ('subject', 'name')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Worksheet)
class WorksheetAdmin(admin.ModelAdmin):
    list_display = ['topic', 'title', 'is_ai_generated', 'updated_at']
    list_filter  = ['is_ai_generated', 'topic__subject']
    search_fields = ['title', 'topic__name']


@admin.register(LessonNote)
class LessonNoteAdmin(admin.ModelAdmin):
    list_display  = ['topic', 'title', 'is_ai_generated', 'video_url', 'updated_at']
    list_filter   = ['is_ai_generated', 'topic__subject']
    search_fields = ['title', 'topic__name']


@admin.register(ExamBoard)
class ExamBoardAdmin(admin.ModelAdmin):
    list_display = ['name', 'abbreviation']


@admin.register(ExamSeries)
class ExamSeriesAdmin(admin.ModelAdmin):
    list_display = ['exam_board', 'subject', 'year', 'sitting']
    list_filter  = ['exam_board', 'subject', 'year']
    search_fields = ['subject__name']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display  = ['question_number', 'subject', 'question_type', 'difficulty', 'exam_series']
    list_filter   = ['subject', 'question_type', 'difficulty', 'exam_series__exam_board']
    search_fields = ['content']


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ['question', 'label', 'is_correct']
    list_filter  = ['is_correct']


@admin.register(TheoryAnswer)
class TheoryAnswerAdmin(admin.ModelAdmin):
    list_display = ['question']
    search_fields = ['content']


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ['label', 'key', 'is_enabled', 'visible_to', 'updated_at']
    list_filter  = ['is_enabled', 'visible_to']


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'duration', 'price', 'is_active']
    list_filter  = ['plan_type', 'duration', 'is_active']


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'started_at', 'expires_at']
    list_filter  = ['status', 'plan']
    search_fields = ['user__email']