"""
Unit tests: file parsers.

DOCX parser: _parse_docx(file_bytes) is a private function inside
teacher/views.py — not importable directly. Tests go through the
upload_docx view endpoint instead.

PDF note parser: parse_note_pdf(file_bytes) in catalog/note_pdf_parser.py
— importable and tested directly with mocks.
"""

import pytest
import io
from unittest.mock import patch, MagicMock
from django.urls import reverse


# ---------------------------------------------------------------------------
# DOCX upload — tested through the view (since _parse_docx is private)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDocxUploadView:

    def _make_docx_bytes(self, paragraphs):
        """Build a minimal in-memory DOCX from paragraph strings."""
        from docx import Document
        doc = Document()
        for p in paragraphs:
            doc.add_paragraph(p)
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        return buf

    def test_upload_docx_requires_login(self, client):
        url = reverse('teacher:upload_docx')
        response = client.get(url)
        assert response.status_code == 302

    def test_upload_docx_page_renders_for_admin(self, client, admin_user):
        client.force_login(admin_user)
        url = reverse('teacher:upload_docx')
        response = client.get(url)
        assert response.status_code == 200

    def test_upload_docx_requires_file(self, client, admin_user):
        """POST with no file should not 500."""
        client.force_login(admin_user)
        url = reverse('teacher:upload_docx')
        response = client.post(url, {})
        assert response.status_code in (200, 302, 400)

    def test_upload_docx_with_valid_file(self, client, admin_user, subject):
        """
        Upload a minimal well-formed DOCX.
        Parser may return 0 questions for a trivial file — we just
        confirm the view handles it without a 500.
        """
        client.force_login(admin_user)
        url = reverse('teacher:upload_docx')
        paragraphs = [
            '1. What is the speed of light?',
            'A. 3×10⁸ m/s',
            'B. 3×10⁶ m/s',
            'C. 3×10⁴ m/s',
            'D. 3×10² m/s',
            'Answer: A',
            'Topic: Waves',
        ]
        docx_buf = self._make_docx_bytes(paragraphs)
        docx_buf.name = 'test.docx'

        response = client.post(url, {
            'subject':    subject.id,
            'exam_board': '',
            'year':       2023,
            'sitting':    'MAY_JUNE',
            'file':       docx_buf,
        })
        assert response.status_code in (200, 302)

    def test_non_admin_cannot_access_upload_docx(self, client, student):
        client.force_login(student)
        url = reverse('teacher:upload_docx')
        response = client.get(url)
        assert response.status_code in (302, 403)


# ---------------------------------------------------------------------------
# PDF note parser — tested directly (public function)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPdfNoteParser:
    """
    parse_note_pdf(file_bytes) in catalog/note_pdf_parser.py.
    Uses pdfplumber internally — mocked here to avoid real PDF dependency.
    """

    def test_parser_returns_dict_or_list(self):
        """Smoke test: parser returns a structured result, not None."""
        from catalog.note_pdf_parser import parse_note_pdf

        with patch('catalog.note_pdf_parser.pdfplumber') as mock_plumber:
            mock_page = MagicMock()
            mock_page.extract_text.return_value = 'Introduction to Waves\nWaves are...'
            mock_page.extract_words.return_value = [
                {'text': 'Introduction', 'top': 10, 'bottom': 20}
            ]
            mock_pdf = MagicMock()
            mock_pdf.pages = [mock_page]
            mock_pdf.__enter__ = lambda s: mock_pdf
            mock_pdf.__exit__ = MagicMock(return_value=False)
            mock_plumber.open.return_value = mock_pdf

            result = parse_note_pdf(b'fake-pdf-bytes')

        assert result is not None

    def test_parser_handles_empty_page(self):
        """Parser must not crash when a page has no extractable text."""
        from catalog.note_pdf_parser import parse_note_pdf

        with patch('catalog.note_pdf_parser.pdfplumber') as mock_plumber:
            mock_page = MagicMock()
            mock_page.extract_text.return_value = None
            mock_page.extract_words.return_value = []
            mock_pdf = MagicMock()
            mock_pdf.pages = [mock_page]
            mock_pdf.__enter__ = lambda s: mock_pdf
            mock_pdf.__exit__ = MagicMock(return_value=False)
            mock_plumber.open.return_value = mock_pdf

            # Should not raise
            result = parse_note_pdf(b'fake-pdf-bytes')
            assert result is not None

    def test_parser_handles_multi_page_pdf(self):
        """Parser processes all pages without crashing."""
        from catalog.note_pdf_parser import parse_note_pdf

        with patch('catalog.note_pdf_parser.pdfplumber') as mock_plumber:
            pages = []
            for i in range(5):
                p = MagicMock()
                p.extract_text.return_value = f'Page {i} content about waves.'
                p.extract_words.return_value = [
                    {'text': f'Page{i}', 'top': 10, 'bottom': 20}
                ]
                pages.append(p)

            mock_pdf = MagicMock()
            mock_pdf.pages = pages
            mock_pdf.__enter__ = lambda s: mock_pdf
            mock_pdf.__exit__ = MagicMock(return_value=False)
            mock_plumber.open.return_value = mock_pdf

            result = parse_note_pdf(b'fake-pdf-bytes')
            assert result is not None


# ---------------------------------------------------------------------------
# Upload notes view (PDF upload endpoint)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUploadNotesView:

    def test_upload_notes_page_renders_for_admin(self, client, admin_user):
        client.force_login(admin_user)
        url = reverse('teacher:upload_notes')
        response = client.get(url)
        assert response.status_code == 200

    def test_upload_notes_requires_login(self, client):
        url = reverse('teacher:upload_notes')
        response = client.get(url)
        assert response.status_code == 302

    def test_non_admin_cannot_access_upload_notes(self, client, student):
        client.force_login(student)
        url = reverse('teacher:upload_notes')
        response = client.get(url)
        assert response.status_code in (302, 403)


# ---------------------------------------------------------------------------
# Past paper upload view
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUploadPastPaperView:

    def test_upload_past_paper_renders_for_admin(self, client, admin_user):
        client.force_login(admin_user)
        url = reverse('teacher:upload_past_paper')
        response = client.get(url)
        assert response.status_code == 200

    def test_upload_past_paper_requires_login(self, client):
        url = reverse('teacher:upload_past_paper')
        response = client.get(url)
        assert response.status_code == 302

    def test_non_admin_cannot_upload_past_paper(self, client, student):
        client.force_login(student)
        url = reverse('teacher:upload_past_paper')
        response = client.get(url)
        assert response.status_code in (302, 403)