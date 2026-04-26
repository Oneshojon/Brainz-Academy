"""
Integration tests: subscriptions, feature flags, comments, bookmarks,
past papers (namespace: past_papers), lesson notes (namespace: lessonnotes),
revision, history, analytics.

URL namespaces confirmed:
  practice, teacher, Users, past_papers, lessonnotes, catalog, payments, frontend
"""

import pytest
import json
from django.urls import reverse

from tests.conftest import assert_max_queries
from tests.conftest import (
    QuestionFactory, ChoiceFactory, PracticeSessionFactory,
    UserAnswerFactory, QuestionCommentFactory, BookmarkFactory,
    UserFactory, UserSubscriptionFactory, SubscriptionPlanFactory,
)


# ---------------------------------------------------------------------------
# Subscription / feature flag gating
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSubscriptionGating:

    def test_free_user_can_start_session(self, client, free_user, subject, obj_question):
        client.force_login(free_user)
        url = reverse('practice:start_session')
        response = client.post(url, {
            'subject': subject.id,
            'session_type': 'EXAM',
            'num_questions': 50,
        })
        assert response.status_code == 302

    def test_paid_user_gets_unlimited_questions(self, paid_user):
        from catalog.subscription_access import check_practice_access
        access = check_practice_access(paid_user)
        assert access['is_free'] is False
        assert access['max_questions'] == 9999

    def test_free_user_is_capped(self, free_user):
        from catalog.subscription_access import check_practice_access
        access = check_practice_access(free_user)
        assert access['is_free'] is True
        assert access['max_questions'] < 9999

    def test_check_practice_access_allowed_for_paid_user(self, paid_user):
        from catalog.subscription_access import check_practice_access
        access = check_practice_access(paid_user)
        assert access['allowed'] is True

    def test_has_subscription_true_for_paid_user(self, paid_user):
        from catalog.subscription_access import has_subscription
        assert has_subscription(paid_user) is True

    def test_has_subscription_false_for_free_user(self, free_user):
        from catalog.subscription_access import has_subscription
        # Only false when subscription_required=True in PlatformSettings
        from unittest.mock import patch
        with patch('catalog.subscription_access._platform_settings') as mock_ps:
            mock_ps.return_value.subscription_required = True
            result = has_subscription(free_user)
        assert result is False

    def test_admin_always_has_unlimited_access(self, admin_user):
        from catalog.subscription_access import check_practice_access
        access = check_practice_access(admin_user)
        assert access['allowed'] is True
        assert access['max_questions'] == 9999
        assert access['is_free'] is False

    def test_feature_flags_cached_after_first_call(self, django_assert_num_queries):
        from catalog.cache_utils import get_feature_flags
        from django.core.cache import cache
        cache.clear()
        get_feature_flags()
        with django_assert_num_queries(0):
            get_feature_flags()


# ---------------------------------------------------------------------------
# Comments (discussion)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestQuestionComments:

    def test_get_comments_returns_ok_json(self, client, student, obj_question):
        client.force_login(student)
        url = reverse('practice:question_comments',
                      kwargs={'question_id': obj_question.id})
        response = client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert data['ok'] is True
        assert 'comments' in data
        assert 'can_post' in data

    def test_get_comments_includes_explanation_for_obj(
        self, client, student, obj_question
    ):
        correct = obj_question.choices.filter(is_correct=True).first()
        correct.explanation = 'Light travels at 3×10⁸ m/s.'
        correct.save()
        client.force_login(student)
        url = reverse('practice:question_comments',
                      kwargs={'question_id': obj_question.id})
        response = client.get(url)
        assert response.json()['explanation'] is not None

    def test_paid_user_can_post_comment(self, client, paid_user, obj_question):
        client.force_login(paid_user)
        url = reverse('practice:question_comments',
                      kwargs={'question_id': obj_question.id})
        response = client.post(
            url,
            data=json.dumps({'body': 'Great explanation!'}),
            content_type='application/json',
        )
        assert response.status_code == 201
        assert response.json()['ok'] is True

    def test_free_user_cannot_post_comment(self, client, free_user, obj_question):
        client.force_login(free_user)
        url = reverse('practice:question_comments',
                      kwargs={'question_id': obj_question.id})
        from unittest.mock import patch
        with patch('catalog.subscription_access.has_subscription', return_value=False):
            response = client.post(
                url,
                data=json.dumps({'body': 'I want to comment.'}),
                content_type='application/json',
            )
        assert response.status_code == 403
        assert response.json()['error'] == 'upgrade_required'

    def test_empty_comment_body_rejected(self, client, paid_user, obj_question):
        client.force_login(paid_user)
        url = reverse('practice:question_comments',
                      kwargs={'question_id': obj_question.id})
        response = client.post(
            url,
            data=json.dumps({'body': '   '}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_comment_over_1200_chars_rejected(self, client, paid_user, obj_question):
        client.force_login(paid_user)
        url = reverse('practice:question_comments',
                      kwargs={'question_id': obj_question.id})
        response = client.post(
            url,
            data=json.dumps({'body': 'x' * 1201}),
            content_type='application/json',
        )
        assert response.status_code == 400

    def test_author_can_soft_delete_own_comment(
        self, client, student, obj_question
    ):
        comment = QuestionCommentFactory(question=obj_question, author=student)
        client.force_login(student)
        url = reverse('practice:delete_comment', kwargs={
            'question_id': obj_question.id,
            'comment_id':  comment.id,
        })
        response = client.delete(url)
        assert response.status_code == 200
        comment.refresh_from_db()
        assert comment.is_hidden is True  # soft delete, not hard

    def test_user_cannot_delete_others_comment(self, client, student, db):
        other   = UserFactory()
        comment = QuestionCommentFactory(author=other)
        client.force_login(student)
        url = reverse('practice:delete_comment', kwargs={
            'question_id': comment.question.id,
            'comment_id':  comment.id,
        })
        response = client.delete(url)
        assert response.status_code == 404

    def test_hidden_comments_not_returned_in_get(
        self, client, student, obj_question
    ):
        QuestionCommentFactory(
            question=obj_question, author=student, is_hidden=True
        )
        client.force_login(student)
        url = reverse('practice:question_comments',
                      kwargs={'question_id': obj_question.id})
        data = client.get(url).json()
        assert len(data['comments']) == 0


# ---------------------------------------------------------------------------
# Bookmarks
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestBookmarks:

    def test_toggle_creates_bookmark(self, client, student, obj_question):
        client.force_login(student)
        url = reverse('practice:toggle_bookmark')
        response = client.post(
            url,
            data=json.dumps({'question_id': obj_question.id}),
            content_type='application/json',
        )
        assert response.status_code == 200
        assert response.json()['bookmarked'] is True

    def test_toggle_removes_existing_bookmark(self, client, student, obj_question):
        BookmarkFactory(user=student, question=obj_question)
        client.force_login(student)
        url = reverse('practice:toggle_bookmark')
        response = client.post(
            url,
            data=json.dumps({'question_id': obj_question.id}),
            content_type='application/json',
        )
        assert response.json()['bookmarked'] is False

    def test_bookmarks_page_renders(self, client, student, obj_question):
        BookmarkFactory(user=student, question=obj_question)
        client.force_login(student)
        url = reverse('practice:bookmarks')
        assert client.get(url).status_code == 200

    def test_bookmarks_grouped_by_subject(self, client, student, subject, obj_question):
        BookmarkFactory(user=student, question=obj_question)
        client.force_login(student)
        response = client.get(reverse('practice:bookmarks'))
        grouped = response.context['grouped_bookmarks']
        assert subject.name in grouped

    def test_unauthenticated_redirected_from_bookmarks(self, client):
        assert client.get(reverse('practice:bookmarks')).status_code == 302


# ---------------------------------------------------------------------------
# Past papers  (namespace: past_papers)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPastPapers:

    def test_past_papers_boards_page_renders(self, client, student):
        client.force_login(student)
        url = reverse('past_papers:past_papers_boards')
        assert client.get(url).status_code == 200

    def test_past_papers_boards_page_shows_board_name(self, client, student, past_paper):
        """Boards page shows board abbreviation/name, not subject name."""
        client.force_login(student)
        url = reverse('past_papers:past_papers_boards')
        response = client.get(url)
        # Page shows board abbreviation (e.g. "BRD33") not subject name
        assert past_paper.exam_series.exam_board.abbreviation in response.content.decode()

    def test_past_papers_filtered_by_board(self, client, student, past_paper):
        """Papers page filters by ?board= not ?subject=."""
        client.force_login(student)
        url = reverse('past_papers:past_papers')
        response = client.get(url, {
            'board': past_paper.exam_series.exam_board.id
        })
        assert response.status_code == 200

    def test_unauthenticated_cannot_view_past_papers(self, client):
        url = reverse('past_papers:past_papers_boards')
        assert client.get(url).status_code == 302

    def test_admin_can_access_upload_page(self, client, admin_user):
        client.force_login(admin_user)
        url = reverse('teacher:upload_past_paper')
        assert client.get(url).status_code == 200

    def test_student_cannot_access_upload_page(self, client, student):
        client.force_login(student)
        url = reverse('teacher:upload_past_paper')
        assert client.get(url).status_code in (302, 403)


# ---------------------------------------------------------------------------
# Lesson notes  (namespace: lessonnotes)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestLessonNotes:

    def test_lesson_notes_page_renders_for_admin(self, client, admin_user):
        from unittest.mock import patch
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            client.force_login(admin_user)
            assert client.get(reverse('lessonnotes:lesson_notes')).status_code == 200

    def test_lesson_notes_filters_by_subject(
        self, client, admin_user, subject, topic, lesson_note
    ):
        from unittest.mock import patch
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            client.force_login(admin_user)
            response = client.get(
                reverse('lessonnotes:lesson_notes'),
                {'subject': subject.id}
            )
            assert response.status_code == 200

    def test_lesson_notes_filters_by_topic(
        self, client, admin_user, subject, topic, lesson_note
    ):
        from unittest.mock import patch
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            client.force_login(admin_user)
            response = client.get(
                reverse('lessonnotes:lesson_notes'),
                {'subject': subject.id, 'topic': topic.id}
            )
            assert response.status_code == 200

    def test_lesson_notes_gated_by_feature_flag(self, client, student):
        from unittest.mock import patch
        with patch('catalog.feature_flags.is_feature_enabled', return_value=False):
            client.force_login(student)
            response = client.get(reverse('lessonnotes:lesson_notes'))
            assert response.status_code in (302, 403)


# ---------------------------------------------------------------------------
# Revision
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestRevision:

    def test_revision_page_renders(self, client, student):
        client.force_login(student)
        assert client.get(reverse('practice:revision')).status_code == 200

    def test_revision_shows_topics_for_subject(self, client, student, subject, topic):
        client.force_login(student)
        response = client.get(reverse('practice:revision'), {'subject': subject.id})
        assert topic in response.context['topics']

    def test_revision_shows_questions_for_topic(
        self, client, student, subject, topic, obj_question
    ):
        client.force_login(student)
        response = client.get(
            reverse('practice:revision'),
            {'subject': subject.id, 'topic': topic.id}
        )
        ids = [item['question'].id for item in response.context['questions']]
        assert obj_question.id in ids

    def test_revision_marks_bookmarked_questions(
        self, client, student, subject, topic, obj_question
    ):
        BookmarkFactory(user=student, question=obj_question)
        client.force_login(student)
        response = client.get(
            reverse('practice:revision'),
            {'subject': subject.id, 'topic': topic.id}
        )
        bookmarked = [
            item for item in response.context['questions']
            if item['is_bookmarked']
        ]
        assert any(item['question'].id == obj_question.id for item in bookmarked)

    def test_revision_no_n_plus_one(
        self, client, student, subject, topic
    ):
        for _ in range(10):
            q = QuestionFactory(subject=subject, question_type='OBJ', topics=[topic])
            ChoiceFactory(question=q, label='A', is_correct=True)

        client.force_login(student)
        with assert_max_queries(18):
            client.get(
                reverse('practice:revision'),
                {'subject': subject.id, 'topic': topic.id}
            )

    def test_unauthenticated_redirected_from_revision(self, client):
        assert client.get(reverse('practice:revision')).status_code == 302


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestHistory:

    def test_history_page_renders(self, client, student, completed_session):
        client.force_login(student)
        assert client.get(reverse('practice:history')).status_code == 200

    def test_history_shows_completed_sessions(
        self, client, student, completed_session
    ):
        client.force_login(student)
        response = client.get(reverse('practice:history'))
        sessions = list(response.context['sessions'])
        assert any(s.id == completed_session.id for s in sessions)

    def test_history_excludes_incomplete_sessions(self, client, student, subject):
        PracticeSessionFactory(user=student, subject=subject, completed_at=None)
        client.force_login(student)
        response = client.get(reverse('practice:history'))
        for s in response.context['sessions']:
            assert s.completed_at is not None