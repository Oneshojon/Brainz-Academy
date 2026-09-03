from django.contrib import admin
from catalog.models import Worksheet, LessonNote, LessonPlan, FeatureFlag, SubscriptionPlan, UserSubscription
from .models import Subject, Theme, Topic, ExamBoard, ExamSeries, Question, Choice, TheoryAnswer
from catalog.models import PastPaper
from catalog.models import PlatformSettings
from catalog.models import AIFeature


@admin.register(PastPaper)
class PastPaperAdmin(admin.ModelAdmin):
    list_display  = ['exam_series', 'paper_type', 'has_questions', 'has_answers', 'has_video', 'updated_at']
    list_filter   = ['paper_type', 'exam_series__exam_board', 'exam_series__year']
    search_fields = ['exam_series__subject__name']

    def _invalidate(self, obj):
        from django.core.cache import cache
        cache.delete_many([
            f'pp:papers_board_{obj.exam_series.exam_board_id}',
            'pp:boards_with_counts',
        ])

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        self._invalidate(obj)

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        self._invalidate(obj)

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject')
    list_filter = ('subject',)
    search_fields = ('name',)
    ordering = ('subject', 'name')


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    """
    Admin for Theme — the grouping layer between Subject and Topic.
    Supports inline ordering via the list_editable `order` field.
    """
    list_display  = ('name', 'subject', 'order', 'topic_count')
    list_filter   = ('subject',)
    search_fields = ('name', 'subject__name')
    ordering      = ('subject', 'order', 'name')
    list_editable = ('order',)

    def topic_count(self, obj):
        """Return the number of topics belonging to this theme."""
        return obj.topics.count()
    topic_count.short_description = 'Topics'
    

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


@admin.register(LessonPlan)
class LessonPlanAdmin(admin.ModelAdmin):
    list_display  = ['short_title', 'teacher', 'subject', 'curriculum', 'class_level', 'is_generated', 'updated_at']
    list_filter   = ['curriculum', 'class_level', 'student_ability', 'is_generated', 'subject']
    search_fields = ['coverage', 'teacher__email', 'subject__name']
    # teacher and subject are both rendered per row — one join each, avoided per row.
    list_select_related = ['teacher', 'subject']
    date_hierarchy = 'created_at'


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
    list_filter   = ['subject', 'question_type', 'exam_series__year', 'difficulty', 'exam_series__exam_board']
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


@admin.register(AIFeature)
class AIFeatureAdmin(admin.ModelAdmin):
    """No FK columns on this model, so no list_select_related needed."""
    list_display = [
        'label', 'key', 'is_ai_powered', 'default_pricing_mode',
        'default_price', 'is_advertised', 'grant_count',
    ]
    list_filter  = ['is_ai_powered', 'default_pricing_mode', 'is_advertised']
    search_fields = ['key', 'label']

    def get_queryset(self, request):
        # Annotate the per-school grant count once here rather than letting
        # grant_count() below issue one query per row on the changelist.
        from django.db.models import Count
        return super().get_queryset(request).annotate(_grant_count=Count('school_grants'))

    @admin.display(description='Schools granted', ordering='_grant_count')
    def grant_count(self, obj):
        return obj._grant_count


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'duration', 'price', 'is_active']
    list_filter  = ['plan_type', 'duration', 'is_active']


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'started_at', 'expires_at']
    list_filter  = ['status', 'plan']
    search_fields = ['user__email']


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("🔓 Access Control", {
            "fields": ("subscription_required",),
            "description": (
                "⚠️ Turning off subscription_required makes the platform completely "
                "free — ALL users get unlimited access immediately (cache clears within 5 min)."
            ),
        }),
        ("Free Tier Limits", {
            "fields": (
                "free_daily_sessions",
                "free_question_limit",
                "free_test_builder_trials",
                "free_lesson_note_slots",
            ),
            "description": "These limits only apply when subscription is required.",
        }),
        ("Audit", {
            "fields": ("updated_at", "updated_by"),
        }),
    )
    readonly_fields = ("updated_at",)

    def has_add_permission(self, request):
        # Only allow creating the singleton if it doesn't exist yet
        return not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Never allow deleting the singleton
        return False

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)