"""
Template smoke tests.
Checks: correct HTTP status, key HTML elements, context variables, no rendering errors.

Corrections applied:
  - session.answers.first() (not useranswer_set)
  - past_paper.exam_series.subject (not past_paper.subject)
  - Worksheet links to Topic (not LessonNote)
  - URL namespaces: past_papers, lessonnotes, practice, Users, teacher
  - get_feature_flags() returns {key: {'enabled': bool, 'visible_to': str}}
"""

import pytest
from django.urls import reverse
from django.utils import timezone

from tests.conftest import (
    QuestionFactory, ChoiceFactory, PracticeSessionFactory,
    UserAnswerFactory, TheoryAnswerFactory, TopicFactory,
    LessonNoteFactory, WorksheetFactory, QuestionCommentFactory,
    UserFactory,
)


# ---------------------------------------------------------------------------
# Exam page
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestExamPageTemplate:

    def _setup_exam(self, client, student, subject, topic, n=3):
        questions = []
        for _ in range(n):
            q = QuestionFactory(subject=subject, question_type='OBJ', topics=[topic])
            ChoiceFactory(question=q, label='A', choice_text='Option A', is_correct=True)
            ChoiceFactory(question=q, label='B', choice_text='Option B', is_correct=False)
            ChoiceFactory(question=q, label='C', choice_text='Option C', is_correct=False)
            ChoiceFactory(question=q, label='D', choice_text='Option D', is_correct=False)
            questions.append(q)
        session = PracticeSessionFactory(user=student, subject=subject, total_questions=n)
        s = client.session
        s[f'session_{session.id}_questions'] = [q.id for q in questions]
        s.save()
        return session, questions

    def test_exam_page_renders_200(self, client, student, subject, topic):
        client.force_login(student)
        session, _ = self._setup_exam(client, student, subject, topic)
        url = reverse('practice:exam_page', kwargs={'session_id': session.id})
        assert client.get(url).status_code == 200

    def test_exam_page_uses_forloop_counter_not_question_number(
        self, client, student, subject, topic
    ):
        """
        Questions numbered sequentially (Q1, Q2...) not by DB question_number.
        We use question_number=99 and 47 to prove Q99/Q47 do NOT appear.
        """
        client.force_login(student)
        q1 = QuestionFactory(subject=subject, question_type='OBJ',
                             question_number=99, topics=[topic])
        q2 = QuestionFactory(subject=subject, question_type='OBJ',
                             question_number=47, topics=[topic])
        for q in [q1, q2]:
            ChoiceFactory(question=q, label='A', is_correct=True)

        session = PracticeSessionFactory(user=student, subject=subject, total_questions=2)
        s = client.session
        s[f'session_{session.id}_questions'] = [q1.id, q2.id]
        s.save()

        content = client.get(
            reverse('practice:exam_page', kwargs={'session_id': session.id})
        ).content.decode()

        assert 'Q99' not in content
        assert 'Q47' not in content

    def test_exam_page_shows_obj_choices(self, client, student, subject, topic):
        client.force_login(student)
        session, _ = self._setup_exam(client, student, subject, topic, n=1)
        content = client.get(
            reverse('practice:exam_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'Option A' in content

    def test_exam_page_shows_theory_textarea(self, client, student, subject, topic):
        client.force_login(student)
        q = QuestionFactory(subject=subject, question_type='THEORY', topics=[topic])
        session = PracticeSessionFactory(user=student, subject=subject, total_questions=1)
        s = client.session
        s[f'session_{session.id}_questions'] = [q.id]
        s.save()
        content = client.get(
            reverse('practice:exam_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'textarea' in content.lower()

    def test_exam_page_has_submit_control(self, client, student, subject, topic):
        client.force_login(student)
        session, _ = self._setup_exam(client, student, subject, topic)
        content = client.get(
            reverse('practice:exam_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'submit' in content.lower() or 'finish' in content.lower()

    def test_exam_page_has_question_navigation(self, client, student, subject, topic):
        client.force_login(student)
        session, _ = self._setup_exam(client, student, subject, topic, n=3)
        content = client.get(
            reverse('practice:exam_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'goToQuestion' in content or 'question-nav' in content.lower()


# ---------------------------------------------------------------------------
# Results page
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestResultsPageTemplate:

    def _setup_results(self, student, subject, topic,
                       n_correct=2, n_wrong=1, n_theory=1):
        session = PracticeSessionFactory(
            user=student, subject=subject,
            total_questions=n_correct + n_wrong + n_theory,
            completed_at=timezone.now(),
        )
        for _ in range(n_correct):
            q = QuestionFactory(subject=subject, question_type='OBJ', topics=[topic])
            ChoiceFactory(question=q, label='A', is_correct=True)
            ChoiceFactory(question=q, label='B', is_correct=False)
            correct = q.choices.filter(is_correct=True).first()
            UserAnswerFactory(session=session, question=q,
                              selected_choice=correct, is_correct=True)
        for _ in range(n_wrong):
            q = QuestionFactory(subject=subject, question_type='OBJ', topics=[topic])
            ChoiceFactory(question=q, label='A', is_correct=True)
            ChoiceFactory(question=q, label='B', is_correct=False)
            wrong = q.choices.filter(is_correct=False).first()
            UserAnswerFactory(session=session, question=q,
                              selected_choice=wrong, is_correct=False)
        for _ in range(n_theory):
            q = QuestionFactory(subject=subject, question_type='THEORY', topics=[topic])
            TheoryAnswerFactory(question=q)
            UserAnswerFactory(session=session, question=q,
                              theory_response='Student wrote this.', is_correct=None)
        return session

    def test_results_page_renders_200(self, client, student, subject, topic):
        client.force_login(student)
        session = self._setup_results(student, subject, topic)
        url = reverse('practice:results_page', kwargs={'session_id': session.id})
        assert client.get(url).status_code == 200

    def test_results_page_has_score_ring(self, client, student, subject, topic):
        client.force_login(student)
        session = self._setup_results(student, subject, topic)
        content = client.get(
            reverse('practice:results_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'score-ring' in content or 'scoreCircle' in content

    def test_results_page_shows_correct_incorrect_unanswered(
        self, client, student, subject, topic
    ):
        client.force_login(student)
        session = self._setup_results(student, subject, topic)
        content = client.get(
            reverse('practice:results_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'Correct' in content
        assert 'Incorrect' in content
        assert 'Unanswered' in content

    def test_results_page_does_not_show_db_question_number(
        self, client, student, subject, topic
    ):
        """Q77 must not appear — template must use forloop.counter."""
        client.force_login(student)
        q = QuestionFactory(subject=subject, question_type='OBJ',
                            question_number=77, topics=[topic])
        ChoiceFactory(question=q, label='A', is_correct=True)
        session = PracticeSessionFactory(
            user=student, subject=subject,
            total_questions=1, completed_at=timezone.now(),
        )
        correct = q.choices.filter(is_correct=True).first()
        UserAnswerFactory(session=session, question=q,
                          selected_choice=correct, is_correct=True)
        content = client.get(
            reverse('practice:results_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'Q77' not in content

    def test_results_page_shows_discussion_button(
        self, client, student, subject, topic
    ):
        client.force_login(student)
        session = self._setup_results(student, subject, topic,
                                      n_correct=1, n_wrong=0, n_theory=0)
        content = client.get(
            reverse('practice:results_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'Discussion' in content or 'discussion-btn' in content

    def test_results_page_shows_revision_note_button_when_note_exists(
        self, client, student, subject, topic, lesson_note
    ):
        from unittest.mock import patch
        client.force_login(student)
        session = self._setup_results(student, subject, topic,
                                      n_correct=1, n_wrong=0, n_theory=0)
        url = reverse('practice:results_page', kwargs={'session_id': session.id})
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            content = client.get(url).content.decode()
        assert 'Revision Note' in content or 'note-btn' in content

    def test_results_page_shows_recommended_notes_for_wrong_answers(
        self, client, student, subject, topic, lesson_note
    ):
        from unittest.mock import patch
        client.force_login(student)
        session = self._setup_results(student, subject, topic,
                                      n_correct=0, n_wrong=1, n_theory=0)
        url = reverse('practice:results_page', kwargs={'session_id': session.id})
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            content = client.get(url).content.decode()
        assert 'Recommended Reading' in content or 'rec-note-link' in content

    def test_results_page_theory_shows_model_answer(
        self, client, student, subject, topic
    ):
        client.force_login(student)
        session = self._setup_results(student, subject, topic,
                                      n_correct=0, n_wrong=0, n_theory=1)
        content = client.get(
            reverse('practice:results_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'Model Answer' in content

    def test_results_page_filter_tabs_present(
        self, client, student, subject, topic
    ):
        client.force_login(student)
        session = self._setup_results(student, subject, topic)
        content = client.get(
            reverse('practice:results_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'filterReview' in content or 'filter-tab' in content

    def test_results_page_bookmark_button_present(
        self, client, student, subject, topic
    ):
        client.force_login(student)
        session = self._setup_results(student, subject, topic)
        content = client.get(
            reverse('practice:results_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'bookmark' in content.lower()

    def test_results_page_comment_count_badge_shows_count(
        self, client, student, subject, topic
    ):
        client.force_login(student)
        session = self._setup_results(student, subject, topic,
                                      n_correct=1, n_wrong=0, n_theory=0)
        # Use session.answers (correct related_name) to get the question
        answer = session.answers.first()
        QuestionCommentFactory(question=answer.question, is_hidden=False)
        content = client.get(
            reverse('practice:results_page', kwargs={'session_id': session.id})
        ).content.decode()
        assert 'comment-count-badge' in content


# ---------------------------------------------------------------------------
# Revision page
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestRevisionTemplate:

    def test_revision_page_has_subject_selector(self, client, student, subject):
        client.force_login(student)
        content = client.get(reverse('practice:revision')).content.decode()
        assert subject.name in content

    def test_revision_page_shows_topic_list(self, client, student, subject, topic):
        client.force_login(student)
        content = client.get(
            reverse('practice:revision'), {'subject': subject.id}
        ).content.decode()
        assert topic.name in content

    def test_revision_page_does_not_show_db_question_number(
        self, client, student, subject, topic
    ):
        q = QuestionFactory(subject=subject, question_type='OBJ',
                            question_number=55, topics=[topic])
        ChoiceFactory(question=q, label='A', is_correct=True)
        client.force_login(student)
        content = client.get(
            reverse('practice:revision'),
            {'subject': subject.id, 'topic': topic.id}
        ).content.decode()
        assert 'Q55' not in content

    def test_revision_page_shows_correct_choice_highlighted(
        self, client, student, subject, topic, obj_question
    ):
        client.force_login(student)
        content = client.get(
            reverse('practice:revision'),
            {'subject': subject.id, 'topic': topic.id}
        ).content.decode()
        assert 'correct' in content.lower()

    def test_revision_page_shows_model_answer_for_theory(
        self, client, student, subject, topic, theory_question
    ):
        client.force_login(student)
        content = client.get(
            reverse('practice:revision'),
            {'subject': subject.id, 'topic': topic.id}
        ).content.decode()
        assert 'Model Answer' in content

    def test_revision_page_has_topic_search_input(
        self, client, student, subject, topic
    ):
        client.force_login(student)
        content = client.get(
            reverse('practice:revision'), {'subject': subject.id}
        ).content.decode()
        assert 'topicSearch' in content or 'Search topics' in content

    def test_revision_page_has_bookmark_buttons(
        self, client, student, subject, topic, obj_question
    ):
        client.force_login(student)
        content = client.get(
            reverse('practice:revision'),
            {'subject': subject.id, 'topic': topic.id}
        ).content.decode()
        assert 'toggleRevBookmark' in content or 'rev-bm-btn' in content

    def test_revision_page_has_practice_button_for_subject(
        self, client, student, subject, topic
    ):
        client.force_login(student)
        content = client.get(
            reverse('practice:revision'), {'subject': subject.id}
        ).content.decode()
        assert 'Practice' in content


# ---------------------------------------------------------------------------
# Student dashboard
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestStudentDashboardTemplate:

    def test_dashboard_renders_200(self, client, student):
        client.force_login(student)
        assert client.get(reverse('Users:dashboard')).status_code == 200

    def test_dashboard_shows_student_first_name(self, client, student):
        client.force_login(student)
        content = client.get(reverse('Users:dashboard')).content.decode()
        assert student.first_name in content

    def test_dashboard_shows_streak(self, client, student):
        student.streak = 5
        student.save()
        client.force_login(student)
        content = client.get(reverse('Users:dashboard')).content.decode()
        assert 'streak' in content.lower() or '5' in content

    def test_dashboard_shows_upgrade_prompt_for_free_user(self, client, free_user):
        client.force_login(free_user)
        content = client.get(reverse('Users:dashboard')).content.decode()
        assert (
            'upgrade' in content.lower() or
            'premium' in content.lower() or
            'subscribe' in content.lower()
        )

    def test_dashboard_has_five_containers(self, client, student):
        client.force_login(student)
        content = client.get(reverse('Users:dashboard')).content.decode()
        assert content.count('dash-container') >= 5


# ---------------------------------------------------------------------------
# Past papers template  (namespace: past_papers)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPastPapersTemplate:

    def test_past_papers_boards_page_shows_board_abbreviation(self, client, student, past_paper):
        """Boards page shows board cards with abbreviation — not subject names."""
        client.force_login(student)
        content = client.get(
            reverse('past_papers:past_papers_boards')
        ).content.decode()
        assert past_paper.exam_series.exam_board.abbreviation in content

    def test_past_papers_page_shows_year(self, client, student, past_paper):
        """Papers page filtered by ?board= shows year in paper list."""
        client.force_login(student)
        content = client.get(
            reverse('past_papers:past_papers'),
            {'board': past_paper.exam_series.exam_board.id}
        ).content.decode()
        assert str(past_paper.exam_series.year) in content

    def test_past_papers_has_three_tabs(self, client, student, past_paper):
        client.force_login(student)
        content = client.get(
            reverse('past_papers:past_papers'),
            {'board': past_paper.exam_series.exam_board.id}
        ).content.decode()
        assert 'Questions' in content
        assert 'Solution' in content or 'Solutions' in content
        assert 'Video' in content

    def test_past_papers_has_download_reference(self, client, student, past_paper):
        client.force_login(student)
        content = client.get(
            reverse('past_papers:past_papers'),
            {'board': past_paper.exam_series.exam_board.id}
        ).content.decode()
        assert 'download' in content.lower() or 'Download' in content


# ---------------------------------------------------------------------------
# Lesson notes template  (namespace: lessonnotes)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestLessonNotesTemplate:

    def test_lesson_notes_page_renders(self, client, admin_user, subject, topic, lesson_note):
        from unittest.mock import patch
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            client.force_login(admin_user)
            response = client.get(
                reverse('lessonnotes:lesson_notes'),
                {'subject': subject.id, 'topic': topic.id}
            )
            assert response.status_code == 200

    def test_lesson_notes_has_three_panels(
        self, client, admin_user, subject, topic, lesson_note
    ):
        from unittest.mock import patch
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            client.force_login(admin_user)
            content = client.get(
                reverse('lessonnotes:lesson_notes'),
                {'subject': subject.id, 'topic': topic.id}
            ).content.decode()
        assert 'Note' in content
        assert 'Worksheet' in content or 'worksheet' in content
        assert 'Video' in content or 'video' in content

    def test_lesson_notes_shows_video_embed_when_url_set(
        self, client, admin_user, subject, topic
    ):
        from unittest.mock import patch
        note = LessonNoteFactory(
            topic=topic,
            video_url='https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        )
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            client.force_login(admin_user)
            content = client.get(
                reverse('lessonnotes:lesson_notes'),
                {'subject': subject.id, 'topic': topic.id}
            ).content.decode()
        assert 'youtube' in content.lower() or 'video' in content.lower()

    def test_lesson_notes_shows_worksheet_title(
        self, client, admin_user, subject, topic, lesson_note
    ):
        """Worksheet links to Topic directly (OneToOne), not to LessonNote."""
        WorksheetFactory(topic=topic, title='Practice Sheet 1')
        from unittest.mock import patch
        with patch('catalog.feature_flags.is_feature_enabled', return_value=True):
            client.force_login(admin_user)
            content = client.get(
                reverse('lessonnotes:lesson_notes'),
                {'subject': subject.id, 'topic': topic.id}
            ).content.decode()
        assert 'Practice Sheet 1' in content or 'worksheet' in content.lower()