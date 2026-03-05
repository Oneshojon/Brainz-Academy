from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from .models import Subject, Topic, ExamBoard, ExamSeries, Question
from .serializers import SubjectSerializer, TopicSerializer, ExamBoardSerializer, QuestionSerializer
from .permissions import IsTeacher
from rest_framework.permissions import AllowAny, IsAuthenticated

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


class SubjectListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class ExamBoardListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    queryset = ExamBoard.objects.all()
    serializer_class = ExamBoardSerializer


class TopicListView(generics.ListAPIView):
    """Returns topics filtered by subject."""
    permission_classes = [AllowAny]
    serializer_class = TopicSerializer

    def get_queryset(self):
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            return Topic.objects.filter(subject_id=subject_id)
        return Topic.objects.none()


class AvailableYearsView(APIView):
    permission_classes = [AllowAny]
    """Returns distinct years available for a given exam board and subject."""

    def get(self, request):
        exam_board_id = request.query_params.get('exam_board')
        subject_id = request.query_params.get('subject')

        qs = ExamSeries.objects.all()
        if exam_board_id:
            qs = qs.filter(exam_board_id=exam_board_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        years = sorted(qs.values_list('year', flat=True).distinct())
        return Response({'years': years})


class GenerateQuestionsView(APIView):
    """Teacher-only endpoint to fetch questions based on filters."""
    permission_classes = [IsTeacher]

    def post(self, request):
        data = request.data

        exam_board_id = data.get('exam_board')
        subject_id = data.get('subject')
        years = data.get('years', [])           # list of years
        sitting = data.get('sitting')
        question_type = data.get('question_type')
        topics = data.get('topics', [])          # list of topic ids
        difficulty = data.get('difficulty')
        num_questions = data.get('num_questions')

        qs = Question.objects.all()

        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if question_type:
            qs = qs.filter(question_type=question_type)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if topics:
            qs = qs.filter(topics__id__in=topics).distinct()

        # Filter through exam series
        series_qs = ExamSeries.objects.all()
        if exam_board_id:
            series_qs = series_qs.filter(exam_board_id=exam_board_id)
        if years:
            series_qs = series_qs.filter(year__in=years)
        if sitting:
            series_qs = series_qs.filter(sitting=sitting)
        if subject_id:
            series_qs = series_qs.filter(subject_id=subject_id)

        if any([exam_board_id, years, sitting]):
            qs = qs.filter(exam_series__in=series_qs)

        if num_questions:
            qs = qs[:int(num_questions)]

        serializer = QuestionSerializer(qs, many=True, context={'request': request})
        return Response({'count': len(serializer.data), 'questions': serializer.data})
    
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
        num = q.question_number if q.question_number else i

        # Question text
        _para(f"{num}. {q.content.strip()}")

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
        num = q.question_number if q.question_number else i

        # Question text
        block.append(Paragraph(f"{num}. {esc(q.content.strip())}", normal))

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
            .prefetch_related('choices', 'topics')
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
