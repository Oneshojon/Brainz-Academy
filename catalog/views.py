from urllib import request
import re

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from .models import Question, Theme
from .serializers import (
    SubjectSerializer, TopicSerializer, ThemeSerializer,
    ExamBoardSerializer, QuestionSerializer, QuestionListSerializer,
)
from .permissions import IsTeacher
from rest_framework.permissions import AllowAny, IsAuthenticated
from catalog.subscription_access import check_test_builder_access
from catalog.models import FreeUsageTracker

# File
from django.http import HttpResponse
from docx.enum.text import WD_ALIGN_PARAGRAPH
import io
import os
from datetime import date

from catalog.cache_utils import (
    get_all_subjects, get_all_boards, get_themes_for_subject,
    get_topics_for_subject, get_topics_for_theme, get_available_years,
    get_feature_flags, invalidate_subject_caches, invalidate_feature_flags,
    get_leaderboard,
)

class FeatureFlagsView(APIView):
    """
    GET /api/catalog/feature-flags/
    Returns all feature flags as a flat dict {key: is_enabled}.
    Used by the React frontend to check which modes are enabled.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from catalog.cache_utils import get_feature_flags
        return Response(get_feature_flags())

class SubjectListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class   = SubjectSerializer
 
    def get_queryset(self):
        return get_all_subjects()
 
 
class ExamBoardListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class   = ExamBoardSerializer
 
    def get_queryset(self):
        return get_all_boards()

class TopicListView(generics.ListAPIView):
    """Returns topics filtered by subject."""
    permission_classes = [AllowAny]
    serializer_class   = TopicSerializer
 
    def get_queryset(self):
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            return get_topics_for_subject(subject_id)
        return []

class TopicsByThemeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        theme_id = request.query_params.get('theme')
        exam_board_id = request.query_params.get('exam_board')

        if not theme_id:
            return Response([])

        from catalog.cache_utils import get_topics_for_theme_with_counts
        return Response(
            get_topics_for_theme_with_counts(theme_id, exam_board_id)
        )

class ThemeListView(generics.ListAPIView):
    """Returns themes for a subject."""
    permission_classes = [AllowAny]
    serializer_class   = ThemeSerializer
 
    def get_queryset(self):
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            return get_themes_for_subject(subject_id)
        return []    

class AvailableYearsView(APIView):
    permission_classes = [AllowAny]
 
    def get(self, request):
        subject_id    = request.query_params.get('subject')
        exam_board_id = request.query_params.get('exam_board')
        years = get_available_years(subject_id, exam_board_id)
        return Response({'years': years})


class TestBuilderAccessView(APIView):
    """
    GET /api/catalog/test-builder-access/
    Returns the current user\'s test builder permissions.
    The React frontend calls this on load to show/hide options.
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        access = check_test_builder_access(request.user)
        return Response(access)
 
 
class GenerateQuestionsView(APIView):
    """Updated to enforce free tier limits before generating."""
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        from catalog.subscription_access import check_test_builder_access
        from catalog.models import FreeUsageTracker
 
        access = check_test_builder_access(request.user)
 
        if not access['allowed']:
            return Response({'error': access['reason']}, status=403)
 
        subject_id    = request.data.get('subject')
        topic_ids     = request.data.get('topics', [])
        exam_board_id = request.data.get('exam_board')
        years         = request.data.get('years', [])
        question_type = request.data.get('question_type', '')
        requested_num = int(request.data.get('num_questions', 15))
 
        # Cap for free users
        num_questions = min(requested_num, access['max_questions'])
 
        qs = Question.objects.all()
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if topic_ids:
            qs = qs.filter(topics__id__in=topic_ids).distinct()
        if exam_board_id:
            qs = qs.filter(exam_series__exam_board_id=exam_board_id)
        if years:
            qs = qs.filter(exam_series__year__in=years)
        if question_type:
            qs = qs.filter(question_type=question_type)

        difficulty = request.data.get('difficulty', '')
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        sitting = request.data.get('sitting', '')
        if sitting:
            qs = qs.filter(exam_series__sitting=sitting)

        qs = qs.select_related(
            'subject',
            'exam_series',
            'exam_series__exam_board',
        ).prefetch_related(
            'choices',
            'topics',
            'theory_answer',
        )

        # Always randomise for free trial; paid can choose ordering later
        if access['is_free']:
            qs = qs.order_by('?')

        questions = list(qs[:num_questions])
 
       

 
        if not questions:
            return Response({'error': 'No questions found for your selection.'}, status=404)
 
        # Increment trial counter for free teachers
        if access['is_free']:
            tracker, _ = FreeUsageTracker.objects.get_or_create(user=request.user)
            tracker.increment_test_builder_trial()
 
        serializer = QuestionSerializer(questions, many=True)
        return Response({
            'questions':        serializer.data,
            'total':            len(questions),
            'is_free':          access['is_free'],
            'pdf_only':         access['pdf_only'],
            'trials_remaining': access['trials_remaining'] - (1 if access['is_free'] else 0),
        })
    

class QuestionDetailView(APIView):
    """
    GET /api/catalog/questions/<id>/
    Returns full question detail including choices and theory answer.
    Used by the test builder preview panel when teacher clicks a question.
    No N+1 — uses select_related + prefetch_related.
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request, pk):
        try:
            question = (
                Question.objects
                .select_related(
                    'subject',
                    'exam_series',
                    'exam_series__exam_board',
                )
                .prefetch_related(
                    'choices',
                    'topics',
                    'theory_answer',
                )
                .get(pk=pk)
            )
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=404)
 
        serializer = QuestionSerializer(question)
        return Response(serializer.data)
    
    
# ── INTERNAL HELPER: get raw image bytes from a question ─────────────────────
def _get_image_bytes(question):
    """Returns (bytes, ext) or (None, None)."""
    try:
        if question.image and question.image.name:
            question.image.open('rb')
            data = question.image.read()
            question.image.close()
            ext = os.path.splitext(question.image.name)[1].lower().lstrip('.') or 'png'
            return data, ext
    except Exception:
        pass
    return None, None

def _strip_html(text):
    """Strip HTML tags and decode basic entities."""
    if not text:
        return ''
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&nbsp;', ' ')
    return text.strip()

# ── INTERNAL HELPER: build header metadata from questions ────────────────────

def _header_info(questions, title):
    subjects, boards, years = set(), set(), set()
    for q in questions:
        if q.subject:
            subjects.add(q.subject.name)
        if q.exam_series:
            if q.exam_series.exam_board:
                boards.add(q.exam_series.exam_board.name)
            if q.exam_series.year:
                years.add(str(q.exam_series.year))
    return {
        'subject': ', '.join(sorted(subjects)) or title,
        'exam':    ', '.join(sorted(boards))   or '—',
        'year':    ', '.join(sorted(years))    or str(date.today().year),
    }


# ════════════════════════════════════════════════════════════════════════════
# DOCX GENERATOR
# Format (from sample BIOLOGY_CBT_2024_WITH_TOPICS.docx):
#   - A4, all margins 1 inch
#   - 12pt Normal throughout, no extra spacing between paragraphs
#   - Header block: Subject / Exam / Year\nPaper Type / Copy label
#   - Empty line
#   - Per question:
#       "1. Question text"          ← Normal 12pt
#       [image if present]          ← inline, max 3.5 inches wide
#       "A. choice\nB.\nC.\nD."     ← single para, line breaks
#       "Answer: C"                 ← teacher only
#       "Topic: ..."  (bold)        ← teacher only
#       empty line
# ════════════════════════════════════════════════════════════════════════════

import subprocess
import tempfile

def _generate_docx(questions, title, include_answers=False):
    """Generate DOCX using pandoc for proper OMML math rendering."""
    hdr = _header_info(questions, title)
    copy_line = "Copy: Student" if not include_answers else "Copy: Teacher (With Answers & Topics)"

    html_parts = [
        '<html><head><meta charset="utf-8"></head><body>',
        f'<p>Subject: {hdr["subject"]}</p>',
        f'<p>Exam: {hdr["exam"]}</p>',
        f'<p>Year: {hdr["year"]}</p>',
        '<p>Paper Type: CBT</p>',
        f'<p>{copy_line}</p>',
        '<p>&nbsp;</p>',
    ]

    for i, q in enumerate(questions, 1):
        # Question content — already HTML with \(...\) math
        html_parts.append(f'<p><strong>{i}.</strong></p>')
        html_parts.append(q.content)  # full HTML preserved

        # Image
        img_bytes, img_ext = _get_image_bytes(q)
        if img_bytes:
            import base64
            b64 = base64.b64encode(img_bytes).decode()
            mime = f'image/{img_ext or "png"}'
            html_parts.append(
                f'<p><img src="data:{mime};base64,{b64}" style="max-width:400px"/></p>'
            )

        # Choices — choice_text is also HTML with math
        if q.question_type == 'OBJ':
            choices = list(q.choices.all().order_by('label'))
            if choices:
                for c in choices:
                    html_parts.append(f'<p>{c.label}. {c.choice_text}</p>')

        # Answer (teacher only)
        if include_answers and q.question_type == 'OBJ':
            correct = q.choices.filter(is_correct=True).first()
            if correct:
                html_parts.append(f'<p><strong>Answer: {correct.label}</strong></p>')

        # Topic (teacher only)
        if include_answers:
            topics = list(q.topics.all())
            if topics:
                html_parts.append(
                    f'<p><strong>Topic: {", ".join(t.name for t in topics)}</strong></p>'
                )

        html_parts.append('<p>&nbsp;</p>')

    html_parts.append('</body></html>')
    html_content = '\n'.join(html_parts)

    with tempfile.TemporaryDirectory() as tmpdir:
        html_path = os.path.join(tmpdir, 'input.html')
        docx_path = os.path.join(tmpdir, 'output.docx')

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        result = subprocess.run(
            [
                'pandoc', html_path,
                '-o', docx_path,
                '--from', 'html+tex_math_single_backslash',
                '--to', 'docx',
                '--metadata', f'title={title}',
            ],
            capture_output=True, timeout=60
        )

        # Don't raise on warnings — only fail if file wasn't created
        if not os.path.exists(docx_path):
            raise ValueError(f'pandoc DOCX failed: {result.stderr.decode()}')

        with open(docx_path, 'rb') as f:
            return f.read()
 
 
class QuestionsByTopicView(APIView):
    """
    GET /api/catalog/questions-by-topic/?topic=<id>&exam_board=<id>
    Returns lightweight question list for the test builder list panel.
    Full detail is fetched separately via QuestionDetailView when previewing.
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        topic_id      = request.query_params.get('topic')
        exam_board_id = request.query_params.get('exam_board')

        if not topic_id:
            return Response({'error': 'topic is required'}, status=400)

        qs = (
            Question.objects
            .filter(topics__id=topic_id)
            .select_related('subject', 'exam_series', 'exam_series__exam_board')
            .prefetch_related('choices', 'topics', 'theory_answer')
            .order_by('-exam_series__year', 'question_number')
        )

        if exam_board_id:
            qs = qs.filter(exam_series__exam_board_id=exam_board_id)

        # DEBUG — remove after fixing
        print(f"topic_id={topic_id} exam_board_id={exam_board_id}")
        print(f"total questions found: {qs.count()}")
        for q in qs:
            print(f"  Q{q.id} year={q.exam_series.year if q.exam_series else 'None'}")

        serializer = QuestionSerializer(qs, many=True)
        return Response(serializer.data)


# ════════════════════════════════════════════════════════════════════════════
# PDF GENERATOR  (mirrors docx structure exactly)
# ════════════════════════════════════════════════════════════════════════════

# Replace the esc function with one that preserves superscripts
def clean_for_pdf(text):
    if not text:
        return ''
    # Convert common HTML superscripts to ReportLab markup
    text = re.sub(r'<sup>(.*?)</sup>', r'<super>\1</super>', text)
    text = re.sub(r'<sub>(.*?)</sub>', r'<sub>\1</sub>', text)
    # Strip remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&nbsp;', ' ')
    return text.strip()

def _generate_pdf(questions, title, include_answers=False):
    hdr = _header_info(questions, title)
    copy_line = "Copy: Student" if not include_answers else "Copy: Teacher (With Answers & Topics)"

    html_parts = [
        '<html><head><meta charset="utf-8"></head><body>',
        f'<p>Subject: {hdr["subject"]}</p>',
        f'<p>Exam: {hdr["exam"]}</p>',
        f'<p>Year: {hdr["year"]}</p>',
        '<p>Paper Type: CBT</p>',
        f'<p>{copy_line}</p>',
        '<p>&nbsp;</p>',
    ]

    for i, q in enumerate(questions, 1):
        html_parts.append(f'<p><strong>{i}.</strong></p>')
        html_parts.append(q.content)

        img_bytes, img_ext = _get_image_bytes(q)
        if img_bytes:
            import base64
            b64 = base64.b64encode(img_bytes).decode()
            mime = f'image/{img_ext or "png"}'
            html_parts.append(
                f'<p><img src="data:{mime};base64,{b64}" style="max-width:400px"/></p>'
            )

        if q.question_type == 'OBJ':
            choices = list(q.choices.all().order_by('label'))
            if choices:
                for c in choices:
                    html_parts.append(f'<p>{c.label}. {c.choice_text}</p>')

        if include_answers and q.question_type == 'OBJ':
            correct = q.choices.filter(is_correct=True).first()
            if correct:
                html_parts.append(f'<p><strong>Answer: {correct.label}</strong></p>')

        if include_answers:
            topics = list(q.topics.all())
            if topics:
                html_parts.append(
                    f'<p><strong>Topic: {", ".join(t.name for t in topics)}</strong></p>'
                )

        html_parts.append('<p>&nbsp;</p>')

    html_parts.append('</body></html>')
    html_content = '\n'.join(html_parts)

    with tempfile.TemporaryDirectory() as tmpdir:
        html_path = os.path.join(tmpdir, 'input.html')
        pdf_path  = os.path.join(tmpdir, 'output.pdf')

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        result = subprocess.run(
            [
                'pandoc', html_path,
                '-o', pdf_path,
                '--from', 'html+tex_math_single_backslash',
                '--pdf-engine', 'pdflatex',
                '--metadata', f'title={title}',
            ],
            capture_output=True, timeout=120
        )

        # Don't raise on warnings — only fail if file wasn't created
        if not os.path.exists(pdf_path):
            raise ValueError(f'pandoc PDF failed: {result.stderr.decode()}')

        with open(pdf_path, 'rb') as f:
            return f.read()


# ════════════════════════════════════════════════════════════════════════════
# VIEW
# ════════════════════════════════════════════════════════════════════════════

class QuestionDownloadView(APIView):
    """
    POST /api/catalog/questions/download/

    Body JSON:
        question_ids : [1, 2, 3, ...]
        title        : "Physics WAEC 2020"
        format       : "pdf" | "docx"
        copy_type    : "student" | "teacher"

    Returns a single file. React calls this endpoint twice per button —
    first for the student copy, then for the teacher copy.
    """
    permission_classes = [IsTeacher]

    def post(self, request):
        question_ids = request.data.get('question_ids', [])
        title        = request.data.get('title', 'Question Set')
        fmt          = request.data.get('format', 'pdf').lower()
        copy_type    = request.data.get('copy_type', 'student')

        questions = (
            Question.objects
            .filter(id__in=question_ids)
            .prefetch_related('choices', 'topics', 'theory_answer',)
            .select_related(
                'subject',
                'exam_series',
                'exam_series__exam_board',
            )
            .order_by('question_number')
        )

        if not questions.exists():
            return Response({'error': 'No questions found'}, status=400)

        include_answers = (copy_type == 'teacher')
        safe_title      = title.replace(' ', '_').replace('/', '-')
        copy_label      = 'teacher' if include_answers else 'student'
        filename        = f"{safe_title}_{copy_label}"
        qs_list         = list(questions)

        if fmt == 'docx':
            content = _generate_docx(qs_list, title, include_answers=include_answers)
            ct = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            response = HttpResponse(content, content_type=ct)
            response['Content-Disposition'] = f'attachment; filename="{filename}.docx"'
        else:
            content = _generate_pdf(qs_list, title, include_answers=include_answers)
            response = HttpResponse(content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'

        return response
