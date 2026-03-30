from django import template
from django.utils.html import escape
from django.utils.safestring import mark_safe
import re

register = template.Library()

ROMAN_ROW_RE  = re.compile(r'^(I{1,3}V?|IV|IX|XI*)\.\s', re.IGNORECASE)
TABLE_HEAD_RE = re.compile(r'Scientist|Famous\s+work', re.IGNORECASE)


@register.filter
def render_content(value):
    if not value:
        return ''
    # Old format — still has **markers**, convert to HTML first
    if '**' in value and '<' not in value:
        lines = value.split('\n')
        html_lines = []
        for line in lines:
            line_escaped = escape(line)
            if line_escaped.startswith('**') and line_escaped.endswith('**'):
                inner = line_escaped[2:-2]
                html_lines.append(f'<strong>{inner}</strong><br>')
            else:
                html_lines.append(f'{line_escaped}<br>')
        return mark_safe(''.join(html_lines))
    # New format — already HTML
    # Indent table header lines (Scientist / Famous work pattern)
    import re
    value = re.sub(
    r'(<strong>)([^<]*(?:Scientist|Famous\s+work)[^<]*)(</strong>)',
    lambda m: f'<strong style="padding-left:2rem;">{re.sub(r" {2,}", lambda s: "&nbsp;" * len(s.group()), m.group(2))}</strong>',
    value,
    flags=re.IGNORECASE
)
    return mark_safe(value)