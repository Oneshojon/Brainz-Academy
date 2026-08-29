"""
schools/tests/test_admin_views.py

Covers the four admin-management phases: AcademicTerm CRUD, Cohort CRUD,
staff listing + invite create/redeem, and ClassGroup CRUD.

Every model here shares one property worth testing explicitly and
repeatedly: an admin from School A must never be able to see, create
against, or modify anything belonging to School B — via list scoping,
via detail 404s on cross-school IDs, and via serializer-level FK
validation rejecting cross-school references even when guessed directly.
"""

import json

import pytest
from django.urls import reverse

from tests.conftest import SubjectFactory, TeacherUserFactory, UserFactory, assert_max_queries

from schools.models import AcademicTerm, ClassGroup, Cohort, SchoolInvite, SchoolStaff
from schools.tests.factories import (
    AcademicTermFactory, ClassGroupFactory, CohortFactory, SchoolFactory,
    SchoolInviteFactory, SchoolStaffFactory,
)

pytestmark = pytest.mark.django_db


def _post(client, url, payload):
    return client.post(url, data=json.dumps(payload), content_type='application/json')


def _patch(client, url, payload):
    return client.patch(url, data=json.dumps(payload), content_type='application/json')


# ---------------------------------------------------------------------------
# AcademicTerm
# ---------------------------------------------------------------------------

class TestAcademicTermListCreate:

    def test_requires_school_admin(self, client):
        teacher = TeacherUserFactory()  # no SchoolStaff profile at all
        client.force_login(teacher)
        response = client.get(reverse('schools:term-list'))
        assert response.status_code == 403

    def test_teacher_role_staff_cannot_manage_terms(self, client):
        staff = SchoolStaffFactory(school_role='TEACHER')
        client.force_login(staff.user)
        response = client.get(reverse('schools:term-list'))
        assert response.status_code == 403

    def test_lists_only_own_school_terms(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        AcademicTermFactory(school=admin.school, term='FIRST', year=2026)
        AcademicTermFactory(school=SchoolFactory(), term='FIRST', year=2026)  # other school

        response = client.get(reverse('schools:term-list'))

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_create_term_scopes_to_admins_school(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)

        response = _post(client, reverse('schools:term-list'), {
            'term': 'FIRST', 'year': 2026, 'is_current': True,
        })

        assert response.status_code == 201
        term = AcademicTerm.objects.get(id=response.json()['id'])
        assert term.school == admin.school

    def test_duplicate_term_year_rejected_with_400_not_500(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        AcademicTermFactory(school=admin.school, term='FIRST', year=2026)

        response = _post(client, reverse('schools:term-list'), {'term': 'FIRST', 'year': 2026})

        assert response.status_code == 400

    def test_setting_is_current_unsets_other_terms(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        old_current = AcademicTermFactory(school=admin.school, term='FIRST', year=2026, is_current=True)

        response = _post(client, reverse('schools:term-list'), {
            'term': 'SECOND', 'year': 2026, 'is_current': True,
        })

        assert response.status_code == 201
        old_current.refresh_from_db()
        assert old_current.is_current is False

    def test_no_n_plus_one_on_term_list(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        for year in range(2020, 2025):
            AcademicTermFactory(school=admin.school, term='FIRST', year=year)

        with assert_max_queries(6):
            response = client.get(reverse('schools:term-list'))
        assert response.status_code == 200


class TestAcademicTermDetail:

    def test_cannot_retrieve_another_schools_term(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        other_term = AcademicTermFactory(school=SchoolFactory())

        response = client.get(reverse('schools:term-detail', args=[other_term.id]))

        assert response.status_code == 404

    def test_update_setting_current_unsets_siblings(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        term_a = AcademicTermFactory(school=admin.school, term='FIRST', year=2026, is_current=True)
        term_b = AcademicTermFactory(school=admin.school, term='SECOND', year=2026, is_current=False)

        response = _patch(client, reverse('schools:term-detail', args=[term_b.id]), {'is_current': True})

        assert response.status_code == 200
        term_a.refresh_from_db()
        assert term_a.is_current is False


# ---------------------------------------------------------------------------
# Cohort
# ---------------------------------------------------------------------------

class TestCohortListCreate:

    def test_requires_school_admin(self, client):
        staff = SchoolStaffFactory(school_role='TEACHER')
        client.force_login(staff.user)
        response = client.get(reverse('schools:cohort-list'))
        assert response.status_code == 403

    def test_lists_only_own_school_cohorts(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        own_term = AcademicTermFactory(school=admin.school)
        CohortFactory(academic_term=own_term)
        CohortFactory()  # different school entirely

        response = client.get(reverse('schools:cohort-list'))

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_cannot_create_cohort_against_another_schools_term(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        foreign_term = AcademicTermFactory(school=SchoolFactory())

        response = _post(client, reverse('schools:cohort-list'), {
            'name': 'SS2 Gold', 'level': 'SS2', 'academic_term': foreign_term.id,
        })

        assert response.status_code == 400

    def test_cannot_assign_class_teacher_from_another_school(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        own_term = AcademicTermFactory(school=admin.school)
        foreign_teacher = SchoolStaffFactory(school_role='TEACHER')

        response = _post(client, reverse('schools:cohort-list'), {
            'name': 'SS2 Gold', 'level': 'SS2',
            'academic_term': own_term.id, 'class_teacher': foreign_teacher.id,
        })

        assert response.status_code == 400

    def test_vp_can_be_class_teacher(self, client):
        """Confirms the multi-hat rule (position + class_teacher) survives the API layer."""
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        own_term = AcademicTermFactory(school=admin.school)
        vp = SchoolStaffFactory(school=admin.school, school_role='ADMIN', position='VICE_PRINCIPAL')

        response = _post(client, reverse('schools:cohort-list'), {
            'name': 'SS2 Gold', 'level': 'SS2',
            'academic_term': own_term.id, 'class_teacher': vp.id,
        })

        assert response.status_code == 201

    def test_no_n_plus_one_on_cohort_list(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        term = AcademicTermFactory(school=admin.school)
        for i in range(5):
            CohortFactory(academic_term=term, name=f'Cohort {i}', class_teacher=SchoolStaffFactory(school=admin.school))

        with assert_max_queries(6):
            response = client.get(reverse('schools:cohort-list'))
        assert response.status_code == 200


class TestCohortDetail:

    def test_cannot_retrieve_another_schools_cohort(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        foreign_cohort = CohortFactory()

        response = client.get(reverse('schools:cohort-detail', args=[foreign_cohort.id]))

        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Staff & invites
# ---------------------------------------------------------------------------

class TestSchoolStaffList:

    def test_requires_school_admin(self, client):
        staff = SchoolStaffFactory(school_role='TEACHER')
        client.force_login(staff.user)
        response = client.get(reverse('schools:staff-list'))
        assert response.status_code == 403

    def test_lists_only_own_school_staff(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        SchoolStaffFactory(school=admin.school, school_role='TEACHER')
        SchoolStaffFactory()  # different school

        response = client.get(reverse('schools:staff-list'))

        assert response.status_code == 200
        # admin themself + the one teacher created for their school
        assert len(response.json()) == 2

    def test_no_n_plus_one_on_staff_list(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        for _ in range(5):
            SchoolStaffFactory(school=admin.school, school_role='TEACHER')

        with assert_max_queries(6):
            response = client.get(reverse('schools:staff-list'))
        assert response.status_code == 200


class TestSchoolInviteCreate:

    def test_requires_school_admin(self, client):
        staff = SchoolStaffFactory(school_role='TEACHER')
        client.force_login(staff.user)
        response = _post(client, reverse('schools:invite-create'), {
            'role': 'TEACHER', 'max_uses': 1, 'expires_at': '2027-01-01T00:00:00Z',
        })
        assert response.status_code == 403

    def test_creates_teacher_invite_for_own_school(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)

        response = _post(client, reverse('schools:invite-create'), {
            'role': 'TEACHER', 'max_uses': 1, 'expires_at': '2027-01-01T00:00:00Z',
        })

        assert response.status_code == 201
        invite = SchoolInvite.objects.get(id=response.json()['id'])
        assert invite.school == admin.school
        assert invite.created_by == admin.user
        assert invite.token  # auto-generated

    def test_class_group_rejected_for_non_student_role(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        term = AcademicTermFactory(school=admin.school)
        cohort = CohortFactory(academic_term=term)
        class_group = ClassGroupFactory(cohort=cohort)

        response = _post(client, reverse('schools:invite-create'), {
            'role': 'TEACHER', 'class_group': class_group.id,
            'max_uses': 1, 'expires_at': '2027-01-01T00:00:00Z',
        })

        assert response.status_code == 400

    def test_class_group_from_another_school_rejected(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        foreign_class_group = ClassGroupFactory()

        response = _post(client, reverse('schools:invite-create'), {
            'role': 'STUDENT', 'class_group': foreign_class_group.id,
            'max_uses': 1, 'expires_at': '2027-01-01T00:00:00Z',
        })

        assert response.status_code == 400


class TestSchoolInviteRedeem:

    def test_requires_authentication(self, client):
        invite = SchoolInviteFactory(role='TEACHER')
        response = _post(client, reverse('schools:invite-redeem'), {'token': invite.token})
        assert response.status_code in (401, 403)

    def test_valid_teacher_invite_creates_staff_row(self, client):
        invite = SchoolInviteFactory(role='TEACHER', max_uses=1)
        user = UserFactory()
        client.force_login(user)

        response = _post(client, reverse('schools:invite-redeem'), {'token': invite.token})

        assert response.status_code == 200
        staff = SchoolStaff.objects.get(user=user)
        assert staff.school == invite.school
        assert staff.school_role == 'TEACHER'
        invite.refresh_from_db()
        assert invite.uses_count == 1

    def test_invalid_token_returns_404(self, client):
        user = UserFactory()
        client.force_login(user)
        response = _post(client, reverse('schools:invite-redeem'), {'token': 'not-a-real-token'})
        assert response.status_code == 404

    def test_expired_invite_rejected(self, client):
        from django.utils import timezone
        from datetime import timedelta
        invite = SchoolInviteFactory(role='TEACHER', expires_at=timezone.now() - timedelta(days=1))
        user = UserFactory()
        client.force_login(user)

        response = _post(client, reverse('schools:invite-redeem'), {'token': invite.token})

        assert response.status_code == 400
        assert not SchoolStaff.objects.filter(user=user).exists()

    def test_exhausted_invite_rejected(self, client):
        invite = SchoolInviteFactory(role='TEACHER', max_uses=1, uses_count=1)
        user = UserFactory()
        client.force_login(user)

        response = _post(client, reverse('schools:invite-redeem'), {'token': invite.token})

        assert response.status_code == 400

    def test_user_already_on_a_school_cannot_redeem(self, client):
        existing_staff = SchoolStaffFactory(school_role='TEACHER')
        invite = SchoolInviteFactory(role='TEACHER')
        client.force_login(existing_staff.user)

        response = _post(client, reverse('schools:invite-redeem'), {'token': invite.token})

        assert response.status_code == 400

    def test_student_invite_rejected_not_yet_supported(self, client):
        invite = SchoolInviteFactory(role='STUDENT')
        user = UserFactory()
        client.force_login(user)

        response = _post(client, reverse('schools:invite-redeem'), {'token': invite.token})

        assert response.status_code == 400
        assert not SchoolStaff.objects.filter(user=user).exists()


# ---------------------------------------------------------------------------
# ClassGroup
# ---------------------------------------------------------------------------

class TestClassGroupListCreate:

    def test_requires_school_admin(self, client):
        staff = SchoolStaffFactory(school_role='TEACHER')
        client.force_login(staff.user)
        response = client.get(reverse('schools:classgroup-list'))
        assert response.status_code == 403

    def test_lists_only_own_school_class_groups(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        own_cohort = CohortFactory(academic_term=AcademicTermFactory(school=admin.school))
        ClassGroupFactory(cohort=own_cohort)
        ClassGroupFactory()  # different school

        response = client.get(reverse('schools:classgroup-list'))

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_cannot_create_against_another_schools_cohort(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        foreign_cohort = CohortFactory()
        subject = SubjectFactory()

        response = _post(client, reverse('schools:classgroup-list'), {
            'cohort': foreign_cohort.id, 'subject': subject.id,
        })

        assert response.status_code == 400

    def test_cannot_assign_teacher_from_another_school(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        own_cohort = CohortFactory(academic_term=AcademicTermFactory(school=admin.school))
        foreign_teacher = SchoolStaffFactory(school_role='TEACHER')
        subject = SubjectFactory()

        response = _post(client, reverse('schools:classgroup-list'), {
            'cohort': own_cohort.id, 'subject': subject.id, 'teacher': foreign_teacher.id,
        })

        assert response.status_code == 400

    def test_valid_creation_succeeds(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        own_cohort = CohortFactory(academic_term=AcademicTermFactory(school=admin.school))
        own_teacher = SchoolStaffFactory(school=admin.school, school_role='TEACHER')
        subject = SubjectFactory()

        response = _post(client, reverse('schools:classgroup-list'), {
            'cohort': own_cohort.id, 'subject': subject.id, 'teacher': own_teacher.id,
        })

        assert response.status_code == 201
        cg = ClassGroup.objects.get(id=response.json()['id'])
        assert cg.cohort == own_cohort
        assert cg.teacher == own_teacher

    def test_duplicate_subject_in_same_cohort_rejected(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        own_cohort = CohortFactory(academic_term=AcademicTermFactory(school=admin.school))
        subject = SubjectFactory()
        ClassGroupFactory(cohort=own_cohort, subject=subject)

        response = _post(client, reverse('schools:classgroup-list'), {
            'cohort': own_cohort.id, 'subject': subject.id,
        })

        assert response.status_code == 400

    def test_no_n_plus_one_on_class_group_list(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        term = AcademicTermFactory(school=admin.school)
        cohort = CohortFactory(academic_term=term)
        for _ in range(5):
            ClassGroupFactory(
                cohort=cohort, subject=SubjectFactory(),
                teacher=SchoolStaffFactory(school=admin.school, school_role='TEACHER'),
            )

        with assert_max_queries(6):
            response = client.get(reverse('schools:classgroup-list'))
        assert response.status_code == 200


class TestClassGroupDetail:

    def test_cannot_retrieve_another_schools_class_group(self, client):
        admin = SchoolStaffFactory(school_role='ADMIN')
        client.force_login(admin.user)
        foreign_class_group = ClassGroupFactory()

        response = client.get(reverse('schools:classgroup-detail', args=[foreign_class_group.id]))

        assert response.status_code == 404