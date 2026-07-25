"""
Tests for board-scoped subject filtering (Manual Test Builder Step 2).

Root cause fixed: Step2Subject.jsx previously fetched all subjects
regardless of the board selected in Step 1, so a teacher could reach
Step 2 and see subjects with zero questions for that exam board.

Fix: SubjectListView now accepts an optional ?board=<id> param, using
the existing get_subjects_for_board() cache helper, so Step 2 can scope
its subject list to only combinations that have real data.
"""
import pytest

from tests.conftest import (
    SubjectFactory, ExamBoardFactory, ExamSeriesFactory, QuestionFactory,
)


@pytest.mark.django_db
class TestSubjectsByBoard:

    URL = '/api/catalog/subjects/'

    def test_no_board_param_returns_all_subjects_with_questions(self, client):
        board = ExamBoardFactory()
        subject_with_q = SubjectFactory()
        subject_without_q = SubjectFactory()
        series = ExamSeriesFactory(subject=subject_with_q, exam_board=board)
        QuestionFactory(subject=subject_with_q, exam_series=series)

        response = client.get(self.URL)
        data = response.json()
        names = {s['name'] for s in data}

        assert subject_with_q.name in names
        assert subject_without_q.name not in names

    def test_board_param_scopes_to_subjects_with_questions_for_that_board(self, client):
        board_a = ExamBoardFactory()
        board_b = ExamBoardFactory()
        subject_a = SubjectFactory()
        subject_b = SubjectFactory()

        series_a = ExamSeriesFactory(subject=subject_a, exam_board=board_a)
        QuestionFactory(subject=subject_a, exam_series=series_a)

        series_b = ExamSeriesFactory(subject=subject_b, exam_board=board_b)
        QuestionFactory(subject=subject_b, exam_series=series_b)

        response = client.get(self.URL, {'board': board_a.id})
        data = response.json()
        names = {s['name'] for s in data}

        assert subject_a.name in names
        assert subject_b.name not in names

    def test_board_with_no_questions_returns_empty_list(self, client):
        board = ExamBoardFactory()
        response = client.get(self.URL, {'board': board.id})
        assert response.json() == []