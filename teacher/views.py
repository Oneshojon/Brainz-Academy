from django.db.models import F, FloatField, ExpressionWrapper, Avg, Count
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from functools import wraps
from django.utils.html import escape

from catalog.models import Subject, ExamBoard, Question, ExamSeries, Choice, Topic
from practice.models import PracticeSession, UserAnswer
from catalog.cache_utils import invalidate_feature_flags

import re
import io
from docx import Document as DocxDocument
from docx.oxml.ns import qn
from django.core.files.base import ContentFile
from django.db import transaction
from Users.models import Referral, CustomUser
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from catalog.models import LessonNote
from catalog.feature_flags import feature_required, is_feature_enabled
import json


# ══════════════════════════════════════════════════════════════════════════════
# DECORATORS
# ══════════════════════════════════════════════════════════════════════════════

def teacher_required(view_func):
    @wraps(view_func)
    @login_required
    def wrapper(request, *args, **kwargs):
        if request.user.role != 'TEACHER':
            return redirect('Users:dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_required(view_func):
    @wraps(view_func)
    @login_required
    def wrapper(request, *args, **kwargs):
        if not getattr(request.user, 'is_admin', False):
            return redirect('teacher:dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════

@teacher_required
def dashboard(request):
    is_admin = getattr(request.user, 'is_admin', False)
    total_questions = Question.objects.count()

    total_students  = None
    total_sessions  = None
    recent_sessions = []
    top_subjects    = []

    if is_admin:
        total_students = PracticeSession.objects.values('user').distinct().count()
        total_sessions = PracticeSession.objects.filter(completed_at__isnull=False).count()
        recent_sessions = (
            PracticeSession.objects
            .filter(completed_at__isnull=False)
            .select_related('user', 'subject')
            .order_by('-completed_at')[:8]
        )
        top_subjects = (
            PracticeSession.objects
            .filter(completed_at__isnull=False, total_marks__gt=0)
            .values('subject__name')
            .annotate(
                count=Count('id'),
                avg_score=Avg(
                    ExpressionWrapper(
                        F('score') * 100.0 / F('total_marks'),
                        output_field=FloatField()
                    )
                )
            )
            .order_by('-count')[:5]
        )

    context = {
        'is_admin':        is_admin,
        'total_questions': total_questions,
        'total_students':  total_students,
        'total_sessions':  total_sessions,
        'recent_sessions': recent_sessions,
        'top_subjects':    top_subjects,
    }
    return render(request, 'teacher/dashboard.html', context)


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN-ONLY VIEWS
# ══════════════════════════════════════════════════════════════════════════════

@admin_required
def question_sets(request):
    subjects    = Subject.objects.all().order_by('name')
    exam_boards = ExamBoard.objects.all().order_by('name')
    subject_id  = request.GET.get('subject')
    board_id    = request.GET.get('board')

    questions = Question.objects.select_related(
        'exam_series', 'exam_series__subject', 'exam_series__exam_board'
    ).order_by('-exam_series__year')

    if subject_id:
        questions = questions.filter(exam_series__subject_id=subject_id)
    if board_id:
        questions = questions.filter(exam_series__exam_board_id=board_id)

    questions = list(questions.select_related('exam_series'))
    grouped   = {}
    for q in questions:
        key = str(q.exam_series) if q.exam_series else 'Uncategorised'
        grouped.setdefault(key, []).append(q)

    context = {
        'grouped':          grouped,
        'subjects':         subjects,
        'exam_boards':      exam_boards,
        'selected_subject': subject_id,
        'selected_board':   board_id,
        'total_questions':  len(questions),
    }
    return render(request, 'teacher/question_sets.html', context)


@admin_required
def students(request):
    from Users.models import CustomUser
    subject_id = request.GET.get('subject')
    subjects   = Subject.objects.all().order_by('name')
    student_qs = CustomUser.objects.filter(role='STUDENT').prefetch_related('practice_sessions')

    student_stats = []
    for student in student_qs:
        sessions = student.practice_sessions.filter(completed_at__isnull=False)
        if subject_id:
            sessions = sessions.filter(subject_id=subject_id)
        session_count = sessions.count()
        avg_score = sessions.filter(total_marks__gt=0).aggregate(
            avg=Avg(
                ExpressionWrapper(
                    F('score') * 100.0 / F('total_marks'),
                    output_field=FloatField()
                )
            )
        )['avg']
        last_session = sessions.order_by('-completed_at').first()
        student_stats.append({
            'student':       student,
            'session_count': session_count,
            'avg_score':     round(avg_score, 1) if avg_score else None,
            'last_active':   last_session.completed_at if last_session else None,
            'streak':        student.streak,
        })

    student_stats.sort(key=lambda x: x['avg_score'] or 0, reverse=True)

    context = {
        'student_stats':    student_stats,
        'subjects':         subjects,
        'selected_subject': subject_id,
        'total_students':   len(student_stats),
    }
    return render(request, 'teacher/students.html', context)


@admin_required
@feature_required('csv_upload')
def upload_questions(request):
    if request.method == 'POST':
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return render(request, 'teacher/upload.html', {'error': 'Please select a CSV file.'})
        if not csv_file.name.endswith('.csv'):
            return render(request, 'teacher/upload.html', {'error': 'Only CSV files are supported.'})

        import csv
        decoded = csv_file.read().decode('utf-8')
        reader  = csv.DictReader(io.StringIO(decoded))
        created = 0
        errors  = []
        required_fields = {'content', 'question_type', 'subject'}

        for i, row in enumerate(reader, start=2):
            missing = required_fields - set(row.keys())
            if missing:
                errors.append(f'Row {i}: Missing columns: {", ".join(missing)}')
                continue
            try:
                subject = Subject.objects.filter(name__iexact=row['subject'].strip()).first()
                if not subject:
                    errors.append(f'Row {i}: Subject "{row["subject"]}" not found.')
                    continue
                q_type = row['question_type'].strip().upper()
                if q_type not in ('OBJ', 'THEORY'):
                    errors.append(f'Row {i}: question_type must be OBJ or THEORY.')
                    continue
                series = None
                if row.get('exam_board') and row.get('year'):
                    board = ExamBoard.objects.filter(abbreviation__iexact=row['exam_board'].strip()).first()
                    if board:
                        series, _ = ExamSeries.objects.get_or_create(
                            subject=subject, exam_board=board, year=int(row['year']),
                            defaults={'sitting': row.get('sitting', 'MAY_JUNE')}
                        )
                q = Question.objects.create(
                    content=row['content'].strip(), question_type=q_type,
                    subject=subject, exam_series=series,
                    question_number=row.get('question_number') or None,
                )
                topics_raw = row.get('topics', '').strip()
                if topics_raw:
                    for name in [t.strip() for t in topics_raw.split('|') if t.strip()]:
                        topic = Topic.objects.filter(name__iexact=name, subject=subject).first()
                        if topic:
                            q.topics.add(topic)
                        else:
                            errors.append(f'Row {i}: Topic "{name}" not found — skipped.')
                if q_type == 'OBJ':
                    correct = row.get('correct_answer', 'A').strip().upper()
                    for label in ['A', 'B', 'C', 'D']:
                        text = row.get(f'choice_{label.lower()}', '').strip()
                        if text:
                            Choice.objects.create(
                                question=q, label=label, choice_text=text,
                                is_correct=(label == correct),
                            )
                created += 1
            except Exception as e:
                errors.append(f'Row {i}: {str(e)}')

        return render(request, 'teacher/upload.html', {'success': True, 'created': created, 'errors': errors})

    return render(request, 'teacher/upload.html', {
        'subjects':    Subject.objects.all().order_by('name'),
        'exam_boards': ExamBoard.objects.all().order_by('name'),
    })


@admin_required
@feature_required('docx_upload')
def upload_docx(request):
    if request.method != 'POST':
        return render(request, 'teacher/upload_docx.html')

    uploaded = request.FILES.get('docx_file')
    if not uploaded or not uploaded.name.endswith('.docx'):
        return render(request, 'teacher/upload_docx.html', {'error': 'Please upload a valid .docx file.'})

    try:
        header, questions = _parse_docx(uploaded.read())
    except Exception as e:
        return render(request, 'teacher/upload_docx.html', {'error': f'Could not read file: {e}'})

    if not questions:
        return render(request, 'teacher/upload_docx.html', {
            'error': 'No questions found. Make sure the file follows the expected format.'
        })

    subject_name = header['subject']
    board_name   = header['exam']
    year_str     = header['year']
    sitting      = header['sitting']

    subject = Subject.objects.filter(name__iexact=subject_name).first()
    if not subject:
        all_subjects = ', '.join(Subject.objects.values_list('name', flat=True))
        return render(request, 'teacher/upload_docx.html', {
            'error': f'Subject "{subject_name}" not found. Available: {all_subjects}'
        })

    exam_board = ExamBoard.objects.filter(name__iexact=board_name).first()
    if not exam_board:
        all_boards = ', '.join(ExamBoard.objects.values_list('name', flat=True))
        return render(request, 'teacher/upload_docx.html', {
            'error': f'Exam board "{board_name}" not found. Available: {all_boards}'
        })

    try:
        year = int(year_str)
    except (ValueError, TypeError):
        return render(request, 'teacher/upload_docx.html', {'error': f'Could not parse year "{year_str}".'})

    exam_series, _ = ExamSeries.objects.get_or_create(
        exam_board=exam_board, subject=subject, year=year, sitting=sitting,
    )

    created_count = 0
    skipped_count = 0
    skipped_nums  = []
    errors        = []

    for q_data in questions:
        try:
            if Question.objects.filter(exam_series=exam_series, question_number=q_data['number']).exists():
                skipped_count += 1
                skipped_nums.append(q_data['number'])
                continue

            with transaction.atomic():
                question = Question.objects.create(
                    subject=subject, exam_series=exam_series,
                    question_number=q_data['number'],
                    question_type='OBJ' if q_data['choices'] else 'THEORY',
                    content=q_data['content'], marks=1,
                )
                if q_data['image_bytes']:
                    ext      = q_data['image_ext'] or 'png'
                    filename = f"q_{subject.name.lower()}_{year}_{q_data['number']}.{ext}"
                    question.image.save(filename, ContentFile(q_data['image_bytes']), save=True)

                seen_labels = set()
                for c in q_data['choices']:
                    if c['label'] in seen_labels:
                        continue
                    seen_labels.add(c['label'])
                    Choice.objects.create(
                        question=question, label=c['label'],
                        choice_text=c['text'], is_correct=c['is_correct'],
                    )
                for topic_name in q_data['topics']:
                    topic_name = topic_name.strip()
                    if topic_name:
                        topic, _ = Topic.objects.get_or_create(
                            name__iexact=topic_name,
                            defaults={'name': topic_name, 'subject': subject}
                        )
                        question.topics.add(topic)

            created_count += 1
            from catalog.cache_utils import invalidate_subject_caches
            invalidate_subject_caches(subject.id)
        except Exception as e:
            errors.append(f"Q{q_data['number']}: {e}")

    context = {
        'success': True, 'subject': subject.name, 'exam_board': exam_board.name,
        'year': year, 'sitting': sitting, 'total_parsed': len(questions),
        'created_count': created_count, 'skipped_count': skipped_count,
        'skipped_nums': skipped_nums, 'errors': errors,
    }
    return render(request, 'teacher/upload_docx.html', context)

# Add this to teacher/views.py

@admin_required
def upload_notes(request):
    """
    Upload revision notes and/or worksheets as PDFs.
    Each PDF can contain multiple topics — each topic starts on a new page.
    """
    from catalog.note_pdf_parser import parse_note_pdf
    from catalog.models import LessonNote, Worksheet, Subject, Topic
    from django.core.files.base import ContentFile

    if request.method != 'POST':
        return render(request, 'teacher/upload_notes.html', {
            'subjects': Subject.objects.all().order_by('name'),
        })

    note_file      = request.FILES.get('note_pdf')
    worksheet_file = request.FILES.get('worksheet_pdf')
    overwrite      = request.POST.get('overwrite') == 'on'

    if not note_file and not worksheet_file:
        return render(request, 'teacher/upload_notes.html', {
            'error': 'Please upload at least one PDF file.',
            'subjects': Subject.objects.all().order_by('name'),
        })

    note_results      = []
    worksheet_results = []
    all_errors        = []

    # ── Process revision notes ────────────────────────────────────────────────
    if note_file:
        parsed, errors = parse_note_pdf(note_file.read())
        all_errors.extend([f'[Notes] {e}' for e in errors])

        for item in parsed:
            subject = Subject.objects.filter(name__iexact=item['subject']).first()
            if not subject:
                all_errors.append(f'[Notes] Subject "{item["subject"]}" not found — skipped.')
                continue

            topic = Topic.objects.filter(
                name__iexact=item['topic'], subject=subject
            ).first()
            if not topic:
                all_errors.append(f'[Notes] Topic "{item["topic"]}" not found in {subject.name} — skipped.')
                continue

            existing = getattr(topic, 'lesson_note', None)
            if existing and not overwrite:
                note_results.append({
                    'topic': topic.name, 'subject': subject.name,
                    'status': 'skipped', 'reason': 'already exists (overwrite not checked)'
                })
                continue

            # Save PDF to model
            filename = f"note_{subject.name.lower().replace(' ','_')}_{topic.name.lower().replace(' ','_')}.pdf"
            note, created = LessonNote.objects.update_or_create(
                topic=topic,
                defaults={
                    'title':           f"{topic.name} — Revision Notes",
                    'video_url':       item['video_url'],
                    'is_ai_generated': False,
                    'uploaded_by':     request.user,
                }
            )
            note.pdf_file.save(filename, ContentFile(item['pdf_bytes']), save=True)

            note_results.append({
                'topic': topic.name, 'subject': subject.name,
                'status': 'created' if created else 'updated',
                'video': item['video_url'] or '—',
            })

    # ── Process worksheets ────────────────────────────────────────────────────
    if worksheet_file:
        parsed, errors = parse_note_pdf(worksheet_file.read())
        all_errors.extend([f'[Worksheet] {e}' for e in errors])

        for item in parsed:
            subject = Subject.objects.filter(name__iexact=item['subject']).first()
            if not subject:
                all_errors.append(f'[Worksheet] Subject "{item["subject"]}" not found — skipped.')
                continue

            topic = Topic.objects.filter(
                name__iexact=item['topic'], subject=subject
            ).first()
            if not topic:
                all_errors.append(f'[Worksheet] Topic "{item["topic"]}" not found in {subject.name} — skipped.')
                continue

            existing = getattr(topic, 'worksheet', None)
            if existing and not overwrite:
                worksheet_results.append({
                    'topic': topic.name, 'subject': subject.name,
                    'status': 'skipped', 'reason': 'already exists (overwrite not checked)'
                })
                continue

            filename = f"ws_{subject.name.lower().replace(' ','_')}_{topic.name.lower().replace(' ','_')}.pdf"
            ws, created = Worksheet.objects.update_or_create(
                topic=topic,
                defaults={
                    'title':           f"{topic.name} — Worksheet",
                    'video_url':       item['video_url'],
                    'is_ai_generated': False,
                    'uploaded_by':     request.user,
                }
            )
            ws.pdf_file.save(filename, ContentFile(item['pdf_bytes']), save=True)

            worksheet_results.append({
                'topic': topic.name, 'subject': subject.name,
                'status': 'created' if created else 'updated',
                'video': item['video_url'] or '—',
            })

    return render(request, 'teacher/upload_notes.html', {
        'success':          True,
        'note_results':     note_results,
        'worksheet_results':worksheet_results,
        'errors':           all_errors,
        'subjects':         Subject.objects.all().order_by('name'),
    })

@admin_required
def feature_flags_page(request):
    from catalog.models import FeatureFlag
    flags = FeatureFlag.objects.all().order_by('label')
    return render(request, 'teacher/feature_flags.html', {'flags': flags})


@admin_required
def toggle_flag(request):
    from catalog.models import FeatureFlag
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    data    = json.loads(request.body)
    flag_id = data.get('flag_id')
    enabled = data.get('enabled', True)
    try:
        flag            = FeatureFlag.objects.get(id=flag_id)
        flag.is_enabled = bool(enabled)
        flag.save(update_fields=['is_enabled', 'updated_at'])
        invalidate_feature_flags()
        return JsonResponse({'success': True, 'key': flag.key, 'enabled': flag.is_enabled})
    except FeatureFlag.DoesNotExist:
        return JsonResponse({'error': 'Flag not found'}, status=404)


# ══════════════════════════════════════════════════════════════════════════════
# LESSON NOTES  (all teachers + admin)
# ══════════════════════════════════════════════════════════════════════════════

@teacher_required
@feature_required('lesson_notes')
def lesson_notes(request):
    """
    Teacher lesson notes browser.
    GET  ?subject=<id>&topic=<id>
    POST { action:'generate_ai'|'accept_ai', topic_id, content }
    """
    if request.method == 'POST':
        data   = json.loads(request.body)
        action = data.get('action')
        if action == 'generate_ai':
            return _handle_ai_generate(request, data)
        if action == 'accept_ai':
            return _handle_ai_accept(request, data)
        return JsonResponse({'error': 'Unknown action'}, status=400)

    # ── GET ───────────────────────────────────────────────────────────────────
    from catalog.cache_utils import get_or_set, CACHE_5_MIN, KEY_ALL_SUBJECTS

    all_subjects = get_or_set(
        KEY_ALL_SUBJECTS,
        lambda: list(Subject.objects.all().order_by('name')),
        CACHE_5_MIN
    )
    covered_ids = get_or_set(
        'catalog:covered_subject_ids',
        lambda: set(Subject.objects.filter(topics__isnull=False).values_list('id', flat=True)),
        CACHE_5_MIN
    )

    selected_subject_id = request.GET.get('subject')
    selected_topic_id   = request.GET.get('topic')

    selected_subject = None
    topics           = []
    selected_topic   = None 
    note             = None
    worksheet        = None
    subject_covered  = True
    ai_enabled       = is_feature_enabled('ai_lesson_notes', user=request.user)

    if selected_subject_id:
        try:
            selected_subject = Subject.objects.get(id=selected_subject_id)
            subject_covered  = selected_subject.id in covered_ids
            if subject_covered:
                topics = Topic.objects.filter(subject=selected_subject).prefetch_related('lesson_note', 'worksheet').order_by('name')
        except Subject.DoesNotExist:
            pass

    # Updated Topic retrieval
    if selected_topic_id and subject_covered:
        try:
            selected_topic = Topic.objects.prefetch_related(
                'lesson_note', 
                'worksheet'
            ).get(id=selected_topic_id, subject=selected_subject)
            
            note = getattr(selected_topic, 'lesson_note', None)
            worksheet = getattr(selected_topic, 'worksheet', None)
        except Topic.DoesNotExist:
            pass

    # ── Section 10: free-tier topic access check ──────────────────────────────
    # This runs only when a topic has been selected.
    # Admins and subscribed teachers always pass.
    # Free teachers have a lifetime limit of 5 unique topics.
    lesson_access        = None
    lesson_access_denied = False

    if selected_topic:
        from catalog.subscription_access import check_lesson_note_access
        from catalog.models import FreeTeacherTopicAccess

        lesson_access = check_lesson_note_access(request.user, selected_topic)

        if not lesson_access['allowed']:
            # Teacher has used all 5 free topic slots — show upgrade prompt
            lesson_access_denied = True
        else:
            # Record this topic as accessed.
            # Uses get_or_create internally so calling it again for the same
            # topic never consumes an extra slot.
            FreeTeacherTopicAccess.record_access(request.user, selected_topic)
    # ── end Section 10 ───────────────────────────────────────────────────────

    context = {
        'all_subjects':         all_subjects,
        'covered_ids':          covered_ids,
        'selected_subject':     selected_subject,
        'subject_covered':      subject_covered,
        'topics':               topics,
        'selected_topic':       selected_topic,
        'note':                 note,
        'ai_enabled':           ai_enabled,
        # Section 10 additions — used by lesson_notes.html template
        'lesson_access':        lesson_access,
        'lesson_access_denied': lesson_access_denied,
        'worksheet': worksheet,
    }
    return render(request, 'teacher/lesson_notes.html', context)


def _handle_ai_generate(request, data):
    import anthropic
    topic_id = data.get('topic_id')
    try:
        topic = Topic.objects.select_related('subject').get(id=topic_id)
    except Topic.DoesNotExist:
        return JsonResponse({'error': 'Topic not found'}, status=404)

    prompt = f"""You are an expert {topic.subject.name} educator writing a comprehensive lesson note for Nigerian secondary school students (WAEC/NECO level).

Write detailed lesson notes on:
Subject: {topic.subject.name}
Topic: {topic.name}

Structure your notes with:
1. **Learning Objectives** — what the student should know by the end
2. **Introduction** — brief overview and relevance
3. **Main Content** — detailed explanation with subheadings, broken into clear sections
4. **Key Terms** — important vocabulary with definitions
5. **Summary** — bullet-point recap of key points
6. **Exam Tips** — common exam questions and how to approach them
7. **Practice Questions** — 3-5 short questions with answers

Write in clear, accessible English. Use examples relevant to Nigerian students where appropriate. Format using markdown."""

    try:
        client  = anthropic.Anthropic()
        message = client.messages.create(
            model='claude-opus-4-6', max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        return JsonResponse({'content': message.content[0].text, 'topic_name': topic.name})
    except Exception as e:
        return JsonResponse({'error': f'AI generation failed: {e}'}, status=500)


def _handle_ai_accept(request, data):
    topic_id   = data.get('topic_id')
    ai_content = data.get('content', '').strip()
    if not ai_content:
        return JsonResponse({'error': 'No content provided'}, status=400)
    try:
        topic = Topic.objects.select_related('subject').get(id=topic_id)
    except Topic.DoesNotExist:
        return JsonResponse({'error': 'Topic not found'}, status=404)

    note, _ = LessonNote.objects.update_or_create(
        topic=topic,
        defaults={
            'title':           f"{topic.name} — Lesson Notes",
            'ai_content':      ai_content,
            'is_ai_generated': True,
            'uploaded_by':     request.user,
            'description':     f"AI-generated notes for {topic.name}.",
        }
    )
    return JsonResponse({'success': True, 'note_id': note.id, 'message': 'Lesson note saved.'})


# ══════════════════════════════════════════════════════════════════════════════
# DOCX PARSER HELPERS
# ══════════════════════════════════════════════════════════════════════════════

"""
Drop-in replacement for _parse_docx and helpers in teacher/views.py

Handles:
- Bold, italic, bold+italic runs
- Superscript / subscript (vertAlign)
- OMML math elements (Office Math Markup Language)
- Empty lines preserved as <p class="empty-line">
- Indented paragraphs (right-positioned answer blanks)
- Center / right alignment
- Tables (converted to HTML <table>)
- Images (existing logic preserved)
- Intentional blank space for student answers
"""

from docx import Document as DocxDocument
from docx.oxml.ns import qn
from django.utils.html import escape
import re
import io

# ── Namespace constants ───────────────────────────────────────────────────────
MATH_NS  = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
W_NS     = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

_SITTING_MAP = {
    'may': 'MAY_JUNE', 'june': 'MAY_JUNE',
    'nov': 'NOV_DEC',  'dec':  'NOV_DEC',
    'mock': 'MOCK',    'cbt':  'MAY_JUNE',
    '': 'MAY_JUNE',
}

def _resolve_sitting(paper_type_str):
    s = paper_type_str.lower()
    for key, val in _SITTING_MAP.items():
        if key and key in s:
            return val
    return 'MAY_JUNE'


def _clean(text):
    return text.replace('\xa0', ' ').replace('\u00a0', ' ').strip()


def _extract_omml_text(element):
    """Extract readable text from an OMML math element."""
    texts = []
    # math:t elements
    for t in element.findall('.//{%s}t' % MATH_NS):
        if t.text:
            texts.append(t.text)
    # also w:t inside math (rare but happens)
    for t in element.findall('.//' + qn('w:t')):
        if t.text:
            texts.append(t.text)
    return ''.join(texts).strip()


def _run_to_html(run_elem):
    """
    Convert a single <w:r> element to HTML.
    Handles: bold, italic, superscript, subscript.
    """
    rpr = run_elem.find(qn('w:rPr'))
    is_bold   = False
    is_italic = False
    is_super  = False
    is_sub    = False

    if rpr is not None:
        is_bold   = rpr.find(qn('w:b'))  is not None
        is_italic = rpr.find(qn('w:i'))  is not None
        vert = rpr.find(qn('w:vertAlign'))
        if vert is not None:
            val = vert.get(qn('w:val'))
            is_super = val == 'superscript'
            is_sub   = val == 'subscript'

    text = ''
    for t in run_elem.findall(qn('w:t')):
        text += (t.text or '')

    if not text:
        return ''

    text = escape(text)

    # Apply formatting (inner to outer)
    if is_super: text = f'<sup>{text}</sup>'
    if is_sub:   text = f'<sub>{text}</sub>'
    if is_bold and is_italic: text = f'<strong><em>{text}</em></strong>'
    elif is_bold:   text = f'<strong>{text}</strong>'
    elif is_italic: text = f'<em>{text}</em>'

    return text


def _para_to_html(para, block_type='content'):
    """
    Convert a python-docx Paragraph to an HTML string.
    Preserves: bold, italic, super/sub, math, alignment, indentation, empty lines.
    block_type: 'content' | 'header'
    """
    p_elem = para._p

    # ── Detect alignment ──────────────────────────────────────────────────────
    jc = p_elem.find('.//' + qn('w:jc'))
    align_val = jc.get(qn('w:val')) if jc is not None else None
    align_css = ''
    if align_val == 'center':
        align_css = 'text-align:center;'
    elif align_val == 'right':
        align_css = 'text-align:right;'

    # ── Detect indentation ────────────────────────────────────────────────────
    ind = p_elem.find('.//' + qn('w:ind'))
    indent_css = ''
    if ind is not None:
        left = ind.get(qn('w:left'))
        if left and int(left) > 500:  # twips — significant indent
            px = int(int(left) / 1440 * 96)  # twips → px (96dpi)
            indent_css = f'margin-left:{px}px;'

    style = (align_css + indent_css).strip(';')
    style_attr = f' style="{style}"' if style else ''

    # ── Build content by iterating child elements ─────────────────────────────
    content = ''
    for child in p_elem:
        local = child.tag.split('}')[-1] if '}' in child.tag else child.tag

        if local == 'r':
            # Regular run
            content += _run_to_html(child)

        elif local == 'hyperlink':
            # Hyperlink — extract runs inside
            for r in child.findall(qn('w:r')):
                content += _run_to_html(r)

        elif local == 'oMath' or child.tag == f'{{{MATH_NS}}}oMath':
            # OMML math
            math_text = _extract_omml_text(child)
            content += f'<span class="math-expr">{escape(math_text)}</span>'

        elif local == 'oMathPara' or child.tag == f'{{{MATH_NS}}}oMathPara':
            # Math paragraph (display math)
            math_texts = []
            for om in child.findall('{%s}oMath' % MATH_NS):
                math_texts.append(_extract_omml_text(om))
            if math_texts:
                content += f'<span class="math-expr">{"  ".join(math_texts)}</span>'

        elif local in ('bookmarkStart', 'bookmarkEnd', 'proofErr', 'del', 'rPrChange'):
            pass  # skip metadata elements

        elif local == 'ins':
            # Track changes — show inserted content
            for r in child.findall(qn('w:r')):
                content += _run_to_html(r)

    # ── Return ────────────────────────────────────────────────────────────────
    if not content.strip():
        return '<p class="empty-line">&nbsp;</p>'

    return f'<p{style_attr}>{content}</p>'


def _table_to_html(table):
    """Convert a python-docx Table to an HTML string."""
    rows_html = []
    for row in table.rows:
        cells_html = []
        for cell in row.cells:
            # Each cell can have multiple paragraphs
            cell_content = ''
            for para in cell.paragraphs:
                html = _para_to_html(para)
                # Strip wrapping <p> for single-line cells
                inner = re.sub(r'^<p[^>]*>(.*)</p>$', r'\1', html, flags=re.DOTALL)
                if inner.strip() and inner.strip() != '&nbsp;':
                    cell_content += inner + '<br>'
            cell_content = cell_content.rstrip('<br>')
            cells_html.append(f'<td>{cell_content or "&nbsp;"}</td>')
        rows_html.append(f'<tr>{"".join(cells_html)}</tr>')
    return (
        '<div class="q-table"><table border="1" cellpadding="4" cellspacing="0">'
        + ''.join(rows_html)
        + '</table></div>'
    )


def _para_image(para, img_map):
    """Extract image bytes/ext from a paragraph if present."""
    for blip in para._element.findall('.//' + qn('a:blip')):
        rid = blip.get(qn('r:embed'))
        if rid and rid in img_map:
            return img_map[rid]
    return None, None


def _parse_docx(file_bytes):
    """
    Robust DOCX parser.
    Returns (header, questions) where each question has:
        number, content (HTML string), image_bytes, image_ext, choices, answer, topics
    """
    doc   = DocxDocument(io.BytesIO(file_bytes))
    paras = doc.paragraphs

    # ── Build image map ───────────────────────────────────────────────────────
    img_map = {}
    for rel in doc.part.rels.values():
        if 'image' in rel.reltype:
            try:
                img_map[rel.rId] = (
                    rel.target_part.blob,
                    rel.target_ref.split('.')[-1].lower()
                )
            except Exception:
                pass

    # ── Build body element map (paragraphs AND tables in order) ──────────────
    # We need to process tables in their correct position relative to paragraphs
    body = doc.element.body
    body_elements = []  # list of ('p', para_obj) or ('table', table_obj)
    para_idx  = 0
    table_idx = 0

    for child in body:
        local = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if local == 'p':
            if para_idx < len(paras):
                body_elements.append(('p', paras[para_idx]))
                para_idx += 1
        elif local == 'tbl':
            if table_idx < len(doc.tables):
                body_elements.append(('table', doc.tables[table_idx]))
                table_idx += 1

    # ── Header parsing ────────────────────────────────────────────────────────
    header = {'subject': '', 'exam': '', 'year': '', 'sitting': 'MAY_JUNE'}
    q_start_re = re.compile(r'^(\d+)[.\)]\s*')
    first_q_elem_idx = 0

    for i, (etype, elem) in enumerate(body_elements):
        if etype == 'p':
            text = _clean(elem.text)
            if q_start_re.match(text):
                first_q_elem_idx = i
                break
            tl = text.lower()
            if tl.startswith('subject:'):
                header['subject'] = text.split(':', 1)[1].strip()
            elif tl.startswith('exam:'):
                header['exam'] = text.split(':', 1)[1].strip()
            elif tl.startswith('year:'):
                parts = text.split('\n')
                header['year'] = parts[0].split(':', 1)[1].strip()
            elif tl.startswith('paper type:') or tl.startswith('sitting:'):
                header['sitting'] = _resolve_sitting(text.split(':', 1)[1].strip())

    # ── Group elements into per-question blocks ───────────────────────────────
    blocks  = []  # list of lists of (etype, elem)
    current = []

    for i in range(first_q_elem_idx, len(body_elements)):
        etype, elem = body_elements[i]
        if etype == 'p':
            text = _clean(elem.text)
            if q_start_re.match(text):
                if current:
                    blocks.append(current)
                current = [(etype, elem)]
            elif current:
                current.append((etype, elem))
        elif etype == 'table':
            if current:
                current.append((etype, elem))

    if current:
        blocks.append(current)

    # ── Per-question parsing ──────────────────────────────────────────────────
    choice_re = re.compile(r'^([A-E])[.\)]\s+(.+)$', re.DOTALL)
    answer_re = re.compile(r'^answer\s*:\s*([A-E])', re.IGNORECASE)
    topic_re  = re.compile(r'^topic\s*:\s*(.+)$',   re.IGNORECASE)
    questions = []

    for block in blocks:
        q = {
            'number':      None,
            'content':     '',
            'image_bytes': None,
            'image_ext':   None,
            'choices':     [],
            'answer':      '',
            'topics':      [],
        }
        content_parts = []
        in_choices    = False

        for etype, elem in block:

            # ── Table element ─────────────────────────────────────────────────
            if etype == 'table':
                content_parts.append(_table_to_html(elem))
                continue

            # ── Paragraph element ─────────────────────────────────────────────
            para = elem
            raw_text = para.text
            text     = _clean(raw_text)

            # ── Image ─────────────────────────────────────────────────────────
            img_b, img_e = _para_image(para, img_map)
            if img_b and not text:
                q['image_bytes'] = img_b
                q['image_ext']   = img_e
                continue

            # ── Question number line ──────────────────────────────────────────
            m = q_start_re.match(text)
            if m and q['number'] is None:
                q['number']   = int(m.group(1))
                remainder_txt = text[m.end():].strip()
                remainder_html = _para_to_html(para)
                # Replace the full para HTML with just the remainder
                if remainder_txt:
                    content_parts.append(remainder_html)
                if img_b:
                    q['image_bytes'] = img_b
                    q['image_ext']   = img_e
                continue

            # ── Answer line ───────────────────────────────────────────────────
            ma = answer_re.match(text)
            if ma:
                q['answer'] = ma.group(1).upper()
                in_choices  = False
                continue

            # ── Topic line ────────────────────────────────────────────────────
            mt = topic_re.match(text)
            if mt:
                q['topics'].append(mt.group(1).strip())
                continue

            # ── Choices ───────────────────────────────────────────────────────
            raw_lines  = [_clean(ln) for ln in raw_text.split('\n')]
            first_line = raw_lines[0] if raw_lines else ''

            if choice_re.match(first_line):
                in_choices = True
                seen = set()
                for line in raw_lines:
                    line = _clean(line)
                    if not line:
                        continue
                    mc = choice_re.match(line)
                    if mc and mc.group(1).upper() not in seen:
                        seen.add(mc.group(1).upper())
                        q['choices'].append({
                            'label':      mc.group(1).upper(),
                            'text':       _clean(mc.group(2)),
                            'is_correct': False,
                        })
                continue

            # ── Regular content (empty lines, indented blanks, math, etc.) ────
            if not in_choices:
                html = _para_to_html(para)
                content_parts.append(html)

        # ── Assemble content ──────────────────────────────────────────────────
        q['content'] = '\n'.join(content_parts).strip()

        # ── Mark correct answer ───────────────────────────────────────────────
        if q['answer']:
            for c in q['choices']:
                if c['label'] == q['answer']:
                    c['is_correct'] = True

        if q['number'] and q['content']:
            questions.append(q)

    return header, questions

@admin_required
def referral_analytics(request):
    """Admin view showing referral statistics and top referrers.""" 
    total_referrals = Referral.objects.count()
    total_referring_users = Referral.objects.values('referrer').distinct().count()
 
    # Last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_referrals = Referral.objects.filter(created_at__gte=thirty_days_ago).count()
 
    # Top referrers
    top_referrers = (
        Referral.objects
        .values('referrer__id', 'referrer__first_name', 'referrer__last_name', 'referrer__email')
        .annotate(total=Count('id'))
        .order_by('-total')[:20]
    )
 
    # Recent referral events
    recent_events = (
        Referral.objects
        .select_related('referrer', 'referred')
        .order_by('-created_at')[:15]
    )
 
    context = {
        'total_referrals':       total_referrals,
        'total_referring_users': total_referring_users,
        'recent_referrals':      recent_referrals,
        'top_referrers':         top_referrers,
        'recent_events':         recent_events,
    }
    return render(request, 'teacher/referral_analytics.html', context)

    # Add to teacher/views.py

@admin_required
def upload_past_paper(request):
    """Upload a past paper PDF (questions and/or answers) for a specific exam series."""
    from catalog.models import Subject, ExamBoard, ExamSeries, PastPaper
    from django.core.files.base import ContentFile

    subjects    = Subject.objects.all().order_by('name')
    exam_boards = ExamBoard.objects.all().order_by('name')

    if request.method != 'POST':
        return render(request, 'teacher/upload_past_paper.html', {
            'subjects': subjects, 'exam_boards': exam_boards,
        })

    # ── Get form fields ───────────────────────────────────────────────────────
    subject_id    = request.POST.get('subject')
    board_id      = request.POST.get('exam_board')
    year_str      = request.POST.get('year', '').strip()
    sitting       = request.POST.get('sitting', 'MAY_JUNE')
    paper_type    = request.POST.get('paper_type', '').upper()
    video_url     = request.POST.get('video_url', '').strip() or None
    question_file = request.FILES.get('question_pdf')
    answer_file   = request.FILES.get('answer_pdf')

    # ── Validation ────────────────────────────────────────────────────────────
    errors = []
    if not subject_id:    errors.append('Please select a subject.')
    if not board_id:      errors.append('Please select an exam board.')
    if not year_str:      errors.append('Please enter a year.')
    if not paper_type:    errors.append('Please select a paper type.')
    if paper_type not in ('OBJ', 'THEORY', 'PRACTICAL'):
        errors.append('Invalid paper type.')
    if not question_file and not answer_file and not video_url:
        errors.append('Please provide at least one file or a video URL.')

    try:
        year = int(year_str)
    except (ValueError, TypeError):
        errors.append(f'Invalid year: "{year_str}".')
        year = None

    if errors:
        return render(request, 'teacher/upload_past_paper.html', {
            'subjects': subjects, 'exam_boards': exam_boards, 'errors': errors,
            'post': request.POST,
        })

    # ── Get or create ExamSeries ──────────────────────────────────────────────
    try:
        subject    = Subject.objects.get(id=subject_id)
        exam_board = ExamBoard.objects.get(id=board_id)
    except (Subject.DoesNotExist, ExamBoard.DoesNotExist):
        return render(request, 'teacher/upload_past_paper.html', {
            'subjects': subjects, 'exam_boards': exam_boards,
            'errors': ['Invalid subject or exam board.'], 'post': request.POST,
        })

    exam_series, _ = ExamSeries.objects.get_or_create(
        exam_board=exam_board, subject=subject,
        year=year, sitting=sitting,
    )

    # ── Get or create PastPaper — partial update ──────────────────────────────
    paper, created = PastPaper.objects.get_or_create(
        exam_series=exam_series,
        paper_type=paper_type,
    )

    updated_fields = []

    if question_file:
        paper.question_pdf = question_file
        updated_fields.append('question PDF')

    if answer_file:
        paper.answer_pdf = answer_file
        updated_fields.append('answer PDF')

    if video_url:
        paper.video_url = video_url
        updated_fields.append('video URL')

    paper.uploaded_by = request.user
    paper.save()

    action  = 'Created' if created else 'Updated'
    summary = f"{action}: {exam_board.abbreviation} {subject.name} {sitting} {year} — {paper_type}"
    if updated_fields:
        summary += f" ({', '.join(updated_fields)} added)"

    return render(request, 'teacher/upload_past_paper.html', {
        'subjects': subjects, 'exam_boards': exam_boards,
        'success': True, 'summary': summary,
        'paper': paper, 'created': created,
    })