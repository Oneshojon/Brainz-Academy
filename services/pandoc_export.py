"""
services/pandoc_export.py

Generic markdown -> DOCX/PDF export via pandoc. Deliberately separate from
catalog/views.py's private _generate_docx()/_generate_pdf() (which convert
HTML, not markdown, and are scoped to Question objects) -- this is a
from-scratch extraction of the same proven subprocess/tempdir pattern,
generalized to any markdown string, so lesson_plans doesn't need to touch
or depend on catalog's internals.
"""

import os
import subprocess
import tempfile


def markdown_to_docx_bytes(markdown_text: str, title: str) -> bytes:
    """
    Converts a markdown string to DOCX bytes via pandoc.
    Raises ValueError with pandoc's stderr on failure.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        md_path = os.path.join(tmpdir, 'input.md')
        docx_path = os.path.join(tmpdir, 'output.docx')

        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(markdown_text)

        result = subprocess.run(
            [
                'pandoc', md_path,
                '-o', docx_path,
                '--from', 'gfm',  # GitHub-flavored markdown -- needed for table support
                '--to', 'docx',
                '--metadata', f'title={title}',
            ],
            capture_output=True, timeout=60,
            cwd=tmpdir,
        )

        if not os.path.exists(docx_path):
            raise ValueError(
                f'pandoc DOCX failed: rc={result.returncode} '
                f'{result.stderr.decode()[:300]}'
            )

        with open(docx_path, 'rb') as f:
            return f.read()


def markdown_to_pdf_bytes(markdown_text: str, title: str) -> bytes:
    """
    Converts a markdown string to PDF bytes via pandoc + xelatex.
    Raises ValueError with pandoc's stderr on failure.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        md_path = os.path.join(tmpdir, 'input.md')
        pdf_path = os.path.join(tmpdir, 'output.pdf')

        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(markdown_text)

        result = subprocess.run(
            [
                'pandoc', md_path,
                '-o', pdf_path,
                '--from', 'gfm',
                '--pdf-engine', 'xelatex',
                '--variable', 'geometry:margin=1in',
                '--variable', 'tables=true',
                '--variable', 'colorlinks=true',
                '--metadata', f'title={title}',
            ],
            capture_output=True, timeout=120,
            cwd=tmpdir,
        )

        if not os.path.exists(pdf_path):
            raise ValueError(
                f'pandoc PDF failed: rc={result.returncode} '
                f'{result.stderr.decode()[:300]}'
            )

        with open(pdf_path, 'rb') as f:
            return f.read()