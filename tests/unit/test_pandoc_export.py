"""
Unit tests for services/pandoc_export.py's error handling. Does not invoke
real pandoc (that's an environment/integration concern, already exercised
manually by every Test Builder download) -- only verifies the
subprocess-failure -> ValueError contract via mocking.
"""

from unittest.mock import patch, MagicMock
import pytest

from services.pandoc_export import markdown_to_docx_bytes, markdown_to_pdf_bytes


class TestPandocExportFailure:

    @patch('services.pandoc_export.subprocess.run')
    def test_docx_raises_value_error_when_pandoc_fails(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1, stderr=b'pandoc: error')
        with pytest.raises(ValueError, match='pandoc DOCX failed'):
            markdown_to_docx_bytes('# Title', 'Title')

    @patch('services.pandoc_export.subprocess.run')
    def test_pdf_raises_value_error_when_pandoc_fails(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1, stderr=b'xelatex: error')
        with pytest.raises(ValueError, match='pandoc PDF failed'):
            markdown_to_pdf_bytes('# Title', 'Title')