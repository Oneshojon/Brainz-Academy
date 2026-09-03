"""
schools/admin.py

Django admin registrations for the School Plan foundation models.
Every ModelAdmin with a FK column sets list_select_related to avoid an
N+1 query per row of the changelist — same convention as
contact/admin.py.
"""

from django.contrib import admin
from django.db.models import Count, Q

from .models import (
    AcademicTerm,
    Cohort,
    ClassEnrollment,
    ClassGroup,
    CohortEnrollment,
    School,
    SchoolFeatureAccess,
    SchoolInvite,
    SchoolMemo,
    SchoolPlan,
    SchoolStaff,
    SchoolSubscription,
)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'state', 'status', 'contact_email', 'created_at')
    list_filter = ('status', 'state')
    search_fields = ('name', 'contact_email')
    # created_by is the only FK rendered in the changelist.
    list_select_related = ('created_by',)
    date_hierarchy = 'created_at'
    actions = ['mark_active', 'mark_suspended']

    @admin.action(description='Mark selected schools as Active')
    def mark_active(self, request, queryset):
        updated = queryset.update(status=School.STATUS_CHOICES[1][0])
        self.message_user(request, f'{updated} school(s) marked as Active.')

    @admin.action(description='Mark selected schools as Suspended')
    def mark_suspended(self, request, queryset):
        updated = queryset.update(status=School.STATUS_CHOICES[2][0])
        self.message_user(request, f'{updated} school(s) marked as Suspended.')


@admin.register(SchoolPlan)
class SchoolPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration', 'price', 'seat_limit', 'is_active')
    list_filter = ('duration', 'is_active')
    search_fields = ('name',)


@admin.register(SchoolSubscription)
class SchoolSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('school', 'plan', 'status', 'expires_at', 'amount_paid')
    list_filter = ('status',)
    search_fields = ('school__name', 'paystack_reference')
    # school and plan are both rendered per row — one join each, avoided per row.
    list_select_related = ('school', 'plan')
    date_hierarchy = 'created_at'


@admin.register(SchoolFeatureAccess)
class SchoolFeatureAccessAdmin(admin.ModelAdmin):
    """
    Per-school AI feature grant. `active_seat_count` is shown alongside the
    pricing fields so the admin has the school's actual size as context
    when setting/adjusting `quoted_price` — per the locked decision, pricing
    here is manual/discussion-driven, not an auto-computed formula; this
    column exists purely as reference, not as an input.
    """
    list_display = (
        'school', 'feature', 'status', 'quoted_price',
        'active_seat_count', 'trial_expires_at', 'paid_until',
    )
    list_filter = ('status', 'feature')
    search_fields = ('school__name', 'feature__label', 'feature__key')
    # school and feature are both rendered per row — one join each, avoided per row.
    list_select_related = ('school', 'feature')
    date_hierarchy = 'updated_at'

    def get_queryset(self, request):
        # Annotate active staff count once here instead of a per-row query
        # in active_seat_count() below.
        return super().get_queryset(request).annotate(
            _active_seat_count=Count('school__staff', filter=Q(school__staff__is_active=True))
        )

    @admin.display(description='Active seats', ordering='_active_seat_count')
    def active_seat_count(self, obj):
        return obj._active_seat_count


@admin.register(SchoolStaff)
class SchoolStaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'school', 'school_role', 'position', 'is_active')
    list_filter = ('school_role', 'position', 'is_active', 'school')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'school__name')
    list_select_related = ('user', 'school')


@admin.register(AcademicTerm)
class AcademicTermAdmin(admin.ModelAdmin):
    list_display = ('school', 'term', 'year', 'is_current')
    list_filter = ('term', 'year', 'is_current')
    search_fields = ('school__name',)
    list_select_related = ('school',)


@admin.register(Cohort)
class CohortAdmin(admin.ModelAdmin):
    list_display = ('name', 'level', 'school', 'academic_term', 'class_teacher')
    list_filter = ('level', 'school')
    search_fields = ('name', 'school__name')
    # class_teacher rendered per row → also select_related its user for __str__.
    list_select_related = ('school', 'academic_term', 'class_teacher__user')


@admin.register(ClassGroup)
class ClassGroupAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'cohort', 'subject', 'teacher')
    list_filter = ('cohort__school', 'subject')
    search_fields = ('cohort__name', 'subject__name')
    list_select_related = ('cohort', 'subject', 'teacher__user')


@admin.register(CohortEnrollment)
class CohortEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'cohort', 'is_active', 'enrolled_at')
    list_filter = ('is_active', 'cohort__school')
    search_fields = ('student__email', 'cohort__name')
    list_select_related = ('student', 'cohort')
    date_hierarchy = 'enrolled_at'


@admin.register(ClassEnrollment)
class ClassEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_group', 'enrolled_at')
    list_filter = ('class_group__cohort__school',)
    search_fields = ('student__email',)
    list_select_related = ('student', 'class_group', 'class_group__cohort', 'class_group__subject')
    date_hierarchy = 'enrolled_at'


@admin.register(SchoolInvite)
class SchoolInviteAdmin(admin.ModelAdmin):
    list_display = ('school', 'role', 'class_group', 'uses_count', 'max_uses', 'expires_at')
    list_filter = ('role', 'school')
    search_fields = ('school__name', 'token')
    readonly_fields = ('token', 'uses_count')
    list_select_related = ('school', 'class_group')
    date_hierarchy = 'created_at'


@admin.register(SchoolMemo)
class SchoolMemoAdmin(admin.ModelAdmin):
    list_display = ('title', 'school', 'audience', 'pinned', 'is_published', 'published_at')
    list_filter = ('audience', 'pinned', 'is_published', 'school')
    search_fields = ('title', 'body', 'school__name')
    list_select_related = ('school', 'target_cohort', 'created_by')
    actions = ['publish_memos']

    @admin.action(description='Publish selected memos')
    def publish_memos(self, request, queryset):
        count = 0
        for memo in queryset.filter(is_published=False):
            memo.publish()
            count += 1
        self.message_user(request, f'{count} memo(s) published.')