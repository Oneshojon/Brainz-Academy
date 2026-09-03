from rest_framework import serializers
from catalog.models import LessonPlan


class LessonPlanListSerializer(serializers.ModelSerializer):
    """Lightweight — used by the list view."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    short_title  = serializers.CharField(read_only=True)

    class Meta:
        model = LessonPlan
        fields = [
            'id', 'subject_name', 'short_title', 'curriculum', 'class_level',
            'student_ability', 'duration_minutes', 'is_generated',
            'created_at', 'updated_at',
        ]


class LessonPlanDetailSerializer(serializers.ModelSerializer):
    """Full record — used when opening a single plan."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    short_title  = serializers.CharField(read_only=True)

    class Meta:
        model = LessonPlan
        fields = [
            'id', 'subject', 'subject_name', 'curriculum', 'class_level',
            'coverage', 'duration_minutes', 'class_size', 'student_ability',
            'additional_notes', 'objectives', 'activities', 'timing_breakdown',
            'assessment', 'is_generated', 'short_title', 'created_at', 'updated_at',
        ]
        read_only_fields = ['objectives', 'activities', 'timing_breakdown', 'assessment', 'is_generated']


class LessonPlanCreateSerializer(serializers.ModelSerializer):
    """Input-only. `teacher` is set from request.user in the view, never trusted from the payload."""

    class Meta:
        model = LessonPlan
        fields = [
            'subject', 'curriculum', 'class_level', 'coverage',
            'duration_minutes', 'class_size', 'student_ability', 'additional_notes',
        ]

    def validate_duration_minutes(self, value):
        if value <= 0 or value > 300:
            raise serializers.ValidationError("Duration must be between 1 and 300 minutes.")
        return value

    def validate_coverage(self, value):
        if not value.strip():
            raise serializers.ValidationError("Coverage cannot be empty.")
        return value.strip()