"""
schools/serializers.py

DRF serializers for the School Plan self-service registration flow.
Every serializer touching a relation has its matching select_related
applied in the view — see schools/views.py.
"""

from rest_framework import serializers

from .models import (
    AcademicTerm,
    ClassGroup,
    Cohort,
    School,
    SchoolInvite,
    SchoolPlan,
    SchoolStaff,
)


class SchoolPlanSerializer(serializers.ModelSerializer):
    """Public-facing plan listing for the registration/pricing page."""

    features_list = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = SchoolPlan
        fields = ['id', 'name', 'duration', 'price', 'seat_limit', 'description', 'features_list']


class SchoolRegistrationSerializer(serializers.ModelSerializer):
    """
    Input serializer for POST /schools/register/.

    Only validates shape and the "not already staff somewhere" rule — the
    actual School/SchoolStaff/SchoolSubscription creation and the Paystack
    call are side effects that belong in the view, not here.
    """

    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=SchoolPlan.objects.filter(is_active=True),
        source='plan',
        write_only=True,
        help_text="ID of an active SchoolPlan.",
    )

    class Meta:
        model = School
        fields = ['name', 'state', 'contact_email', 'plan_id']

    def validate(self, attrs):
        # SchoolStaff is OneToOne to CustomUser — see planning doc: multi-school
        # staff use a second account, this is not something to work around here.
        user = self.context['request'].user
        if hasattr(user, 'school_staff_profile'):
            raise serializers.ValidationError(
                "You're already part of a school. Contact support if you need to register another."
            )
        return attrs


# ══════════════════════════════════════════════════════════════════════════
# Admin-management serializers
#
# Every one of these is used exclusively behind IsSchoolAdmin (see
# schools/permissions.py) and every FK field is cross-checked against the
# requesting admin's own school in validate_<field> — a school admin can
# never point a Cohort at another school's AcademicTerm, or a ClassGroup
# at another school's staff, even by guessing a valid ID.
# ══════════════════════════════════════════════════════════════════════════

class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ['id', 'term', 'year', 'start_date', 'end_date', 'is_current']

    def validate(self, attrs):
        # unique_together = (school, term, year) — surfaced here as a clean
        # 400 instead of a raw IntegrityError bubbling up as a 500.
        school = self.context['request'].user.school_staff_profile.school
        term = attrs.get('term', getattr(self.instance, 'term', None))
        year = attrs.get('year', getattr(self.instance, 'year', None))
        qs = AcademicTerm.objects.filter(school=school, term=term, year=year)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"{school.name} already has a term for {term.title() if term else term} {year}."
            )
        return attrs


class CohortSerializer(serializers.ModelSerializer):
    class_teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Cohort
        fields = ['id', 'name', 'level', 'academic_term', 'class_teacher', 'class_teacher_name']

    def get_class_teacher_name(self, obj):
        # class_teacher__user must be select_related in the view, or this
        # is an N+1 per row of the list serializer.
        return obj.class_teacher.user.get_full_name() if obj.class_teacher else None

    def validate_academic_term(self, value):
        school = self.context['request'].user.school_staff_profile.school
        if value.school_id != school.id:
            raise serializers.ValidationError("That term does not belong to your school.")
        return value

    def validate_class_teacher(self, value):
        if value is None:
            return value
        school = self.context['request'].user.school_staff_profile.school
        if value.school_id != school.id:
            raise serializers.ValidationError("That staff member does not belong to your school.")
        return value


class SchoolStaffSerializer(serializers.ModelSerializer):
    """Read-only staff roster. Role/position changes go through a dedicated
    action, not a blanket PATCH, to keep audit intent explicit — not built
    yet, flagged for a follow-up phase."""

    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = SchoolStaff
        fields = ['id', 'email', 'full_name', 'school_role', 'position', 'is_active', 'joined_at']
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.user.get_full_name()


class SchoolInviteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolInvite
        fields = ['id', 'role', 'class_group', 'max_uses', 'expires_at', 'token']
        read_only_fields = ['id', 'token']

    def validate_class_group(self, value):
        if value is None:
            return value
        school = self.context['request'].user.school_staff_profile.school
        if value.cohort.school_id != school.id:
            raise serializers.ValidationError("That class does not belong to your school.")
        return value

    def validate(self, attrs):
        if attrs.get('role') != 'STUDENT' and attrs.get('class_group'):
            raise serializers.ValidationError({
                'class_group': "class_group can only be set on STUDENT invites."
            })
        return attrs


class SchoolInviteRedeemSerializer(serializers.Serializer):
    """Plain (non-model) serializer — redemption takes a token, nothing else."""
    token = serializers.CharField()


class ClassGroupSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)

    class Meta:
        model = ClassGroup
        fields = ['id', 'teacher', 'teacher_name', 'subject', 'subject_name', 'cohort', 'cohort_name']

    def get_teacher_name(self, obj):
        return obj.teacher.user.get_full_name() if obj.teacher else None

    def validate_cohort(self, value):
        school = self.context['request'].user.school_staff_profile.school
        if value.school_id != school.id:
            raise serializers.ValidationError("That cohort does not belong to your school.")
        return value

    def validate_teacher(self, value):
        if value is None:
            return value
        school = self.context['request'].user.school_staff_profile.school
        if value.school_id != school.id:
            raise serializers.ValidationError("That teacher does not belong to your school.")
        return value