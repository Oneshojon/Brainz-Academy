"""
schools/tests/test_feature_access.py

Tests for catalog.subscription_access.has_ai_feature_access() — the single
additive gating check shared by every AI feature (Lesson Plan Generator
included). Covers the six cases called out in the AI Feature Monetization
planning notes:

  1. Individually-subscribed (TEACHER_PRO) user — existing path, unaffected
  2. School Plan user with an active trial grant
  3. School Plan user with an expired trial grant
  4. School Plan user with an active paid grant
  5. School Plan user with no grant at all for this feature
  6. Non-school, non-subscribed user

Plus a couple of edge cases (inactive staff, inactive school) that the
planning notes implied but didn't enumerate explicitly.
"""

import pytest
from datetime import timedelta
from django.utils import timezone

from tests.conftest import AIFeatureFactory, SubscriptionPlanFactory, UserFactory, UserSubscriptionFactory
from schools.tests.factories import SchoolFactory, SchoolFeatureAccessFactory, SchoolStaffFactory


@pytest.fixture
def feature():
    return AIFeatureFactory(key='lesson_plan_generator', label='Lesson Plan Generator')


@pytest.fixture
def teacher_pro_user():
    """An individually-subscribed teacher — no school involvement at all."""
    user = UserFactory(role='TEACHER')
    plan = SubscriptionPlanFactory(plan_type='TEACHER_PRO', duration='MONTHLY')
    UserSubscriptionFactory(user=user, plan=plan, status='ACTIVE',
                             expires_at=timezone.now() + timedelta(days=30))
    return user


@pytest.mark.django_db
class TestHasAIFeatureAccess:

    def test_individually_subscribed_teacher_has_access(self, teacher_pro_user, feature):
        """Case 1 — existing has_subscription() path, must be unaffected by this system."""
        from catalog.subscription_access import has_ai_feature_access
        assert has_ai_feature_access(teacher_pro_user, feature.key) is True

    def test_school_staff_with_active_trial_has_access(self, feature):
        """Case 2."""
        from catalog.subscription_access import has_ai_feature_access
        school = SchoolFactory(status='ACTIVE')
        staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=True)
        SchoolFeatureAccessFactory(
            school=school, feature=feature, status='TRIAL',
            trial_expires_at=timezone.now() + timedelta(days=7),
        )
        assert has_ai_feature_access(staff.user, feature.key) is True

    def test_school_staff_with_expired_trial_has_no_access(self, feature):
        """Case 3."""
        from catalog.subscription_access import has_ai_feature_access
        school = SchoolFactory(status='ACTIVE')
        staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=True)
        SchoolFeatureAccessFactory(
            school=school, feature=feature, status='TRIAL',
            trial_expires_at=timezone.now() - timedelta(days=1),
        )
        assert has_ai_feature_access(staff.user, feature.key) is False

    def test_school_staff_with_active_paid_grant_has_access(self, feature):
        """Case 4."""
        from catalog.subscription_access import has_ai_feature_access
        school = SchoolFactory(status='ACTIVE')
        staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=True)
        SchoolFeatureAccessFactory(school=school, feature=feature, status='PAID', paid_until=None)
        assert has_ai_feature_access(staff.user, feature.key) is True

    def test_school_staff_with_no_grant_has_no_access(self, feature):
        """Case 5 — no SchoolFeatureAccess row at all for this school/feature pair."""
        from catalog.subscription_access import has_ai_feature_access
        school = SchoolFactory(status='ACTIVE')
        staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=True)
        assert has_ai_feature_access(staff.user, feature.key) is False

    def test_non_school_non_subscribed_user_has_no_access(self, feature):
        """Case 6."""
        from catalog.subscription_access import has_ai_feature_access
        user = UserFactory(role='TEACHER')
        assert has_ai_feature_access(user, feature.key) is False

    def test_inactive_staff_member_has_no_access(self, feature):
        """A removed staff member (is_active=False) must not inherit the school's grant."""
        from catalog.subscription_access import has_ai_feature_access
        school = SchoolFactory(status='ACTIVE')
        staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=False)
        SchoolFeatureAccessFactory(school=school, feature=feature, status='PAID', paid_until=None)
        assert has_ai_feature_access(staff.user, feature.key) is False

    def test_staff_at_suspended_school_has_no_access(self, feature):
        """A grant on a SUSPENDED/PENDING_PAYMENT school must not unlock access."""
        from catalog.subscription_access import has_ai_feature_access
        school = SchoolFactory(status='SUSPENDED')
        staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=True)
        SchoolFeatureAccessFactory(school=school, feature=feature, status='PAID', paid_until=None)
        assert has_ai_feature_access(staff.user, feature.key) is False

    def test_grant_for_a_different_feature_does_not_unlock_this_one(self, feature):
        """Feature keys must not cross-leak access within the same school."""
        from catalog.subscription_access import has_ai_feature_access
        other_feature = AIFeatureFactory(key='other_ai_feature', label='Other Feature')
        school = SchoolFactory(status='ACTIVE')
        staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=True)
        SchoolFeatureAccessFactory(school=school, feature=other_feature, status='PAID', paid_until=None)
        assert has_ai_feature_access(staff.user, feature.key) is False

    def test_query_count_is_bounded(self, feature, django_assert_num_queries):
        """
        Guard against N+1: staff lookup (1) + school lookup via staff.school
        access (cached on the FK, so effectively free after the staff query's
        select) + the SchoolFeatureAccess select_related lookup (1). Bounded
        at a small constant regardless of how many other grants exist.
        """
        from catalog.subscription_access import has_ai_feature_access
        school = SchoolFactory(status='ACTIVE')
        staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=True)
        SchoolFeatureAccessFactory(
            school=school, feature=feature, status='TRIAL',
            trial_expires_at=timezone.now() + timedelta(days=7),
        )
        # Reload user fresh so cached attributes (active_subscription,
        # school_staff_profile) aren't already warm from setup above.
        fresh_user = type(staff.user).objects.get(pk=staff.user.pk)
        with django_assert_num_queries(8):
            has_ai_feature_access(fresh_user, feature.key)