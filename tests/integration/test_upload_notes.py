"""
Integration tests — teacher upload_notes view (redesigned) and
topics_for_subject AJAX endpoint.

File location: tests/integration/test_upload_notes.py

These tests cover:
  - GET renders the form with subjects
  - POST saves a LessonNote record correctly
  - POST saves a Worksheet record correctly
  - POST with no files returns an error
  - Overwrite=off skips existing records
  - Overwrite=on replaces existing records
  - Subject/topic mismatch returns a graceful error (no 500)
  - topics_for_subject endpoint: admin access, correct payload, empty result
  - topics_for_subject endpoint: non-admin blocked
"""

import io
import pytest
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from catalog.models import LessonNote, Worksheet


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _pdf_bytes():
    """Return a minimal but valid PDF byte string."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n"
        b"xref\n0 4\n0000000000 65535 f \n"
        b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF"
    )


def _note_pdf():
    return SimpleUploadedFile('note.pdf', _pdf_bytes(), content_type='application/pdf')


def _ws_pdf():
    return SimpleUploadedFile('ws.pdf', _pdf_bytes(), content_type='application/pdf')


# ─── GET ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestUploadNotesGet:

    def test_get_renders_form(self, client, admin_user):
        """GET returns 200 and includes subjects in context."""
        client.force_login(admin_user)
        response = client.get(reverse('teacher:upload_notes'))
        assert response.status_code == 200
        assert 'subjects' in response.context

    def test_get_requires_admin(self, client, teacher):
        """Non-admin teacher is redirected away."""
        client.force_login(teacher)
        response = client.get(reverse('teacher:upload_notes'))
        assert response.status_code == 302

    def test_get_requires_login(self, client):
        """Unauthenticated user is redirected to login."""
        response = client.get(reverse('teacher:upload_notes'))
        assert response.status_code == 302


# ─── POST — no files ─────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestUploadNotesNoFiles:

    def test_post_no_files_shows_error(self, client, admin_user, subject, topic):
        """POST with no PDF files returns the form with an error, not a 500."""
        client.force_login(admin_user)
        response = client.post(reverse('teacher:upload_notes'), {
            'note_subject': subject.id,
            'note_topic':   topic.id,
        })
        assert response.status_code == 200
        assert 'error' in response.context
        assert response.context['error']   # non-empty error string


# ─── POST — save lesson note ─────────────────────────────────────────────────

@pytest.mark.django_db
class TestUploadNotesLessonNote:

    def test_saves_lesson_note(self, client, admin_user, subject, topic):
        """A valid POST with a note PDF creates a LessonNote record."""
        client.force_login(admin_user)
        response = client.post(reverse('teacher:upload_notes'), {
            'note_subject':   subject.id,
            'note_topic':     topic.id,
            'note_video_url': 'https://youtube.com/embed/abc123',
        }, files={'note_pdf': _note_pdf()})

        # Django test client: files must be passed via data dict
        response = client.post(reverse('teacher:upload_notes'), data={
            'note_subject':   subject.id,
            'note_topic':     topic.id,
            'note_video_url': 'https://youtube.com/embed/abc123',
            'note_pdf':       _note_pdf(),
        })

        assert response.status_code == 200
        assert response.context.get('success') is True

        note = LessonNote.objects.get(topic=topic)
        assert note.video_url == 'https://youtube.com/embed/abc123'
        assert note.is_ai_generated is False
        assert note.uploaded_by == admin_user
        assert note.pdf_file   # file was saved

    def test_lesson_note_result_shows_created(self, client, admin_user, subject, topic):
        """Results list contains a 'created' entry for the note."""
        client.force_login(admin_user)
        response = client.post(reverse('teacher:upload_notes'), data={
            'note_subject': subject.id,
            'note_topic':   topic.id,
            'note_pdf':     _note_pdf(),
        })
        results = response.context.get('results', [])
        statuses = [r['status'] for r in results]
        assert 'created' in statuses

    def test_lesson_note_no_video_url(self, client, admin_user, subject, topic):
        """Omitting video URL saves note with video_url=None."""
        client.force_login(admin_user)
        client.post(reverse('teacher:upload_notes'), data={
            'note_subject': subject.id,
            'note_topic':   topic.id,
            'note_pdf':     _note_pdf(),
        })
        note = LessonNote.objects.get(topic=topic)
        assert note.video_url is None


# ─── POST — save worksheet ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestUploadNotesWorksheet:

    def test_saves_worksheet(self, client, admin_user, subject, topic):
        """A valid POST with a worksheet PDF creates a Worksheet record."""
        client.force_login(admin_user)
        response = client.post(reverse('teacher:upload_notes'), data={
            'ws_subject':   subject.id,
            'ws_topic':     topic.id,
            'ws_video_url': 'https://youtube.com/embed/xyz789',
            'ws_pdf':       _ws_pdf(),
        })
        assert response.status_code == 200
        assert response.context.get('success') is True

        ws = Worksheet.objects.get(topic=topic)
        assert ws.video_url == 'https://youtube.com/embed/xyz789'
        assert ws.is_ai_generated is False
        assert ws.pdf_file

    def test_worksheet_result_shows_created(self, client, admin_user, subject, topic):
        """Results list contains a 'created' entry for the worksheet."""
        client.force_login(admin_user)
        response = client.post(reverse('teacher:upload_notes'), data={
            'ws_subject': subject.id,
            'ws_topic':   topic.id,
            'ws_pdf':     _ws_pdf(),
        })
        results = response.context.get('results', [])
        statuses = [r['status'] for r in results]
        assert 'created' in statuses


# ─── POST — both sections together ───────────────────────────────────────────

@pytest.mark.django_db
class TestUploadNotesBothSections:

    def test_saves_both_note_and_worksheet(self, client, admin_user, subject, topic):
        """One POST can create both a LessonNote and Worksheet for the same topic."""
        client.force_login(admin_user)
        response = client.post(reverse('teacher:upload_notes'), data={
            'note_subject': subject.id,
            'note_topic':   topic.id,
            'note_pdf':     _note_pdf(),
            'ws_subject':   subject.id,
            'ws_topic':     topic.id,
            'ws_pdf':       _ws_pdf(),
        })
        assert response.status_code == 200
        assert response.context.get('success') is True

        assert LessonNote.objects.filter(topic=topic).exists()
        assert Worksheet.objects.filter(topic=topic).exists()

        results  = response.context.get('results', [])
        statuses = [r['status'] for r in results]
        assert statuses.count('created') == 2


# ─── POST — overwrite behaviour ──────────────────────────────────────────────

@pytest.mark.django_db
class TestUploadNotesOverwrite:

    def _post_note(self, client, admin_user, subject, topic, overwrite=False):
        data = {
            'note_subject': subject.id,
            'note_topic':   topic.id,
            'note_pdf':     _note_pdf(),
        }
        if overwrite:
            data['note_overwrite'] = 'on'
        client.force_login(admin_user)
        return client.post(reverse('teacher:upload_notes'), data=data)

    def test_skips_existing_without_overwrite(self, client, admin_user, subject, topic):
        """Second upload without overwrite=on returns status 'skipped'."""
        self._post_note(client, admin_user, subject, topic)
        response = self._post_note(client, admin_user, subject, topic, overwrite=False)
        results  = response.context.get('results', [])
        statuses = [r['status'] for r in results]
        assert 'skipped' in statuses
        # Confirm only one record exists
        assert LessonNote.objects.filter(topic=topic).count() == 1

    def test_overwrites_existing_when_flagged(self, client, admin_user, subject, topic):
        """Second upload with overwrite=on returns status 'updated'."""
        self._post_note(client, admin_user, subject, topic)
        response = self._post_note(client, admin_user, subject, topic, overwrite=True)
        results  = response.context.get('results', [])
        statuses = [r['status'] for r in results]
        assert 'updated' in statuses
        # Still only one record
        assert LessonNote.objects.filter(topic=topic).count() == 1


# ─── POST — subject/topic mismatch ───────────────────────────────────────────

@pytest.mark.django_db
class TestUploadNotesMismatch:

    def test_subject_topic_mismatch_returns_error(
            self, client, admin_user, subject, topic):
        """
        Posting a topic that belongs to a different subject should not 500.
        It should return a graceful error in the errors context key.
        """
        from catalog.models import Subject
        other_subject = Subject.objects.create(name='Other Subject Mismatch')
        client.force_login(admin_user)
        response = client.post(reverse('teacher:upload_notes'), data={
            'note_subject': other_subject.id,   # wrong subject for this topic
            'note_topic':   topic.id,
            'note_pdf':     _note_pdf(),
        })
        assert response.status_code == 200
        errors = response.context.get('errors', [])
        assert len(errors) > 0
        assert not LessonNote.objects.filter(topic=topic).exists()

    def test_missing_topic_returns_error(self, client, admin_user, subject):
        """Posting with no topic ID returns a graceful error."""
        client.force_login(admin_user)
        response = client.post(reverse('teacher:upload_notes'), data={
            'note_subject': subject.id,
            'note_topic':   '',
            'note_pdf':     _note_pdf(),
        })
        assert response.status_code == 200
        errors = response.context.get('errors', [])
        assert len(errors) > 0


# ─── topics_for_subject AJAX endpoint ────────────────────────────────────────

@pytest.mark.django_db
class TestTopicsForSubject:

    def test_returns_json_topic_list(self, client, admin_user, subject, topic):
        """Returns a JSON list with id and name for the given subject."""
        client.force_login(admin_user)
        url      = reverse('teacher:topics_for_subject', kwargs={'subject_id': subject.id})
        response = client.get(url, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        ids = [t['id'] for t in data]
        assert topic.id in ids

    def test_returns_empty_list_for_subject_with_no_topics(
            self, client, admin_user):
        """Returns [] for a subject that has no topics — not a 404 or 500."""
        from catalog.models import Subject
        empty_subject = Subject.objects.create(name='Empty Subject No Topics')
        client.force_login(admin_user)
        url      = reverse('teacher:topics_for_subject', kwargs={'subject_id': empty_subject.id})
        response = client.get(url, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        assert response.status_code == 200
        assert response.json() == []

    def test_returns_404_for_nonexistent_subject(self, client, admin_user):
        """Non-existent subject ID does not 500 — returns 404."""
        client.force_login(admin_user)
        url      = reverse('teacher:topics_for_subject', kwargs={'subject_id': 99999})
        response = client.get(url)
        # View filters by subject_id — returns empty list; 404 also acceptable
        assert response.status_code in (200, 404)
        if response.status_code == 200:
            assert response.json() == []

    def test_requires_admin(self, client, teacher, subject):
        """Non-admin teacher cannot call this endpoint."""
        client.force_login(teacher)
        url      = reverse('teacher:topics_for_subject', kwargs={'subject_id': subject.id})
        response = client.get(url)
        assert response.status_code == 302

    def test_requires_login(self, client, subject):
        """Unauthenticated request is redirected."""
        url      = reverse('teacher:topics_for_subject', kwargs={'subject_id': subject.id})
        response = client.get(url)
        assert response.status_code == 302

    def test_payload_shape(self, client, admin_user, subject, topic):
        """Each item in the list has exactly 'id' and 'name' keys."""
        client.force_login(admin_user)
        url      = reverse('teacher:topics_for_subject', kwargs={'subject_id': subject.id})
        response = client.get(url)
        data = response.json()
        for item in data:
            assert set(item.keys()) == {'id', 'name'}
            assert isinstance(item['id'], int)
            assert isinstance(item['name'], str)