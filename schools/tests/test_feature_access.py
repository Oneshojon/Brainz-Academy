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
from schools.tests.factories import (
    SchoolFactory, SchoolFeatureAccessFactory, SchoolStaffFactory,
    AcademicTermFactory, CohortFactory, CohortEnrollmentFactory,
)


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

    # ── Student-side mirror of the staff cases above ──────────────────────
    # SchoolStaff and CohortEnrollment are unrelated models -- the staff
    # tests above never exercised this path at all before this change.

    @staticmethod
    def _enrolled_student(school_status='ACTIVE', is_active=True):
        """
        Builds a School Plan student: School -> AcademicTerm -> Cohort ->
        CohortEnrollment, all consistently linked. Built in this order
        (rather than passing school= directly into CohortFactory) because
        Cohort.school is a SelfAttribute derived from academic_term.school
        -- overriding it directly would leave the two out of sync.
        """
        school = SchoolFactory(status=school_status)
        term = AcademicTermFactory(school=school)
        cohort = CohortFactory(academic_term=term)
        enrollment = CohortEnrollmentFactory(cohort=cohort, is_active=is_active)
        return school, enrollment

    def test_enrolled_student_with_active_trial_has_access(self, feature):
        from catalog.subscription_access import has_ai_feature_access
        school, enrollment = self._enrolled_student()
        SchoolFeatureAccessFactory(
            school=school, feature=feature, status='TRIAL',
            trial_expires_at=timezone.now() + timedelta(days=7),
        )
        assert has_ai_feature_access(enrollment.student, feature.key) is True

    def test_enrolled_student_with_expired_trial_has_no_access(self, feature):
        from catalog.subscription_access import has_ai_feature_access
        school, enrollment = self._enrolled_student()
        SchoolFeatureAccessFactory(
            school=school, feature=feature, status='TRIAL',
            trial_expires_at=timezone.now() - timedelta(days=1),
        )
        assert has_ai_feature_access(enrollment.student, feature.key) is False

    def test_enrolled_student_with_no_grant_has_no_access(self, feature):
        from catalog.subscription_access import has_ai_feature_access
        school, enrollment = self._enrolled_student()
        assert has_ai_feature_access(enrollment.student, feature.key) is False

    def test_inactive_enrollment_has_no_access(self, feature):
        """A withdrawn/transferred student (is_active=False) must not inherit the school's grant."""
        from catalog.subscription_access import has_ai_feature_access
        school, enrollment = self._enrolled_student(is_active=False)
        SchoolFeatureAccessFactory(school=school, feature=feature, status='PAID', paid_until=None)
        assert has_ai_feature_access(enrollment.student, feature.key) is False

    def test_student_at_suspended_school_has_no_access(self, feature):
        from catalog.subscription_access import has_ai_feature_access
        school, enrollment = self._enrolled_student(school_status='SUSPENDED')
        SchoolFeatureAccessFactory(school=school, feature=feature, status='PAID', paid_until=None)
        assert has_ai_feature_access(enrollment.student, feature.key) is False

    def test_general_non_ai_feature_uses_the_same_grant_mechanism(self):
        """
        is_ai_powered=False features (Practice, Test Builder, Lesson Notes)
        are gated identically to AI features -- same function, same
        SchoolFeatureAccess model, just a different AIFeature row.
        """
        from catalog.subscription_access import has_ai_feature_access
        general_feature = AIFeatureFactory(key='practice_access', is_ai_powered=False)
        school, enrollment = self._enrolled_student()
        SchoolFeatureAccessFactory(school=school, feature=general_feature, status='PAID', paid_until=None)
        assert has_ai_feature_access(enrollment.student, general_feature.key) is True

    def test_staff_branch_checked_before_enrollment_branch(self, feature):
        """
        A SchoolStaff user resolves via the staff branch regardless of
        school_role -- role gating is a separate permission class's job
        (see lesson_plans.permissions.HasLessonPlanAccess's docstring).
        """
        from catalog.subscription_access import has_ai_feature_access
        school = SchoolFactory(status='ACTIVE')
        staff = SchoolStaffFactory(school=school, school_role='ADMIN', is_active=True)
        SchoolFeatureAccessFactory(school=school, feature=feature, status='PAID', paid_until=None)
        assert has_ai_feature_access(staff.user, feature.key) is True

    def test_query_count_is_bounded_for_student_path(self, feature, django_assert_num_queries):
        """Student path stays bounded the same as the staff path above."""
        from catalog.subscription_access import has_ai_feature_access
        school, enrollment = self._enrolled_student()
        SchoolFeatureAccessFactory(
            school=school, feature=feature, status='TRIAL',
            trial_expires_at=timezone.now() + timedelta(days=7),
        )
        fresh_user = type(enrollment.student).objects.get(pk=enrollment.student.pk)
        with django_assert_num_queries(8):
            has_ai_feature_access(fresh_user, feature.key)