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