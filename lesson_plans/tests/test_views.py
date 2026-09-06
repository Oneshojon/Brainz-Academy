"""
lesson_plans/tests/test_views.py

Covers the Lesson Plan Generator endpoint layer:
  - list/create (ungated — form submission is free)
  - detail/delete (ownership-scoped)
  - generate (gated via has_ai_feature_access; cache-first on repeat calls)

The gating matrix itself (all 6+ documented scenarios) already has
dedicated coverage in schools/tests/test_feature_access.py — these tests
focus on the two representative "allowed" and "denied" paths at the HTTP
layer, plus the cache-once contract, rather than re-deriving every case.
"""

from datetime import timedelta
from unittest.mock import patch
import json

import pytest
from django.urls import reverse
from django.utils import timezone

from tests.conftest import (
    AIFeatureFactory, LessonPlanFactory, SubjectFactory,
    SubscriptionPlanFactory, UserFactory, UserSubscriptionFactory,
)
from schools.tests.factories import SchoolFactory, SchoolFeatureAccessFactory, SchoolStaffFactory
from services.ai_service import AIUnavailableError


GENERATED_SECTIONS = {
    'objectives': 'Students will state and apply the concept.',
    'activities': '1. Recap. 2. Demo. 3. Practice.',
    'timing_breakdown': '5/15/15/5 minutes.',
    'assessment': 'Exit ticket with 3 questions.',
}


@pytest.fixture
def teacher_pro_user():
    user = UserFactory(role='TEACHER')
    plan = SubscriptionPlanFactory(plan_type='TEACHER_PRO', duration='MONTHLY')
    UserSubscriptionFactory(user=user, plan=plan, status='ACTIVE',
                             expires_at=timezone.now() + timedelta(days=30))
    return user


@pytest.fixture
def school_teacher_with_grant():
    feature = AIFeatureFactory(key='lesson_plan_generator', label='Lesson Plan Generator')
    school = SchoolFactory(status='ACTIVE')
    staff = SchoolStaffFactory(school=school, school_role='TEACHER', is_active=True)
    SchoolFeatureAccessFactory(
        school=school, feature=feature, status='TRIAL',
        trial_expires_at=timezone.now() + timedelta(days=7),
    )
    return staff.user


@pytest.fixture
def unentitled_teacher():
    """No individual subscription, no school grant at all."""
    return UserFactory(role='TEACHER')


@pytest.mark.django_db
class TestLessonPlanListCreate:

    def test_teacher_can_create_draft_plan_without_any_entitlement(self, client, unentitled_teacher):
        """Creating a draft is free/ungated — only generate/ is gated."""
        client.force_login(unentitled_teacher)
        subject = SubjectFactory()
        response = client.post(
            reverse('lesson_plans:list'),
            data=json.dumps({
                'subject': subject.id,
                'curriculum': 'NIGERIAN',
                'class_level': 'SS2',
                'coverage': "Hooke's Law",
                'duration_minutes': 40,
                'class_size': 35,
                'student_ability': 'MIXED',
            }),
            content_type='application/json',
        )
        assert response.status_code == 201
        assert response.json()['is_generated'] is False

    def test_invalid_duration_is_rejected(self, client, unentitled_teacher):
        client.force_login(unentitled_teacher)
        subject = SubjectFactory()
        response = client.post(
            reverse('lesson_plans:list'),
            data=json.dumps({
                'subject': subject.id, 'curriculum': 'NIGERIAN', 'class_level': 'SS2',
                'coverage': 'x', 'duration_minutes': 0, 'student_ability': 'MIXED',
            }),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_list_only_returns_own_plans(self, client, unentitled_teacher):
        other_teacher = UserFactory(role='TEACHER')
        LessonPlanFactory(teacher=other_teacher)
        LessonPlanFactory(teacher=unentitled_teacher)

        client.force_login(unentitled_teacher)
        response = client.get(reverse('lesson_plans:list'))
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_list_requires_authentication(self, client):
        response = client.get(reverse('lesson_plans:list'))
        assert response.status_code in (401, 403)

    def test_student_cannot_create_plan(self, client):
        student = UserFactory(role='STUDENT')
        client.force_login(student)
        subject = SubjectFactory()
        response = client.post(
            reverse('lesson_plans:list'),
            data=json.dumps({
                'subject': subject.id, 'curriculum': 'NIGERIAN', 'class_level': 'SS2',
                'coverage': 'x', 'duration_minutes': 40, 'student_ability': 'MIXED',
            }),
            content_type='application/json',
        )
        assert response.status_code == 403

    def test_school_admin_staff_cannot_create_plan(self, client):
        """school_role='ADMIN' (e.g. a non-teaching Principal) is not a teacher."""
        admin_staff = SchoolStaffFactory(school_role='ADMIN', is_active=True)
        client.force_login(admin_staff.user)
        subject = SubjectFactory()
        response = client.post(
            reverse('lesson_plans:list'),
            data=json.dumps({
                'subject': subject.id, 'curriculum': 'NIGERIAN', 'class_level': 'SS2',
                'coverage': 'x', 'duration_minutes': 40, 'student_ability': 'MIXED',
            }),
            content_type='application/json',
        )
        assert response.status_code == 403

    def test_school_teacher_with_base_role_student_can_still_create_plan(self, client):
        """
        Regression test for the exact gap this permission fixes: a School
        Plan teacher invited via SchoolInviteRedeemView keeps base
        role='STUDENT' (UserFactory default) — school_role='TEACHER' alone
        must be enough.
        """
        staff = SchoolStaffFactory(school_role='TEACHER', is_active=True)
        assert staff.user.role == 'STUDENT'  # sanity-check the gap exists
        client.force_login(staff.user)
        subject = SubjectFactory()
        response = client.post(
            reverse('lesson_plans:list'),
            data=json.dumps({
                'subject': subject.id, 'curriculum': 'NIGERIAN', 'class_level': 'SS2',
                'coverage': 'x', 'duration_minutes': 40, 'student_ability': 'MIXED',
            }),
            content_type='application/json',
        )
        assert response.status_code == 201

    def test_school_teacher_gets_school_name_autofilled(self, client, school_teacher_with_grant):
        client.force_login(school_teacher_with_grant)
        subject = SubjectFactory()
        response = client.post(
            reverse('lesson_plans:list'),
            data=json.dumps({
                'subject': subject.id, 'curriculum': 'NIGERIAN', 'class_level': 'SS2',
                'coverage': "Hooke's Law", 'duration_minutes': 40, 'student_ability': 'MIXED',
            }),
            content_type='application/json',
        )
        assert response.status_code == 201
        expected_school = school_teacher_with_grant.school_staff_profile.school.name
        assert response.json()['school_name'] == expected_school

    def test_individual_teacher_school_name_blank_falls_back_in_detail(self, client, unentitled_teacher):
        client.force_login(unentitled_teacher)
        subject = SubjectFactory()
        response = client.post(
            reverse('lesson_plans:list'),
            data=json.dumps({
                'subject': subject.id, 'curriculum': 'NIGERIAN', 'class_level': 'SS2',
                'coverage': 'x', 'duration_minutes': 40, 'student_ability': 'MIXED',
            }),
            content_type='application/json',
        )
        assert response.json()['school_name'] == ''
        assert response.json()['effective_school_name'] == 'Brainz Academy'


@pytest.mark.django_db
class TestLessonPlanDetailDelete:

    def test_teacher_can_view_own_plan(self, client, unentitled_teacher):
        plan = LessonPlanFactory(teacher=unentitled_teacher)
        client.force_login(unentitled_teacher)
        response = client.get(reverse('lesson_plans:detail', args=[plan.id]))
        assert response.status_code == 200
        assert response.json()['id'] == plan.id

    def test_teacher_cannot_view_others_plan(self, client, unentitled_teacher):
        other_teacher = UserFactory(role='TEACHER')
        plan = LessonPlanFactory(teacher=other_teacher)
        client.force_login(unentitled_teacher)
        response = client.get(reverse('lesson_plans:detail', args=[plan.id]))
        assert response.status_code == 404

    def test_teacher_can_delete_own_plan(self, client, unentitled_teacher):
        plan = LessonPlanFactory(teacher=unentitled_teacher)
        client.force_login(unentitled_teacher)
        response = client.delete(reverse('lesson_plans:detail', args=[plan.id]))
        assert response.status_code == 204

    def test_teacher_cannot_delete_others_plan(self, client, unentitled_teacher):
        other_teacher = UserFactory(role='TEACHER')
        plan = LessonPlanFactory(teacher=other_teacher)
        client.force_login(unentitled_teacher)
        response = client.delete(reverse('lesson_plans:detail', args=[plan.id]))
        assert response.status_code == 404


@pytest.mark.django_db
class TestLessonPlanGenerate:

    def test_teacher_pro_can_generate(self, client, teacher_pro_user):
        plan = LessonPlanFactory(teacher=teacher_pro_user)
        client.force_login(teacher_pro_user)

        with patch('services.ai_service.generate_lesson_plan', return_value=GENERATED_SECTIONS):
            response = client.post(reverse('lesson_plans:generate', args=[plan.id]))

        assert response.status_code == 200
        body = response.json()
        assert body['is_generated'] is True
        assert body['cached'] is False
        plan.refresh_from_db()
        assert plan.objectives == GENERATED_SECTIONS['objectives']

    def test_school_teacher_with_grant_can_generate(self, client, school_teacher_with_grant):
        plan = LessonPlanFactory(teacher=school_teacher_with_grant)
        client.force_login(school_teacher_with_grant)

        with patch('services.ai_service.generate_lesson_plan', return_value=GENERATED_SECTIONS):
            response = client.post(reverse('lesson_plans:generate', args=[plan.id]))

        assert response.status_code == 200
        assert response.json()['is_generated'] is True

    def test_unentitled_teacher_is_denied(self, client, unentitled_teacher):
        plan = LessonPlanFactory(teacher=unentitled_teacher)
        client.force_login(unentitled_teacher)

        with patch('services.ai_service.generate_lesson_plan') as mock_generate:
            response = client.post(reverse('lesson_plans:generate', args=[plan.id]))

        assert response.status_code == 403
        mock_generate.assert_not_called()

    def test_second_call_returns_cached_content_without_calling_api(self, client, teacher_pro_user):
        """Generate-once-and-cache contract, same as lesson notes."""
        plan = LessonPlanFactory(
            teacher=teacher_pro_user,
            objectives='Cached objectives.', activities='Cached activities.',
            timing_breakdown='Cached timing.', assessment='Cached assessment.',
        )
        plan.is_generated = True
        plan.save(update_fields=['is_generated'])

        client.force_login(teacher_pro_user)
        with patch('services.ai_service.generate_lesson_plan') as mock_generate:
            response = client.post(reverse('lesson_plans:generate', args=[plan.id]))

        assert response.status_code == 200
        assert response.json()['cached'] is True
        mock_generate.assert_not_called()

    def test_ai_unavailable_returns_503(self, client, teacher_pro_user):
        plan = LessonPlanFactory(teacher=teacher_pro_user)
        client.force_login(teacher_pro_user)

        with patch('services.ai_service.generate_lesson_plan',
                   side_effect=AIUnavailableError('Service down.')):
            response = client.post(reverse('lesson_plans:generate', args=[plan.id]))

        assert response.status_code == 503

    def test_cannot_generate_for_another_teachers_plan(self, client, teacher_pro_user):
        other_teacher = UserFactory(role='TEACHER')
        plan = LessonPlanFactory(teacher=other_teacher)
        client.force_login(teacher_pro_user)

        response = client.post(reverse('lesson_plans:generate', args=[plan.id]))
        assert response.status_code == 404

    def test_ai_lesson_plans_flag_off_returns_404_for_entitled_teacher(self, client, teacher_pro_user):
        from catalog.models import FeatureFlag
        from django.core.cache import cache

        FeatureFlag.objects.filter(key='ai_lesson_plans').update(is_enabled=False)
        cache.clear()

        plan = LessonPlanFactory(teacher=teacher_pro_user)
        client.force_login(teacher_pro_user)

        with patch('services.ai_service.generate_lesson_plan') as mock_generate:
            response = client.post(reverse('lesson_plans:generate', args=[plan.id]))

        assert response.status_code == 404
        assert 'disabled by the admin' in response.json()['error']
        mock_generate.assert_not_called()

    def test_school_admin_staff_cannot_generate_even_with_grant(self, client):
        """Same role boundary as create/list — entitlement isn't the gate here, role is."""
        feature = AIFeatureFactory(key='lesson_plan_generator', label='Lesson Plan Generator')
        school = SchoolFactory(status='ACTIVE')
        admin_staff = SchoolStaffFactory(school=school, school_role='ADMIN', is_active=True)
        SchoolFeatureAccessFactory(
            school=school, feature=feature, status='TRIAL',
            trial_expires_at=timezone.now() + timedelta(days=7),
        )
        plan = LessonPlanFactory(teacher=admin_staff.user)
        client.force_login(admin_staff.user)

        response = client.post(reverse('lesson_plans:generate', args=[plan.id]))
        assert response.status_code == 403


@pytest.mark.django_db
class TestLessonPlanDownload:

    def test_download_pdf_for_generated_plan(self, client, teacher_pro_user):
        plan = LessonPlanFactory(teacher=teacher_pro_user, is_generated=True,
                                  objectives='Obj.', activities='Act.',
                                  timing_breakdown='Time.', assessment='Assess.')
        client.force_login(teacher_pro_user)

        with patch('services.pandoc_export.markdown_to_pdf_bytes', return_value=b'%PDF-fake') as mock_pdf:
            response = client.get(reverse('lesson_plans:download', args=[plan.id]) + '?file_type=pdf')

        assert response.status_code == 200
        assert response['Content-Type'] == 'application/pdf'
        assert 'attachment' in response['Content-Disposition']
        assert response.content == b'%PDF-fake'
        mock_pdf.assert_called_once()

    def test_download_docx_for_generated_plan(self, client, teacher_pro_user):
        plan = LessonPlanFactory(teacher=teacher_pro_user, is_generated=True,
                                  objectives='Obj.', activities='Act.',
                                  timing_breakdown='Time.', assessment='Assess.')
        client.force_login(teacher_pro_user)

        with patch('services.pandoc_export.markdown_to_docx_bytes', return_value=b'PK-fake-docx') as mock_docx:
            response = client.get(reverse('lesson_plans:download', args=[plan.id]) + '?file_type=docx')

        assert response.status_code == 200
        assert 'wordprocessingml' in response['Content-Type']
        mock_docx.assert_called_once()

    def test_invalid_format_returns_400(self, client, teacher_pro_user):
        plan = LessonPlanFactory(teacher=teacher_pro_user, is_generated=True)
        client.force_login(teacher_pro_user)
        response = client.get(reverse('lesson_plans:download', args=[plan.id]) + '?file_type=txt')
        assert response.status_code == 400

    def test_cannot_download_a_draft_plan(self, client, teacher_pro_user):
        plan = LessonPlanFactory(teacher=teacher_pro_user, is_generated=False)
        client.force_login(teacher_pro_user)
        response = client.get(reverse('lesson_plans:download', args=[plan.id]) + '?file_type=pdf')
        assert response.status_code == 400
        assert 'Generate this lesson plan' in response.json()['error']

    def test_unentitled_teacher_cannot_download(self, client, unentitled_teacher):
        plan = LessonPlanFactory(teacher=unentitled_teacher, is_generated=True)
        client.force_login(unentitled_teacher)
        response = client.get(reverse('lesson_plans:download', args=[plan.id]) + '?file_type=pdf')
        assert response.status_code == 403

    def test_lapsed_subscriber_loses_download_access(self, client):
        """
        Regression test for the explicit decision: entitlement is re-checked
        on every download, not just at generation time -- a plan generated
        while Pro becomes undownloadable once the subscription expires.
        """
        teacher = UserFactory(role='TEACHER')
        plan = LessonPlanFactory(teacher=teacher, is_generated=True)

        plan_sub = SubscriptionPlanFactory(plan_type='TEACHER_PRO', duration='MONTHLY')
        UserSubscriptionFactory(
            user=teacher, plan=plan_sub, status='ACTIVE',
            expires_at=timezone.now() - timedelta(days=1),  # already lapsed
        )

        client.force_login(teacher)
        response = client.get(reverse('lesson_plans:download', args=[plan.id]) + '?file_type=pdf')
        assert response.status_code == 403

    def test_download_allowed_for_anyone_when_platform_is_free(self, client):
        """
        HasLessonPlanAccess -> has_ai_feature_access -> has_subscription()
        already short-circuits to True when PlatformSettings.subscription_required
        is off -- proving the download re-check doesn't need special-casing
        for free-mode; it's automatic via the existing chain.
        """
        from catalog.models import PlatformSettings
        settings_row = PlatformSettings.get()
        settings_row.subscription_required = False
        settings_row.save()

        teacher = UserFactory(role='TEACHER')  # no subscription at all
        plan = LessonPlanFactory(teacher=teacher, is_generated=True)
        client.force_login(teacher)

        with patch('services.pandoc_export.markdown_to_pdf_bytes', return_value=b'%PDF-fake'):
            response = client.get(reverse('lesson_plans:download', args=[plan.id]) + '?file_type=pdf')

        assert response.status_code == 200