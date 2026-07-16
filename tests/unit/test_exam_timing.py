"""
Tests for exam timer duration: 1 minute (60s) per question, server-driven
via seconds_per_question in the exam_page context, consumed by
exam_page.js through the data-seconds-per-question attribute.
"""
import pytest
from django.urls import reverse

from practice.views import SECONDS_PER_QUESTION
from tests.conftest import PracticeSessionFactory, QuestionFactory


@pytest.mark.django_db
class TestExamTimerDuration:

    def test_seconds_per_question_constant_is_one_minute(self):
        """Business rule: 1 minute per question."""
        assert SECONDS_PER_QUESTION == 60

    def test_exam_page_context_includes_seconds_per_question(self, client, student, subject):
        client.force_login(student)

        questions = [QuestionFactory(subject=subject) for _ in range(3)]
        session = PracticeSessionFactory(user=student, subject=subject, total_questions=3)

        session_in_client = client.session
        session_in_client[f'session_{session.id}_questions'] = [q.id for q in questions]
        session_in_client.save()

        client.raise_request_exception = False
        response = client.get(reverse('practice:exam_page', args=[session.id]))

        assert response.context['seconds_per_question'] == 60

    def test_exam_page_html_exposes_seconds_per_question_data_attribute(
        self, client, student, subject
    ):
        """The JS timer reads this attribute directly — must be present and correct."""
        client.force_login(student)

        questions = [QuestionFactory(subject=subject) for _ in range(2)]
        session = PracticeSessionFactory(user=student, subject=subject, total_questions=2)

        session_in_client = client.session
        session_in_client[f'session_{session.id}_questions'] = [q.id for q in questions]
        session_in_client.save()

        client.raise_request_exception = False
        response = client.get(reverse('practice:exam_page', args=[session.id]))

        content = response.content.decode()
        assert 'data-seconds-per-question="60"' in content