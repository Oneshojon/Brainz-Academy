"""
Regression test for the nav/timer overlap bug.

Root cause: Users/layout.html's site-wide nav (.dash-nav, position: sticky,
z-index: 200) rendered on top of the exam page's own topbar (.exam-topbar,
position: fixed, z-index: 100), visually covering the countdown timer even
though it was running correctly underneath.

Fix: exam_page.html overrides the new {% block nav %}{% endblock %} in
layout.html so the CBT shell renders with zero site nav. This test locks
that in so it can't silently regress again.
"""
import pytest
from django.urls import reverse

from tests.conftest import PracticeSessionFactory, QuestionFactory


@pytest.mark.django_db
class TestExamPageHasNoSiteNav:

    def test_exam_page_renders_without_dash_nav(self, client, student, subject):
        """The exam page must never render the shared site nav."""
        client.force_login(student)

        question = QuestionFactory(subject=subject)
        session = PracticeSessionFactory(user=student, subject=subject, total_questions=1)

        session_in_client = client.session
        session_in_client[f'session_{session.id}_questions'] = [question.id]
        session_in_client.save()

        client.raise_request_exception = False
        response = client.get(reverse('practice:exam_page', args=[session.id]))

        content = response.content.decode()
        assert 'class="dash-nav' not in content
        assert 'id="navMenu"' not in content
        assert 'id="navToggle"' not in content

    def test_exam_page_still_renders_topbar_and_timer(self, client, student, subject):
        """Sanity check: removing the site nav must not remove the exam's own topbar."""
        client.force_login(student)

        question = QuestionFactory(subject=subject)
        session = PracticeSessionFactory(user=student, subject=subject, total_questions=1)

        session_in_client = client.session
        session_in_client[f'session_{session.id}_questions'] = [question.id]
        session_in_client.save()

        client.raise_request_exception = False
        response = client.get(reverse('practice:exam_page', args=[session.id]))

        content = response.content.decode()
        assert 'class="exam-topbar"' in content
        assert 'id="timer"' in content

    def test_other_pages_still_render_site_nav(self, client, student):
        """Sanity check: the {% block nav %} change must be backward-compatible
        for every page that doesn't override it."""
        client.force_login(student)

        client.raise_request_exception = False
        response = client.get(reverse('Users:dashboard'))

        content = response.content.decode()
        assert 'class="dash-nav' in content
        assert 'id="navMenu"' in content