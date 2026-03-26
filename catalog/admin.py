from django.contrib import admin
from catalog.models import Worksheet, LessonNote
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