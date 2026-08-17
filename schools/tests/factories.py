"""
schools/tests/factories.py

Test factories for the schools app (School Plan foundation). Follows the
same per-app convention as contact/tests/factories.py.

UserFactory and SubjectFactory are cross-app dependencies (CustomUser is
shared by every app; Subject lives in catalog) and are imported from the
central tests/conftest.py rather than duplicated here.
"""

import factory
from django.utils import timezone
from datetime import timedelta

from tests.conftest import SubjectFactory, UserFactory


class SchoolFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.School'

    name          = factory.Sequence(lambda n: f'Test School {n}')
    state         = 'Lagos'
    contact_email = factory.Sequence(lambda n: f'school{n}@example.com')
    status        = 'ACTIVE'


class SchoolPlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.SchoolPlan'
        django_get_or_create = ('name', 'duration')

    name       = 'School Basic'
    duration   = 'TERMLY'
    price      = 50000
    seat_limit = 200
    is_active  = True


class SchoolSubscriptionFactory(factory.django.DjangoModelFactory):
    """is_active property checks status='ACTIVE' AND expires_at in the future — same shape as UserSubscription."""
    class Meta:
        model = 'schools.SchoolSubscription'

    school     = factory.SubFactory(SchoolFactory)
    plan       = factory.SubFactory(SchoolPlanFactory)
    status     = 'ACTIVE'
    started_at = factory.LazyFunction(timezone.now)
    expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(days=90))


class SchoolStaffFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.SchoolStaff'

    user        = factory.SubFactory(UserFactory)
    school      = factory.SubFactory(SchoolFactory)
    school_role = 'TEACHER'
    position    = None
    is_active   = True


class AcademicTermFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.AcademicTerm'

    school     = factory.SubFactory(SchoolFactory)
    term       = 'FIRST'
    year       = 2026
    is_current = True


class CohortFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.Cohort'

    school        = factory.SelfAttribute('academic_term.school')
    academic_term = factory.SubFactory(AcademicTermFactory)
    name          = factory.Sequence(lambda n: f'SS2 Arm{n}')
    level         = 'SS2'
    class_teacher = None


class ClassGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.ClassGroup'

    teacher = factory.SubFactory(SchoolStaffFactory, school_role='TEACHER')
    subject = factory.SubFactory(SubjectFactory)
    cohort  = factory.SubFactory(CohortFactory)


class CohortEnrollmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.CohortEnrollment'

    student   = factory.SubFactory(UserFactory)
    cohort    = factory.SubFactory(CohortFactory)
    is_active = True


class ClassEnrollmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.ClassEnrollment'

    student     = factory.SubFactory(UserFactory)
    class_group = factory.SubFactory(ClassGroupFactory)


class SchoolInviteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.SchoolInvite'

    school      = factory.SubFactory(SchoolFactory)
    role        = 'TEACHER'
    class_group = None
    max_uses    = 1
    expires_at  = factory.LazyFunction(lambda: timezone.now() + timedelta(days=7))


class SchoolMemoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'schools.SchoolMemo'

    school   = factory.SubFactory(SchoolFactory)
    title    = factory.Sequence(lambda n: f'Memo {n}')
    body     = 'This is a test memo.'
    audience = 'ALL'