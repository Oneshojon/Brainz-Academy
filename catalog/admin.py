from django.contrib import admin
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