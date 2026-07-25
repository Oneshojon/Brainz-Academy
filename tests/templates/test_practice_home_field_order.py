"""
Regression test: Exam Board must render before Subject in the practice
session-start form, so the field order matches Manual Test Builder's
board-first, subject-second flow.
"""
import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestPracticeHomeFieldOrder:

    def test_exam_board_field_renders_before_subject_field(self, client, student):
        client.force_login(student)
        client.raise_request_exception = False

        response = client.get(reverse('practice:practice_home'))
        content = response.content.decode()

        board_pos   = content.find('name="exam_board"')
        subject_pos = content.find('name="subject"')

        assert board_pos != -1, "exam_board field not found in rendered page"
        assert subject_pos != -1, "subject field not found in rendered page"
        assert board_pos < subject_pos, (
            "Exam Board must render before Subject in the practice form."
        )

    def test_subjects_url_data_attribute_present(self, client, student):
        client.force_login(student)
        client.raise_request_exception = False

        response = client.get(reverse('practice:practice_home'))
        content = response.content.decode()

        assert 'data-subjects-url="/api/catalog/subjects/"' in content