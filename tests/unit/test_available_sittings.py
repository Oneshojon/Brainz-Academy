"""
Regression test for the sitting-label drift bug.

Root cause: catalog/views.py hardcoded a SITTING_LABELS dict mirroring
ExamSeries.SITTING_CHOICES. When JUNE_JULY (and, pre-existing, JAN_FEB and
MOCK-SERIES) were added to the model's choices, this dict was never updated,
so AvailableSittingsView fell back to returning the raw DB value instead of
a human-readable label — leaking "JUNE_JULY" into the practice page's
sitting dropdown instead of "June/July".

Fix: SITTING_LABELS is now built directly from ExamSeries.SITTING_CHOICES
(dict(ExamSeries.SITTING_CHOICES)), so it can never drift again. This test
locks that in — it will fail if SITTING_LABELS is ever reverted to a
hardcoded dict, or if a new sitting is added to the model without a label.
"""
import pytest

from catalog.models import ExamSeries
from tests.conftest import ExamSeriesFactory, QuestionFactory, ExamBoardFactory, SubjectFactory


@pytest.mark.django_db
class TestAvailableSittingsLabels:

    URL = '/api/catalog/available-sittings/'

    def test_june_july_sitting_returns_correct_label(self, client, subject):
        """The specific bug: JUNE_JULY must resolve to 'June/July', not the raw value."""
        board = ExamBoardFactory()
        series = ExamSeriesFactory(subject=subject, exam_board=board, sitting='JUNE_JULY')
        QuestionFactory(subject=subject, exam_series=series)

        response = client.get(self.URL, {'subject': subject.id})
        data = response.json()

        assert response.status_code == 200
        sittings = data['sittings']
        assert len(sittings) == 1
        assert sittings[0]['value'] == 'JUNE_JULY'
        assert sittings[0]['label'] == 'June/July'

    def test_every_sitting_choice_has_a_non_raw_label(self):
        """
        Guards against future drift: every value in ExamSeries.SITTING_CHOICES
        must produce a label different from its raw value (i.e. an actual
        human-readable label, not a fallback to the raw DB string).
        """
        from catalog.views import SITTING_LABELS

        for value, expected_label in ExamSeries.SITTING_CHOICES:
            assert value in SITTING_LABELS, (
                f"'{value}' is missing from SITTING_LABELS — it will leak "
                f"as a raw value into any dropdown using this endpoint."
            )
            assert SITTING_LABELS[value] == expected_label

    def test_sitting_with_no_questions_is_excluded(self, client, subject):
        """AvailableSittingsView only returns sittings that have questions attached."""
        board = ExamBoardFactory()
        # ExamSeries exists but has no questions — should not appear
        ExamSeriesFactory(subject=subject, exam_board=board, sitting='MOCK')

        response = client.get(self.URL, {'subject': subject.id})
        data = response.json()

        assert data['sittings'] == []