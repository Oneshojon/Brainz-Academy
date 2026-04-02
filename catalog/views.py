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
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.platypus import Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from docx import Document as DocxDocument
from docx.shared import Pt, Inches, RGBColor
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

def _generate_docx(questions, title, include_answers=False):
    doc = DocxDocument()

    # A4, 1-inch margins on all sides
    for section in doc.sections:
        section.page_width    = int(8.27  * 914400)
        section.page_height   = int(11.69 * 914400)
        section.top_margin    = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin   = Inches(1)
        section.right_margin  = Inches(1)

    # ── small helpers ────────────────────────────────────────────────────────

    def _para(text='', bold=False):
        """Add a Normal 12pt paragraph with zero spacing."""
        p = doc.add_paragraph()
        p.style = doc.styles['Normal']
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(0)
        if text:
            r = p.add_run(text)
            r.font.size = Pt(12)
            r.bold = bold
        return p

    def _empty():
        return _para('')

    # ── Header ───────────────────────────────────────────────────────────────
    hdr = _header_info(questions, title)
    _para(f"Subject: {hdr['subject']}")
    _para(f"Exam: {hdr['exam']}")

    # "Year: …\nPaper Type: CBT" — same paragraph, line break between
    p = doc.add_paragraph()
    p.style = doc.styles['Normal']
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)
    r1 = p.add_run(f"Year: {hdr['year']}")
    r1.font.size = Pt(12)
    r1.add_break()
    r2 = p.add_run("Paper Type: CBT")
    r2.font.size = Pt(12)

    copy_line = "Copy: Student" if not include_answers else "Copy: Teacher (With Answers & Topics)"
    _para(copy_line)
    _empty()

    # ── Questions ────────────────────────────────────────────────────────────
    for i, q in enumerate(questions, 1):
        clean_content = _strip_html(q.content)
        _para(f"{i}. {clean_content}")

        # Image (if the question has one stored in q.image)
        img_bytes, img_ext = _get_image_bytes(q)
        if img_bytes:
            img_para = doc.add_paragraph()
            img_para.style = doc.styles['Normal']
            img_para.paragraph_format.space_before = Pt(0)
            img_para.paragraph_format.space_after  = Pt(0)
            try:
                img_para.add_run().add_picture(io.BytesIO(img_bytes), width=Inches(3.5))
            except Exception:
                pass  # skip broken images silently

        # Choices — single paragraph, each choice on its own line via line-break
        if q.question_type == 'OBJ':
            choices = list(q.choices.all().order_by('label'))
            if choices:
                cp = doc.add_paragraph()
                cp.style = doc.styles['Normal']
                cp.paragraph_format.space_before = Pt(0)
                cp.paragraph_format.space_after  = Pt(0)
                for j, c in enumerate(choices):
                    run = cp.add_run(f"{c.label}. {c.choice_text}")
                    run.font.size = Pt(12)
                    if j < len(choices) - 1:
                        run.add_break()

        # Answer: X  ← teacher only
        if include_answers and q.question_type == 'OBJ':
            correct = q.choices.filter(is_correct=True).first()
            if correct:
                _para(f"Answer: {correct.label}")

        # Topic: …  ← teacher only, bold
        if include_answers:
            topics = list(q.topics.all())
            if topics:
                _para(f"Topic: {', '.join(t.name for t in topics)}", bold=True)

        _empty()

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()

 
 
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
            .select_related(
                'subject',
                'exam_series',
                'exam_series__exam_board',
            )
            .prefetch_related(
                'topics',           # needed for topic_names in serializer
            )
            .order_by('-exam_series__year', 'question_number')
        )
 
        if exam_board_id:
            qs = qs.filter(exam_series__exam_board_id=exam_board_id)
 
        # No choices or theory_answer prefetch — not needed for list view
        serializer = QuestionListSerializer(qs, many=True)
        return Response(serializer.data)

# ════════════════════════════════════════════════════════════════════════════
# PDF GENERATOR  (mirrors docx structure exactly)
# ════════════════════════════════════════════════════════════════════════════

def _generate_pdf(questions, title, include_answers=False):
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2.54*cm, rightMargin=2.54*cm,   # 1 inch = 2.54 cm
        topMargin=2.54*cm,  bottomMargin=2.54*cm,
    )

    styles = getSampleStyleSheet()

    normal = ParagraphStyle(
        'N', parent=styles['Normal'],
        fontSize=12, leading=18,
        spaceBefore=0, spaceAfter=0,
        fontName='Helvetica',
    )
    bold_s = ParagraphStyle(
        'B', parent=normal,
        fontName='Helvetica-Bold',
    )

    def esc(t):
        return (t or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    story = []

    # ── Header ───────────────────────────────────────────────────────────────
    hdr = _header_info(questions, title)
    story.append(Paragraph(esc(f"Subject: {hdr['subject']}"), normal))
    story.append(Paragraph(esc(f"Exam: {hdr['exam']}"), normal))
    story.append(Paragraph(esc(f"Year: {hdr['year']}"), normal))
    story.append(Paragraph("Paper Type: CBT", normal))
    copy_line = "Copy: Student" if not include_answers else "Copy: Teacher (With Answers &amp; Topics)"
    story.append(Paragraph(copy_line, normal))
    story.append(Spacer(1, 0.4*cm))

    # ── Questions ────────────────────────────────────────────────────────────
    for i, q in enumerate(questions, 1):
        block = []
        clean_content = esc(_strip_html(q.content))
        block.append(Paragraph(f"{i}. {clean_content}", normal))

        # Image
        img_bytes, _ = _get_image_bytes(q)
        if img_bytes:
            try:
                from PIL import Image as PILImage
                pil = PILImage.open(io.BytesIO(img_bytes))
                w_px, h_px = pil.size
                max_w_cm = 10 * cm
                # Convert pixels to points roughly (96 dpi → 1pt = 1/72 in)
                w_pt = w_px * (72 / 96)
                h_pt = h_px * (72 / 96)
                scale = min(1.0, max_w_cm / w_pt)
                img_w = w_pt * scale
                img_h = h_pt * scale
                block.append(RLImage(io.BytesIO(img_bytes), width=img_w, height=img_h))
            except Exception:
                pass

        # Choices — one <br/> separated paragraph
        if q.question_type == 'OBJ':
            choices = list(q.choices.all().order_by('label'))
            if choices:
                lines = '<br/>'.join(f"{c.label}. {esc(c.choice_text)}" for c in choices)
                block.append(Paragraph(lines, normal))

        # Answer (teacher only)
        if include_answers and q.question_type == 'OBJ':
            correct = q.choices.filter(is_correct=True).first()
            if correct:
                block.append(Paragraph(f"Answer: {correct.label}", normal))

        # Topic (teacher only, bold)
        if include_answers:
            topics = list(q.topics.all())
            if topics:
                block.append(Paragraph(f"Topic: {esc(', '.join(t.name for t in topics))}", bold_s))

        block.append(Spacer(1, 0.4*cm))
        story.append(KeepTogether(block))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


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
