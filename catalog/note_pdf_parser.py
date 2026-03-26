"""
catalog/note_pdf_parser.py

Parses a structured PDF into per-topic chunks.
Each topic must start on a new page with:
    SUBJECT: Physics
    TOPIC: Scalars and Vectors
    VIDEO: https://youtube.com/embed/xxx   (optional)
"""
import io
import re
import pdfplumber
from pypdf import PdfReader, PdfWriter
from django.core.files.base import ContentFile


def _extract_header_fields(text):
    """Extract SUBJECT, TOPIC, VIDEO from the first ~10 lines of a page."""
    fields = {}
    for line in text.split('\n')[:10]:
        line = line.strip()
        m = re.match(r'^(SUBJECT|TOPIC|VIDEO)\s*:\s*(.+)$', line, re.IGNORECASE)
        if m:
            fields[m.group(1).upper()] = m.group(2).strip()
    return fields


def _convert_youtube_to_embed(url):
    """Convert any YouTube URL to embed format."""
    if not url:
        return url
    # Already embed
    if 'youtube.com/embed/' in url:
        return url
    # youtu.be/VIDEO_ID
    m = re.match(r'https?://youtu\.be/([^?&]+)', url)
    if m:
        return f'https://www.youtube.com/embed/{m.group(1)}'
    # youtube.com/watch?v=VIDEO_ID
    m = re.match(r'https?://(?:www\.)?youtube\.com/watch\?v=([^?&]+)', url)
    if m:
        return f'https://www.youtube.com/embed/{m.group(1)}'
    return url


def parse_note_pdf(file_bytes):
    """
    Parse a PDF into a list of topic dicts:
    [
        {
            'subject': 'Physics',
            'topic':   'Scalars and Vectors',
            'video_url': 'https://youtube.com/embed/xxx' or None,
            'pdf_bytes': b'...',   # pages for this topic as new PDF
        },
        ...
    ]
    Returns (results, errors)
    """
    results = []
    errors  = []

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as e:
        return [], [f'Could not open PDF: {e}']

    total_pages = len(reader.pages)
    if total_pages == 0:
        return [], ['PDF has no pages.']

    # Group pages by topic — each new topic starts on a new page with SUBJECT/TOPIC headers
    groups = []  # list of {'subject', 'topic', 'video_url', 'page_indices': [...]}

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ''
            fields = _extract_header_fields(text)

            if 'SUBJECT' in fields and 'TOPIC' in fields:
                # New topic block starts here
                groups.append({
                    'subject':    fields['SUBJECT'],
                    'topic':      fields['TOPIC'],
                    'video_url':  _convert_youtube_to_embed(fields.get('VIDEO')),
                    'page_indices': [i],
                })
            elif groups:
                # Continuation page — belongs to current group
                groups[-1]['page_indices'].append(i)
            else:
                errors.append(f'Page {i+1}: No SUBJECT/TOPIC header found — skipped.')

    if not groups:
        return [], ['No topic blocks found. Make sure each topic starts on a new page with SUBJECT: and TOPIC: headers.']

    # Build a PDF for each group
    for g in groups:
        writer = PdfWriter()
        for idx in g['page_indices']:
            writer.add_page(reader.pages[idx])
        buf = io.BytesIO()
        writer.write(buf)
        buf.seek(0)
        results.append({
            'subject':   g['subject'],
            'topic':     g['topic'],
            'video_url': g['video_url'],
            'pdf_bytes': buf.read(),
        })

    return results, errors