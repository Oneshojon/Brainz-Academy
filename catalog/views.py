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
    

import re
import os
import subprocess
import tempfile
import logging
from datetime import date
from django.db.models import Prefetch
from catalog.models import Choice, Topic

logger = logging.getLogger(__name__)

# ── Compiled patterns at module level — not recompiled on every call ──────────
_BR_RE          = re.compile(r'<br\s*/?>', re.IGNORECASE)
_TAG_RE         = re.compile(r'<[^>]+>')
_ENTITY_MAP     = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' '}
_ENTITY_RE      = re.compile(r'&(?:amp|lt|gt|nbsp);')


def _strip_html(text):
    """Strip HTML tags and decode basic entities."""
    if not text:
        return ''
    text = _BR_RE.sub('\n', text)
    text = _TAG_RE.sub('', text)
    text = _ENTITY_RE.sub(lambda m: _ENTITY_MAP[m.group()], text)
    return text.strip()


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
        logger.exception(f'Failed to read image for question {question.pk}')
    return None, None


def _prefetch_questions(questions):
    """
    Apply select_related and prefetch_related to a questions queryset.
    Call this in the view before passing questions to any generator.
    Eliminates all N+1s for subject, exam_series, exam_board, choices, topics.
    """
    return (
        questions
        .select_related('subject', 'exam_series__exam_board')
        .prefetch_related(
            Prefetch('choices', queryset=Choice.objects.order_by('label')),
            'topics',
        )
    )


def _header_info(questions, title):
    """
    Build header metadata from questions.
    Requires questions to have select_related('subject', 'exam_series__exam_board') applied.
    All FK traversals hit the prefetch cache — zero extra queries.
    """
    subjects, boards, years = set(), set(), set()
    for q in questions:
        if q.subject_id:                        # use _id to avoid any FK hit
            subjects.add(q.subject.name)
        if q.exam_series_id:
            if q.exam_series.exam_board_id:
                boards.add(q.exam_series.exam_board.name)
            if q.exam_series.year:
                years.add(str(q.exam_series.year))
    return {
        'subject': ', '.join(sorted(subjects)) or title,
        'exam':    ', '.join(sorted(boards))   or '—',
        'year':    ', '.join(sorted(years))    or str(date.today().year),
    }

 
 
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

# ── Shared HTML builder — used by both DOCX and PDF generators ───────────────

def _build_question_html(questions, title, include_answers=False):
    """
    Builds the HTML string and writes images to images_dir.
    Returns (html_generator, images_dir) — caller manages the tmpdir.
    Called internally by _generate_docx and _generate_pdf.
    Expects questions to have _prefetch_questions() already applied.
    """
    hdr       = _header_info(questions, title)
    copy_line = "Copy: Student" if not include_answers else "Copy: Teacher (With Answers & Topics)"

    def _lines(images_dir):
        yield '<html><head><meta charset="utf-8"></head><body>\n'
        yield f'<p>Subject: {hdr["subject"]}</p>\n'
        yield f'<p>Exam: {hdr["exam"]}</p>\n'
        yield f'<p>Year: {hdr["year"]}</p>\n'
        yield '<p>Paper Type: CBT</p>\n'
        yield f'<p>{copy_line}</p>\n'
        yield '<p>&nbsp;</p>\n'

        for i, q in enumerate(questions, 1):
            content = q.content.strip()
            if _FIRST_P_RE.match(content):
                content = _FIRST_P_RE.sub(
                    rf'\1<strong>{i}.</strong>&nbsp;', content, count=1
                )
            elif _BLOCK_TAG_RE.match(content):
                content = f'<p><strong>{i}.</strong></p>\n{content}'
            else:
                content = f'<p><strong>{i}.</strong>&nbsp;{content}</p>'
            yield content + '\n'

            img_bytes, img_ext = _get_image_bytes(q)
            if img_bytes:
                img_filename = f'q{i}.{img_ext or "png"}'
                with open(os.path.join(images_dir, img_filename), 'wb') as f:
                    f.write(img_bytes)
                yield f'<p><img src="images/{img_filename}" style="max-width:400px"/></p>\n'

            if q.question_type == 'OBJ':
                choices = list(q.choices.all())
                for c in choices:
                    yield f'<p>{c.label}. {c.choice_text}</p>\n'

                if include_answers:
                    correct = next((c for c in choices if c.is_correct), None)
                    if correct:
                        yield f'<p><strong>Answer: {correct.label}</strong></p>\n'

            if include_answers:
                topic_names = [t.name for t in q.topics.all()]
                if topic_names:
                    yield f'<p><strong>Topic: {", ".join(topic_names)}</strong></p>\n'

            yield '<p>&nbsp;</p>\n'

        yield '</body></html>\n'

    return _lines


def _generate_docx(questions, title, include_answers=False):
    """
    Generate DOCX. Expects _prefetch_questions() applied by caller.
    Returns bytes.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        html_path  = os.path.join(tmpdir, 'input.html')
        docx_path  = os.path.join(tmpdir, 'output.docx')
        images_dir = os.path.join(tmpdir, 'images')
        os.makedirs(images_dir, exist_ok=True)

        html_lines = _build_question_html(questions, title, include_answers)
        with open(html_path, 'w', encoding='utf-8') as f:
            f.writelines(html_lines(images_dir))

        result = subprocess.run(
            [
                'pandoc', html_path,
                '-o', docx_path,
                '--from', 'html+tex_math_single_backslash',
                '--to', 'docx',
                '--metadata', f'title={title}',
                '--resource-path', tmpdir,
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


def _generate_pdf(questions, title, include_answers=False):
    """
    Generate PDF directly from HTML via xelatex — single pandoc call.
    No DOCX intermediate. Expects _prefetch_questions() applied by caller.
    Returns bytes.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        html_path  = os.path.join(tmpdir, 'input.html')
        pdf_path   = os.path.join(tmpdir, 'output.pdf')
        images_dir = os.path.join(tmpdir, 'images')
        os.makedirs(images_dir, exist_ok=True)

        # Same HTML builder — no second pandoc run for DOCX
        html_lines = _build_question_html(questions, title, include_answers)
        with open(html_path, 'w', encoding='utf-8') as f:
            f.writelines(html_lines(images_dir))

        result = subprocess.run(
            [
                'pandoc', html_path,
                '-o', pdf_path,
                '--from', 'html+tex_math_single_backslash',
                '--pdf-engine', 'xelatex',
                '--variable', 'geometry:margin=1in',
                '--resource-path', tmpdir,
            ],
            capture_output=True, timeout=120,
            cwd=tmpdir,
        )

        if not os.path.exists(pdf_path):
            raise ValueError(
                f'PDF failed: rc={result.returncode} '
                f'{result.stderr.decode()[:300]}'
            )

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
