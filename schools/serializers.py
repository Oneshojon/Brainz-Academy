"""
schools/serializers.py

DRF serializers for the School Plan self-service registration flow.
Every serializer touching a relation has its matching select_related
applied in the view — see schools/views.py.
"""

from rest_framework import serializers

from .models import School, SchoolPlan


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