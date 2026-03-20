from django.contrib import admin
from catalog.models import Worksheet
from .models import Subject, Topic, ExamBoard, ExamSeries, Question, Choice, TheoryAnswer

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