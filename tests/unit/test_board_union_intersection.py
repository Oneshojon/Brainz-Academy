"""
Tests for the WAEC+NECO combined board feature:
  - Subjects: INTERSECTION (only subjects with data for both boards)
  - Years, topics, questions: UNION (combined pool across both boards)
  - "All Boards" (no exam_board param): fully unfiltered
  - Random Test Builder ordering rule (_should_randomize)
  - Years cache invalidation for multi-board-id cache key variants
"""
import pytest
from django.core.cache import cache
from django.urls import reverse

from catalog.cache_utils import (
    get_available_years,
    get_topics_for_theme_with_counts,
    invalidate_subject_caches,
    KEY_AVAILABLE_YEARS,
    KEY_AVAILABLE_YEARS_KNOWN,
)
from catalog.views import _should_randomize
from tests.conftest import (
    SubjectFactory, ExamBoardFactory, ExamSeriesFactory, QuestionFactory,
    ThemeFactory, TopicFactory, TeacherUserFactory,
    SubscriptionPlanFactory, UserSubscriptionFactory,
)


@pytest.mark.django_db
class TestAvailableYearsUnion:

    def test_single_board_id_unchanged_behaviour(self, subject):
        board = ExamBoardFactory()
        series = ExamSeriesFactory(subject=subject, exam_board=board, year=2021)
        QuestionFactory(subject=subject, exam_series=series)

        years = get_available_years(subject.id, str(board.id))
        assert years == [2021]

    def test_multiple_board_ids_returns_union(self, subject):
        board_a = ExamBoardFactory()
        board_b = ExamBoardFactory()

        series_a = ExamSeriesFactory(subject=subject, exam_board=board_a, year=2019)
        QuestionFactory(subject=subject, exam_series=series_a)

        series_b = ExamSeriesFactory(subject=subject, exam_board=board_b, year=2022)
        QuestionFactory(subject=subject, exam_series=series_b)

        years = get_available_years(subject.id, f'{board_a.id},{board_b.id}')
        assert years == [2019, 2022]

    def test_multiple_board_ids_deduplicates_shared_year(self, subject):
        board_a = ExamBoardFactory()
        board_b = ExamBoardFactory()

        series_a = ExamSeriesFactory(subject=subject, exam_board=board_a, year=2020)
        QuestionFactory(subject=subject, exam_series=series_a)

        series_b = ExamSeriesFactory(subject=subject, exam_board=board_b, year=2020)
        QuestionFactory(subject=subject, exam_series=series_b)

        years = get_available_years(subject.id, f'{board_a.id},{board_b.id}')
        assert years == [2020]


@pytest.mark.django_db
class TestTopicsForThemeUnion:

    def test_multiple_board_ids_counts_union_of_questions(self, subject, topic):
        theme = ThemeFactory(subject=subject)
        topic.theme = theme
        topic.save()

        board_a = ExamBoardFactory()
        board_b = ExamBoardFactory()

        series_a = ExamSeriesFactory(subject=subject, exam_board=board_a)
        q_a = QuestionFactory(subject=subject, exam_series=series_a, topics=[topic])

        series_b = ExamSeriesFactory(subject=subject, exam_board=board_b)
        q_b = QuestionFactory(subject=subject, exam_series=series_b, topics=[topic])

        result = get_topics_for_theme_with_counts(theme.id, f'{board_a.id},{board_b.id}')
        topic_result = next(t for t in result if t['id'] == topic.id)

        assert topic_result['question_count'] == 2

    def test_single_board_id_excludes_other_boards_questions(self, subject, topic):
        theme = ThemeFactory(subject=subject)
        topic.theme = theme
        topic.save()

        board_a = ExamBoardFactory()
        board_b = ExamBoardFactory()

        series_a = ExamSeriesFactory(subject=subject, exam_board=board_a)
        QuestionFactory(subject=subject, exam_series=series_a, topics=[topic])

        series_b = ExamSeriesFactory(subject=subject, exam_board=board_b)
        QuestionFactory(subject=subject, exam_series=series_b, topics=[topic])

        result = get_topics_for_theme_with_counts(theme.id, str(board_a.id))
        topic_result = next(t for t in result if t['id'] == topic.id)

        assert topic_result['question_count'] == 1


@pytest.mark.django_db
class TestQuestionsByTopicUnion:

    URL = '/api/catalog/questions-by-topic/'

    def _login_any_user(self, client, student):
        client.force_login(student)

    def test_multiple_board_ids_returns_union_of_questions(self, client, student, subject, topic):
        self._login_any_user(client, student)

        board_a = ExamBoardFactory()
        board_b = ExamBoardFactory()

        series_a = ExamSeriesFactory(subject=subject, exam_board=board_a)
        q_a = QuestionFactory(subject=subject, exam_series=series_a, topics=[topic])

        series_b = ExamSeriesFactory(subject=subject, exam_board=board_b)
        q_b = QuestionFactory(subject=subject, exam_series=series_b, topics=[topic])

        response = client.get(self.URL, {
            'topic': topic.id,
            'exam_board': f'{board_a.id},{board_b.id}',
        })
        data = response.json()
        returned_ids = {q['id'] for q in data}

        assert returned_ids == {q_a.id, q_b.id}

    def test_no_board_param_returns_all_boards(self, client, student, subject, topic):
        self._login_any_user(client, student)

        board_a = ExamBoardFactory()
        series_a = ExamSeriesFactory(subject=subject, exam_board=board_a)
        q_a = QuestionFactory(subject=subject, exam_series=series_a, topics=[topic])

        response = client.get(self.URL, {'topic': topic.id})
        returned_ids = {q['id'] for q in response.json()}

        assert q_a.id in returned_ids


@pytest.mark.django_db
class TestGenerateQuestionsOrderingRule:

    def _teacher_pro(self):
        teacher = TeacherUserFactory()
        plan = SubscriptionPlanFactory(plan_type='TEACHER_PRO', duration='MONTHLY')
        UserSubscriptionFactory(user=teacher, plan=plan)
        return teacher

    def test_orderly_when_no_topic_and_single_year(self, client, subject):
        teacher = self._teacher_pro()
        client.force_login(teacher)

        series = ExamSeriesFactory(subject=subject, year=2022)
        # Deliberately create in non-ascending question_number order
        q3 = QuestionFactory(subject=subject, exam_series=series, question_number=3)
        q1 = QuestionFactory(subject=subject, exam_series=series, question_number=1)
        q2 = QuestionFactory(subject=subject, exam_series=series, question_number=2)

        response = client.post('/api/catalog/questions/generate/', {
            'subject': subject.id,
            'years': [2022],
            'topics': [],
            'num_questions': 10,
        }, content_type='application/json')

        data = response.json()
        returned_numbers = [q['question_number'] for q in data['questions']]

        assert returned_numbers == sorted(returned_numbers)

    def test_randomize_flag_true_when_topic_selected(self, topic):
        assert _should_randomize(is_free=False, topic_ids=[topic.id], years=[2022]) is True

    def test_randomize_flag_true_when_multiple_years(self):
        assert _should_randomize(is_free=False, topic_ids=[], years=[2021, 2022]) is True

    def test_randomize_flag_true_when_no_years(self):
        assert _should_randomize(is_free=False, topic_ids=[], years=[]) is True

    def test_randomize_flag_false_when_single_year_no_topic(self):
        assert _should_randomize(is_free=False, topic_ids=[], years=[2022]) is False

    def test_randomize_flag_true_for_free_tier_regardless_of_filters(self):
        assert _should_randomize(is_free=True, topic_ids=[], years=[2022]) is True


@pytest.mark.django_db
class TestAvailableYearsCacheInvalidation:

    def test_invalidate_subject_caches_clears_multi_board_year_keys(self, subject):
        board_a = ExamBoardFactory()
        board_b = ExamBoardFactory()

        # Populate three distinct cache key variants for this subject
        get_available_years(subject.id, str(board_a.id))
        get_available_years(subject.id, str(board_b.id))
        get_available_years(subject.id, f'{board_a.id},{board_b.id}')

        known_key = KEY_AVAILABLE_YEARS_KNOWN.format(subject_id=subject.id)
        known_before = cache.get(known_key)
        assert known_before is not None
        assert len(known_before) == 3

        invalidate_subject_caches(subject.id)

        assert cache.get(known_key) is None
        for board_id in [str(board_a.id), str(board_b.id), f'{board_a.id},{board_b.id}']:
            key = KEY_AVAILABLE_YEARS.format(subject_id=subject.id, board_id=board_id)
            assert cache.get(key) is None