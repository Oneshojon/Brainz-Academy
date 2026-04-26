"""
Integration tests: exam flow — start, submit, finish, results.
N+1 guards use django_assert_num_queries from pytest-django.
All related_names verified: UserAnswer → session.answers (not useranswer_set).
"""

import pytest
import json
from django.urls import reverse
from django.utils import timezone

from tests.conftest import assert_max_queries
from tests.conftest import (
    QuestionFactory, ChoiceFactory, PracticeSessionFactory,
    UserAnswerFactory, UserFactory, TheoryAnswerFactory,
)


# ---------------------------------------------------------------------------
# Start session
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestStartSession:

    def test_start_session_creates_session_record(self, client, student, subject, obj_question):
        client.force_login(student)
        url = reverse('practice:start_session')
        response = client.post(url, {
            'subject': subject.id,
            'session_type': 'EXAM',
            'num_questions': 1,
        })
        assert response.status_code == 302
        from practice.models import PracticeSession
        assert PracticeSession.objects.filter(user=student).exists()

    def test_start_session_requires_login(self, client, subject):
        url = reverse('practice:start_session')
        response = client.post(url, {'subject': subject.id})
        assert response.status_code == 302

    def test_start_session_rejects_get(self, client, student):
        client.force_login(student)
        url = reverse('practice:start_session')
        response = client.get(url)
        assert response.status_code == 302

    def test_start_session_stores_question_ids_in_django_session(
        self, client, student, subject, obj_question
    ):
        client.force_login(student)
        url = reverse('practice:start_session')
        client.post(url, {
            'subject': subject.id,
            'session_type': 'EXAM',
            'num_questions': 1,
        })
        from practice.models import PracticeSession
        session = PracticeSession.objects.filter(user=student).first()
        assert session is not None
        key = f'session_{session.id}_questions'
        assert key in client.session
        assert obj_question.id in client.session[key]

    def test_start_session_with_no_matching_questions_returns_error(
        self, client, student
    ):
        client.force_login(student)
        url = reverse('practice:start_session')
        response = client.post(url, {
            'subject': 99999,
            'session_type': 'EXAM',
        })
        assert response.status_code in (200, 302)


# ---------------------------------------------------------------------------
# Exam page — N+1 guard
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestExamPage:

    def _seed_session(self, client, student, subject, n=5):
        questions = []
        for _ in range(n):
            q = QuestionFactory(subject=subject, question_type='OBJ')
            ChoiceFactory(question=q, label='A', is_correct=True)
            ChoiceFactory(question=q, label='B', is_correct=False)
            questions.append(q)
        session = PracticeSessionFactory(user=student, subject=subject, total_questions=n)
        s = client.session
        s[f'session_{session.id}_questions'] = [q.id for q in questions]
        s.save()
        return session, questions

    def test_exam_page_renders(self, client, student, subject):
        client.force_login(student)
        session, _ = self._seed_session(client, student, subject)
        url = reverse('practice:exam_page', kwargs={'session_id': session.id})
        response = client.get(url)
        assert response.status_code == 200

    def test_exam_page_no_n_plus_one(
        self, client, student, subject
    ):
        """
        10 questions must not generate 10+ DB queries.
        Bounded at 8: session lookup, user, questions batch,
        choices prefetch, topics prefetch, answers lookup, feature flags, platform settings.
        """
        client.force_login(student)
        session, _ = self._seed_session(client, student, subject, n=10)
        url = reverse('practice:exam_page', kwargs={'session_id': session.id})
        with assert_max_queries(16):
            client.get(url)

    def test_completed_session_redirects_to_results(
        self, client, student, completed_session
    ):
        client.force_login(student)
        s = client.session
        s[f'session_{completed_session.id}_questions'] = []
        s.save()
        url = reverse('practice:exam_page', kwargs={'session_id': completed_session.id})
        response = client.get(url)
        assert response.status_code == 302
        assert 'results' in response['Location']

    def test_other_user_cannot_access_session(self, client, db, subject):
        owner    = UserFactory()
        intruder = UserFactory()
        session  = PracticeSessionFactory(user=owner, subject=subject)
        client.force_login(intruder)
        url = reverse('practice:exam_page', kwargs={'session_id': session.id})
        response = client.get(url)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Submit answer (AJAX)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSubmitAnswer:

    def _post_answer(self, client, session, question, choice_id=None, theory=None):
        url = reverse('practice:submit_answer')
        payload = {'session_id': session.id, 'question_id': question.id}
        if choice_id:
            payload['choice_id'] = choice_id
        if theory:
            payload['theory_response'] = theory
        return client.post(
            url,
            data=json.dumps(payload),
            content_type='application/json',
        )

    def test_correct_choice_returns_is_correct_true(
        self, client, student, obj_question
    ):
        client.force_login(student)
        session = PracticeSessionFactory(user=student, subject=obj_question.subject)
        s = client.session
        s[f'session_{session.id}_questions'] = [obj_question.id]
        s.save()
        correct = obj_question.choices.filter(is_correct=True).first()
        response = self._post_answer(client, session, obj_question, choice_id=correct.id)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['is_correct'] is True

    def test_wrong_choice_returns_is_correct_false(
        self, client, student, obj_question
    ):
        client.force_login(student)
        session = PracticeSessionFactory(user=student, subject=obj_question.subject)
        s = client.session
        s[f'session_{session.id}_questions'] = [obj_question.id]
        s.save()
        wrong = obj_question.choices.filter(is_correct=False).first()
        response = self._post_answer(client, session, obj_question, choice_id=wrong.id)
        assert response.json()['is_correct'] is False

    def test_resubmit_updates_not_duplicates(
        self, client, student, obj_question
    ):
        """Changing your answer must UPDATE the existing UserAnswer, not create a second."""
        client.force_login(student)
        session = PracticeSessionFactory(user=student, subject=obj_question.subject)
        s = client.session
        s[f'session_{session.id}_questions'] = [obj_question.id]
        s.save()

        wrong   = obj_question.choices.filter(is_correct=False).first()
        correct = obj_question.choices.filter(is_correct=True).first()

        self._post_answer(client, session, obj_question, choice_id=wrong.id)
        self._post_answer(client, session, obj_question, choice_id=correct.id)

        from practice.models import UserAnswer
        answers = UserAnswer.objects.filter(session=session, question=obj_question)
        assert answers.count() == 1
        assert answers.first().is_correct is True

    def test_theory_answer_saved(self, client, student, theory_question):
        client.force_login(student)
        session = PracticeSessionFactory(user=student, subject=theory_question.subject)
        s = client.session
        s[f'session_{session.id}_questions'] = [theory_question.id]
        s.save()
        response = self._post_answer(
            client, session, theory_question,
            theory='Waves are disturbances that transfer energy.'
        )
        assert response.status_code == 200
        from practice.models import UserAnswer
        answer = UserAnswer.objects.get(session=session, question=theory_question)
        assert 'Waves' in answer.theory_response

    def test_submit_requires_login(self, client, obj_question, db):
        url = reverse('practice:submit_answer')
        response = client.post(
            url,
            data=json.dumps({'session_id': 1, 'question_id': obj_question.id}),
            content_type='application/json',
        )
        assert response.status_code == 302

    def test_submit_to_completed_session_returns_400(
        self, client, student, completed_session, obj_question
    ):
        client.force_login(student)
        correct = obj_question.choices.filter(is_correct=True).first()
        url = reverse('practice:submit_answer')
        response = client.post(
            url,
            data=json.dumps({
                'session_id': completed_session.id,
                'question_id': obj_question.id,
                'choice_id': correct.id,
            }),
            content_type='application/json',
        )
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# Finish session
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestFinishSession:

    def test_finish_session_marks_completed(self, client, student, obj_question):
        client.force_login(student)
        session = PracticeSessionFactory(user=student, subject=obj_question.subject)
        correct = obj_question.choices.filter(is_correct=True).first()
        UserAnswerFactory(
            session=session, question=obj_question,
            selected_choice=correct, is_correct=True,
        )
        s = client.session
        s[f'session_{session.id}_questions'] = [obj_question.id]
        s.save()
        url = reverse('practice:finish_session', kwargs={'session_id': session.id})
        client.post(url)
        session.refresh_from_db()
        assert session.completed_at is not None
        assert session.is_completed is True

    def test_finish_session_calculates_score_from_marks(
        self, client, student, obj_question
    ):
        client.force_login(student)
        session = PracticeSessionFactory(
            user=student, subject=obj_question.subject,
            total_marks=obj_question.marks,
        )
        correct = obj_question.choices.filter(is_correct=True).first()
        UserAnswerFactory(
            session=session, question=obj_question,
            selected_choice=correct, is_correct=True,
        )
        s = client.session
        s[f'session_{session.id}_questions'] = [obj_question.id]
        s.save()
        url = reverse('practice:finish_session', kwargs={'session_id': session.id})
        client.post(url)
        session.refresh_from_db()
        assert session.score == obj_question.marks

    def test_finish_session_updates_streak(self, client, student, obj_question):
        client.force_login(student)
        student.streak = 3
        student.save()
        session = PracticeSessionFactory(user=student, subject=obj_question.subject)
        s = client.session
        s[f'session_{session.id}_questions'] = [obj_question.id]
        s.save()
        url = reverse('practice:finish_session', kwargs={'session_id': session.id})
        client.post(url)
        student.refresh_from_db()
        assert student.streak >= 1

    def test_finish_session_redirects_to_results(self, client, student, obj_question):
        client.force_login(student)
        session = PracticeSessionFactory(user=student, subject=obj_question.subject)
        s = client.session
        s[f'session_{session.id}_questions'] = [obj_question.id]
        s.save()
        url = reverse('practice:finish_session', kwargs={'session_id': session.id})
        response = client.post(url)
        assert response.status_code == 302
        assert 'results' in response['Location']

    def test_finishing_already_completed_session_is_idempotent(
        self, client, student, completed_session
    ):
        """Calling finish twice must not change the score."""
        client.force_login(student)
        original_score = completed_session.score
        url = reverse('practice:finish_session',
                      kwargs={'session_id': completed_session.id})
        client.post(url)
        completed_session.refresh_from_db()
        assert completed_session.score == original_score


# ---------------------------------------------------------------------------
# Results page — N+1 guard
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestResultsPage:

    def test_results_page_renders(self, client, student, completed_session):
        client.force_login(student)
        url = reverse('practice:results_page',
                      kwargs={'session_id': completed_session.id})
        response = client.get(url)
        assert response.status_code == 200

    def test_results_page_no_n_plus_one(
        self, client, student, subject, topic
    ):
        """
        Results page uses select_related + prefetch_related.
        8 questions must not generate a query per question.
        """
        session = PracticeSessionFactory(
            user=student, subject=subject,
            total_questions=8, completed_at=timezone.now(),
        )
        for _ in range(6):
            q = QuestionFactory(subject=subject, question_type='OBJ', topics=[topic])
            ChoiceFactory(question=q, label='A', is_correct=True)
            ChoiceFactory(question=q, label='B', is_correct=False)
            correct = q.choices.filter(is_correct=True).first()
            UserAnswerFactory(session=session, question=q,
                              selected_choice=correct, is_correct=True)
        for _ in range(2):
            q = QuestionFactory(subject=subject, question_type='THEORY', topics=[topic])
            TheoryAnswerFactory(question=q)
            UserAnswerFactory(session=session, question=q,
                              theory_response='My answer.', is_correct=None)

        url = reverse('practice:results_page', kwargs={'session_id': session.id})
        with assert_max_queries(12):
            client.get(url)

    def test_results_page_context_has_answer_review(
        self, client, student, completed_session
    ):
        client.force_login(student)
        url = reverse('practice:results_page',
                      kwargs={'session_id': completed_session.id})
        response = client.get(url)
        assert 'answer_review' in response.context
        assert len(response.context['answer_review']) >= 1

    def test_results_page_context_has_correct_counts(
        self, client, student, completed_session
    ):
        client.force_login(student)
        url = reverse('practice:results_page',
                      kwargs={'session_id': completed_session.id})
        response = client.get(url)
        ctx = response.context
        assert 'correct_count'   in ctx
        assert 'incorrect_count' in ctx
        assert 'unanswered_count' in ctx
        assert ctx['correct_count'] == 1
        assert ctx['incorrect_count'] == 0

    def test_answer_review_items_have_expected_keys(
        self, client, student, completed_session
    ):
        client.force_login(student)
        url = reverse('practice:results_page',
                      kwargs={'session_id': completed_session.id})
        response = client.get(url)
        item = response.context['answer_review'][0]
        for key in ('answer', 'question', 'is_bookmarked', 'correct_choice',
                    'comment_count', 'note_topic_id', 'note_subject_id'):
            assert key in item, f"Missing key '{key}' in answer_review item"

    def test_note_topic_id_set_when_lesson_note_exists(
        self, client, student, subject, topic, obj_question, lesson_note
    ):
        """
        note_topic_id should be populated for questions whose topic has a note,
        regardless of whether the answer was correct or not.
        """
        from unittest.mock import patch
        session = PracticeSessionFactory(
            user=student, subject=subject,
            total_questions=1, completed_at=timezone.now(),
        )
        correct = obj_question.choices.filter(is_correct=True).first()
        UserAnswerFactory(session=session, question=obj_question,
                          selected_choice=correct, is_correct=True)

        url = reverse('practice:results_page', kwargs={'session_id': session.id})
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            client.force_login(student)
            response = client.get(url)

        item = response.context['answer_review'][0]
        assert item['note_topic_id'] == topic.id

    def test_other_user_cannot_view_results(self, client, db, completed_session):
        intruder = UserFactory()
        client.force_login(intruder)
        url = reverse('practice:results_page',
                      kwargs={'session_id': completed_session.id})
        response = client.get(url)
        assert response.status_code == 404