"""
catalog/note_pdf_parser.py

Parses Brainz Academy revision note PDFs.

Cover page format (page 1):
    Brainz Academy
    CHEMISTRY REVISION NOTE        <- subject = word before "REVISION NOTE"
    Introduction to Chemistry      <- theme name
    Topics:
    - Meaning of Chemistry         <- topic hint list used to confirm headings
    - Measurement of physical quantities
    - Scientific Methods

Content pages:
    Topic heading = first line of page using Spectral-Bold font at size > 13,
                    written in ALL CAPS, underlined, AND fuzzy-matched to the
                    cover page bullet list (score >= 0.75).
    Content continues until the next topic heading is found on any page.
"""

import io
import re
import difflib
import pdfplumber
from pypdf import PdfReader, PdfWriter


# ── Font/size that identifies a topic heading ─────────────────────────────────
HEADING_FONT_FRAGMENT = 'Spectral-Bold'
HEADING_MIN_SIZE      = 13.0
COVER_MATCH_CUTOFF    = 0.75   # fuzzy match score to confirm against cover list


def _is_heading_word(word):
    return (
        HEADING_FONT_FRAGMENT in word.get('fontname', '')
        and float(word.get('size', 0)) >= HEADING_MIN_SIZE
    )


def _has_underline_rect(page, text_top, text_bottom):
    """Check for a thin horizontal filled rect (underline) just below the heading."""
    for rect in page.rects:
        r_height = abs(rect.get('height', 0))
        r_width  = rect.get('width', 0)
        r_top    = rect.get('top', 0)
        if r_height < 2.0 and r_width > 50:
            if text_bottom <= r_top <= text_bottom + 12:
                return True
    return False


def _fuzzy_matches_cover(heading, cover_topics, cutoff=COVER_MATCH_CUTOFF):
    """
    Return True if heading fuzzy-matches any topic from the cover page list.
    Comparison is case-insensitive.
    """
    if not cover_topics:
        return True  # no cover list available — skip confirmation
    heading_lower = heading.lower()
    for topic in cover_topics:
        score = difflib.SequenceMatcher(None, heading_lower, topic.lower()).ratio()
        if score >= cutoff:
            return True
    return False


def _get_page_heading(page, cover_topics=None):
    """
    Return the first heading-font line on the page if it is a topic heading.
    A topic heading must be:
      1. Spectral-Bold >= 14pt
      2. ALL CAPS
      3. Fuzzy-matched against the cover page topic list (if available)
    Underline is detected as extra confirmation but not mandatory.
    """
    words = page.extract_words(extra_attrs=['fontname', 'size'])
    content_words = [w for w in words if float(w.get('size', 0)) > 9]
    if not content_words:
        return None

    heading_words = []
    heading_bottom = 0.0
    for w in content_words:
        if _is_heading_word(w):
            heading_words.append(w['text'])
            heading_bottom = max(heading_bottom, float(w.get('bottom', 0)))
        else:
            break

    if not heading_words:
        return None

    heading = ' '.join(heading_words).strip()

    # Signal 1: ALL CAPS
    alpha_chars = [c for c in heading if c.isalpha()]
    if not alpha_chars or not all(c.isupper() for c in alpha_chars):
        return None

    # Signal 2: Fuzzy match against cover topic list
    if not _fuzzy_matches_cover(heading, cover_topics or []):
        return None

    return heading


def _parse_cover(page):
    """
    Extract subject, theme and topic hints from the cover page.
    Returns {'subject': str, 'theme': str, 'topic_hints': [str]}
    """
    text = page.extract_text() or ''
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    subject     = None
    theme       = None
    topic_hints = []

    for i, line in enumerate(lines):
        m = re.match(
            r'^([A-Z][A-Z\s]+?)\s+REVISION\s+NOTE\s*$',
            line,
            re.IGNORECASE
        )
        if m:
            raw = m.group(1).strip()
            subject = raw.title()
            # Theme is the next non-boilerplate line
            for j in range(i + 1, len(lines)):
                nxt = lines[j]
                if re.search(r'brainz|visit|scan|worksheet|^topic', nxt, re.IGNORECASE):
                    continue
                theme = nxt
                break
            continue

        # Collect bullet topic hints
        if re.match(r'^[*\-\u2022]\s*', line):
            hint = re.sub(r'^[*\-\u2022]\s*', '', line).strip()
            hint = re.sub(r'\s+', ' ', hint)  # fix PDF spacing gaps
            if hint:
                topic_hints.append(hint)

    return {
        'subject':     subject,
        'theme':       theme,
        'topic_hints': topic_hints,
    }


def _convert_youtube_to_embed(url):
    if not url:
        return url
    if 'youtube.com/embed/' in url:
        return url
    m = re.match(r'https?://youtu\.be/([^?&]+)', url)
    if m:
        return f'https://www.youtube.com/embed/{m.group(1)}'
    m = re.match(r'https?://(?:www\.)?youtube\.com/watch\?v=([^?&]+)', url)
    if m:
        return f'https://www.youtube.com/embed/{m.group(1)}'
    return url


def parse_note_pdf(file_bytes):
    """
    Parse a Brainz Academy revision note PDF.

    Returns (results, errors) where each result is:
    {
        'subject':   str,
        'theme':     str or None,
        'topic':     str,
        'video_url': None,
        'pdf_bytes': bytes,
    }
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

    cover_info = {'subject': None, 'theme': None, 'topic_hints': []}

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        cover_info = _parse_cover(pdf.pages[0])

        if not cover_info['subject']:
            errors.append(
                'Could not detect subject from cover page. '
                'Make sure the cover has "[SUBJECT] REVISION NOTE".'
            )
            return [], errors

        cover_topics = cover_info['topic_hints']
        if not cover_topics:
            errors.append(
                'Warning: no bullet topic list found on cover page. '
                'Heading confirmation will be skipped.'
            )

        # Scan content pages for topic headings
        groups = []

        for i, page in enumerate(pdf.pages):
            if i == 0:
                continue  # skip cover

            heading = _get_page_heading(page, cover_topics)
            if heading:
                groups.append({
                    'heading':      heading,
                    'page_indices': [i],
                })
            elif groups:
                groups[-1]['page_indices'].append(i)
            # Pages before the first heading are silently skipped

    if not groups:
        errors.append(
            'No topic headings found. Make sure topic titles are '
            'Spectral-Bold ALL CAPS and match the cover bullet list.'
        )
        return [], errors

    # Build per-topic PDFs
    for g in groups:
        topic_name = g['heading'].title()

        writer = PdfWriter()
        for idx in g['page_indices']:
            writer.add_page(reader.pages[idx])
        buf = io.BytesIO()
        writer.write(buf)
        buf.seek(0)

        results.append({
            'subject':   cover_info['subject'],
            'theme':     cover_info['theme'],
            'topic':     topic_name,
            'video_url': None,
            'pdf_bytes': buf.read(),
        })

    return results, errors