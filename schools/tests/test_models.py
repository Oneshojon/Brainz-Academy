"""
schools/tests/test_models.py

Unit tests: schools app (School Plan foundation) models.
"""

import pytest
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta

from tests.conftest import SubjectFactory, UserFactory
from schools.tests.factories import (
    AcademicTermFactory, AIFeatureFactory, ClassEnrollmentFactory, ClassGroupFactory,
    CohortEnrollmentFactory, CohortFactory, SchoolFactory, SchoolFeatureAccessFactory,
    SchoolInviteFactory, SchoolMemoFactory, SchoolPlanFactory, SchoolStaffFactory,
    SchoolSubscriptionFactory,
)


# ---------------------------------------------------------------------------
# School
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSchool:

    def test_is_active_true_for_active_status(self):
        school = SchoolFactory(status='ACTIVE')
        assert school.is_active is True

    def test_is_active_false_for_pending_payment(self):
        school = SchoolFactory(status='PENDING_PAYMENT')
        assert school.is_active is False

    def test_str_includes_name_and_status(self):
        school = SchoolFactory(name='Bright Future College', status='ACTIVE')
        assert 'Bright Future College' in str(school)
        assert 'ACTIVE' in str(school)


# ---------------------------------------------------------------------------
# SchoolPlan
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSchoolPlan:

    def test_duration_days_termly(self):
        plan = SchoolPlanFactory(duration='TERMLY')
        assert plan.duration_days == 90

    def test_duration_days_yearly(self):
        plan = SchoolPlanFactory(duration='YEARLY')
        assert plan.duration_days == 365

    def test_features_list_splits_and_strips(self):
        plan = SchoolPlanFactory(features='Timetable, Report Cards ,  Analytics')
        assert plan.features_list == ['Timetable', 'Report Cards', 'Analytics']

    def test_features_list_empty_when_blank(self):
        plan = SchoolPlanFactory(features='')
        assert plan.features_list == []


# ---------------------------------------------------------------------------
# SchoolSubscription — mirrors catalog.UserSubscription behaviour exactly
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSchoolSubscriptionIsActive:

    def test_active_status_with_future_expiry_is_active(self):
        sub = SchoolSubscriptionFactory(status='ACTIVE', expires_at=timezone.now() + timedelta(days=10))
        assert sub.is_active is True

    def test_expired_subscription_is_not_active(self):
        sub = SchoolSubscriptionFactory(status='ACTIVE', expires_at=timezone.now() - timedelta(days=1))
        assert sub.is_active is False

    def test_cancelled_subscription_is_not_active(self):
        sub = SchoolSubscriptionFactory(status='CANCELLED')
        assert sub.is_active is False

    def test_pending_subscription_is_not_active(self):
        sub = SchoolSubscriptionFactory(status='PENDING', expires_at=None)
        assert sub.is_active is False


@pytest.mark.django_db
class TestSchoolSubscriptionDaysRemaining:

    def test_days_remaining_counts_down(self):
        sub = SchoolSubscriptionFactory(expires_at=timezone.now() + timedelta(days=5, hours=1))
        assert sub.days_remaining == 5

    def test_days_remaining_zero_when_no_expiry(self):
        sub = SchoolSubscriptionFactory(expires_at=None)
        assert sub.days_remaining == 0

    def test_days_remaining_never_negative(self):
        sub = SchoolSubscriptionFactory(expires_at=timezone.now() - timedelta(days=30))
        assert sub.days_remaining == 0


@pytest.mark.django_db
class TestSchoolSubscriptionActivate:

    def test_activate_sets_active_status_and_expiry(self):
        plan = SchoolPlanFactory(duration='TERMLY')
        sub = SchoolSubscriptionFactory(plan=plan, status='PENDING', started_at=None, expires_at=None)

        sub.activate(reference='PSK_REF_123')

        sub.refresh_from_db()
        assert sub.status == 'ACTIVE'
        assert sub.started_at is not None
        assert sub.paystack_reference == 'PSK_REF_123'
        # 90 days for TERMLY, allow a few seconds of test-run drift
        expected = timezone.now() + timedelta(days=90)
        assert abs((sub.expires_at - expected).total_seconds()) < 10

    def test_cancel_sets_cancelled_status(self):
        sub = SchoolSubscriptionFactory(status='ACTIVE')
        sub.cancel()
        sub.refresh_from_db()
        assert sub.status == 'CANCELLED'


# ---------------------------------------------------------------------------
# SchoolStaff
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSchoolStaff:

    def test_one_user_cannot_have_two_staff_profiles(self):
        """OneToOne — a CustomUser belongs to at most one school."""
        user = UserFactory()
        SchoolStaffFactory(user=user)
        with pytest.raises(IntegrityError):
            SchoolStaffFactory(user=user)

    def test_is_school_admin_true_for_admin_role(self):
        staff = SchoolStaffFactory(school_role='ADMIN')
        assert staff.is_school_admin is True

    def test_is_school_admin_false_for_teacher_role(self):
        staff = SchoolStaffFactory(school_role='TEACHER')
        assert staff.is_school_admin is False

    def test_position_and_class_teacher_can_combine(self):
        """A Vice Principal can also lead a cohort — no constraint blocks this."""
        vp = SchoolStaffFactory(school_role='ADMIN', position='VICE_PRINCIPAL')
        cohort = CohortFactory(class_teacher=vp)
        assert cohort.class_teacher == vp
        assert cohort.class_teacher.position == 'VICE_PRINCIPAL'


# ---------------------------------------------------------------------------
# AcademicTerm / Cohort
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAcademicTerm:

    def test_unique_term_per_school_per_year(self):
        school = SchoolFactory()
        AcademicTermFactory(school=school, term='FIRST', year=2026)
        with pytest.raises(IntegrityError):
            AcademicTermFactory(school=school, term='FIRST', year=2026)


@pytest.mark.django_db
class TestCohort:

    def test_level_is_independent_of_arm_name(self):
        """Two arms of the same level, e.g. SS2 Gold and SS2 Silver."""
        term = AcademicTermFactory()
        gold = CohortFactory(academic_term=term, name='SS2 Gold', level='SS2')
        silver = CohortFactory(academic_term=term, name='SS2 Silver', level='SS2')
        assert gold.level == silver.level == 'SS2'
        assert gold.name != silver.name

    def test_all_ss2_queryable_across_arms(self):
        """Confirms the level field supports 'message all of SS2' style queries."""
        from schools.models import Cohort

        term = AcademicTermFactory()
        CohortFactory(academic_term=term, name='SS2 Gold', level='SS2')
        CohortFactory(academic_term=term, name='SS2 Silver', level='SS2')
        CohortFactory(academic_term=term, name='SS1 Gold', level='SS1')

        ss2_cohorts = Cohort.objects.filter(school=term.school, level='SS2')
        assert ss2_cohorts.count() == 2

    def test_duplicate_arm_name_in_same_term_rejected(self):
        term = AcademicTermFactory()
        CohortFactory(academic_term=term, name='SS2 Gold')
        with pytest.raises(IntegrityError):
            CohortFactory(academic_term=term, name='SS2 Gold')


# ---------------------------------------------------------------------------
# ClassGroup
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestClassGroup:

    def test_one_class_group_per_subject_per_cohort(self):
        cohort = CohortFactory()
        subject = SubjectFactory()
        ClassGroupFactory(cohort=cohort, subject=subject)
        with pytest.raises(IntegrityError):
            ClassGroupFactory(cohort=cohort, subject=subject)

    def test_different_cohorts_can_share_same_subject(self):
        """Different teachers taking the same subject in different cohorts — allowed."""
        term = AcademicTermFactory()
        subject = SubjectFactory()
        gold = CohortFactory(academic_term=term, name='SS2 Gold')
        silver = CohortFactory(academic_term=term, name='SS2 Silver')

        cg1 = ClassGroupFactory(cohort=gold, subject=subject)
        cg2 = ClassGroupFactory(cohort=silver, subject=subject)

        assert cg1.subject == cg2.subject
        assert cg1.cohort != cg2.cohort

    def test_str_shows_cohort_subject_and_teacher(self):
        teacher = SchoolStaffFactory()
        teacher.user.first_name, teacher.user.last_name = 'Amaka', 'Adeyemi'
        teacher.user.save()
        cg = ClassGroupFactory(teacher=teacher)
        assert 'Amaka Adeyemi' in str(cg)


# ---------------------------------------------------------------------------
# Enrollment — CohortEnrollment / ClassEnrollment split
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCohortEnrollment:

    def test_student_enrolled_once_per_cohort(self):
        student = UserFactory()
        cohort = CohortFactory()
        CohortEnrollmentFactory(student=student, cohort=cohort)
        with pytest.raises(IntegrityError):
            CohortEnrollmentFactory(student=student, cohort=cohort)

    def test_student_can_be_cohort_enrolled_without_any_class_group(self):
        """Cohort membership doesn't require a subject-class assignment to exist yet."""
        enrollment = CohortEnrollmentFactory()
        assert enrollment.cohort.class_groups.count() == 0
        assert enrollment.is_active is True


@pytest.mark.django_db
class TestClassEnrollment:

    def test_student_enrolled_once_per_class_group(self):
        student = UserFactory()
        class_group = ClassGroupFactory()
        ClassEnrollmentFactory(student=student, class_group=class_group)
        with pytest.raises(IntegrityError):
            ClassEnrollmentFactory(student=student, class_group=class_group)

    def test_cohort_reachable_without_denormalized_field(self):
        """ClassEnrollment has no cohort FK of its own — always derived from class_group."""
        cohort = CohortFactory(name='SS2 Gold')
        class_group = ClassGroupFactory(cohort=cohort)
        enrollment = ClassEnrollmentFactory(class_group=class_group)
        assert enrollment.class_group.cohort == cohort
        assert not hasattr(enrollment, 'cohort')

    def test_same_student_can_take_multiple_subjects_in_same_cohort(self):
        student = UserFactory()
        cohort = CohortFactory()
        maths = ClassGroupFactory(cohort=cohort, subject=SubjectFactory(name='Mathematics'))
        english = ClassGroupFactory(cohort=cohort, subject=SubjectFactory(name='English'))

        ClassEnrollmentFactory(student=student, class_group=maths)
        ClassEnrollmentFactory(student=student, class_group=english)

        assert student.class_enrollments.count() == 2


# ---------------------------------------------------------------------------
# SchoolInvite
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSchoolInvite:

    def test_token_auto_generated_on_save(self):
        invite = SchoolInviteFactory()
        assert invite.token
        assert len(invite.token) > 20

    def test_is_valid_true_when_unused_and_unexpired(self):
        invite = SchoolInviteFactory(max_uses=1, uses_count=0,
                                      expires_at=timezone.now() + timedelta(days=1))
        assert invite.is_valid is True

    def test_is_valid_false_when_expired(self):
        invite = SchoolInviteFactory(expires_at=timezone.now() - timedelta(days=1))
        assert invite.is_valid is False

    def test_is_valid_false_when_uses_exhausted(self):
        invite = SchoolInviteFactory(max_uses=1, uses_count=1)
        assert invite.is_valid is False

    def test_redeem_increments_uses_count(self):
        invite = SchoolInviteFactory(max_uses=5, uses_count=0)
        invite.redeem()
        assert invite.uses_count == 1
        invite.redeem()
        assert invite.uses_count == 2

    def test_student_invite_can_scope_to_class_group(self):
        class_group = ClassGroupFactory()
        invite = SchoolInviteFactory(role='STUDENT', class_group=class_group,
                                      school=class_group.cohort.school)
        assert invite.class_group == class_group

    def test_school_wide_invite_has_no_class_group(self):
        invite = SchoolInviteFactory(role='TEACHER', class_group=None)
        assert invite.class_group is None


# ---------------------------------------------------------------------------
# SchoolMemo
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSchoolMemo:

    def test_new_memo_is_unpublished_by_default(self):
        memo = SchoolMemoFactory()
        assert memo.is_published is False
        assert memo.published_at is None

    def test_publish_sets_published_flag_and_timestamp(self):
        memo = SchoolMemoFactory()
        memo.publish()
        memo.refresh_from_db()
        assert memo.is_published is True
        assert memo.published_at is not None

    def test_cohort_targeted_memo_stores_target_cohort(self):
        cohort = CohortFactory()
        memo = SchoolMemoFactory(school=cohort.school, audience='COHORT', target_cohort=cohort)
        assert memo.target_cohort == cohort


# ---------------------------------------------------------------------------
# SchoolFeatureAccess — is_active mirrors SchoolSubscription's shape
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSchoolFeatureAccessIsActive:

    def test_trial_with_future_expiry_is_active(self):
        grant = SchoolFeatureAccessFactory(
            status='TRIAL', trial_expires_at=timezone.now() + timedelta(days=5),
        )
        assert grant.is_active is True

    def test_trial_with_past_expiry_is_not_active(self):
        grant = SchoolFeatureAccessFactory(
            status='TRIAL', trial_expires_at=timezone.now() - timedelta(days=1),
        )
        assert grant.is_active is False

    def test_trial_with_no_expiry_set_is_not_active(self):
        grant = SchoolFeatureAccessFactory(status='TRIAL', trial_expires_at=None)
        assert grant.is_active is False

    def test_paid_with_no_expiry_is_active(self):
        grant = SchoolFeatureAccessFactory(status='PAID', paid_until=None)
        assert grant.is_active is True

    def test_paid_with_future_expiry_is_active(self):
        grant = SchoolFeatureAccessFactory(
            status='PAID', paid_until=timezone.now() + timedelta(days=30),
        )
        assert grant.is_active is True

    def test_paid_with_past_expiry_is_not_active(self):
        grant = SchoolFeatureAccessFactory(
            status='PAID', paid_until=timezone.now() - timedelta(days=1),
        )
        assert grant.is_active is False

    def test_locked_is_never_active(self):
        grant = SchoolFeatureAccessFactory(status='LOCKED')
        assert grant.is_active is False

    def test_activate_trial_sets_status_and_expiry(self):
        grant = SchoolFeatureAccessFactory(status='LOCKED', trial_expires_at=None)
        expires = timezone.now() + timedelta(days=14)
        grant.activate_trial(expires)
        grant.refresh_from_db()
        assert grant.status == 'TRIAL'
        assert grant.trial_expires_at == expires

    def test_activate_paid_sets_status_and_paid_until(self):
        grant = SchoolFeatureAccessFactory(status='TRIAL')
        until = timezone.now() + timedelta(days=365)
        grant.activate_paid(paid_until=until)
        grant.refresh_from_db()
        assert grant.status == 'PAID'
        assert grant.paid_until == until

    def test_lock_sets_status_to_locked(self):
        grant = SchoolFeatureAccessFactory(status='PAID')
        grant.lock()
        grant.refresh_from_db()
        assert grant.status == 'LOCKED'

    def test_unique_together_school_and_feature(self):
        school = SchoolFactory()
        feature = AIFeatureFactory()
        SchoolFeatureAccessFactory(school=school, feature=feature)
        with pytest.raises(IntegrityError):
            SchoolFeatureAccessFactory(school=school, feature=feature)