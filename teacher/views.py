from django.db.models import F, FloatField, ExpressionWrapper, Avg, Count
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from functools import wraps
from django.utils.html import escape

from catalog.models import Subject, ExamBoard, Question, ExamSeries, Choice, TheoryAnswer, Topic, LessonNote, Worksheet, Theme
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
    is_admin        = getattr(request.user, 'is_admin', False)
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
def session_history(request):
    from catalog.models import Subject

    subject_id = request.GET.get('subject')
    subjects   = Subject.objects.order_by('name')

    sessions_qs = (
        PracticeSession.objects
        .filter(completed_at__isnull=False)
        .select_related('user', 'subject', 'exam_series')
        .only(
            'id', 'score', 'total_marks', 'completed_at',
            'user__first_name', 'user__last_name',
            'subject__name',
            'exam_series__year', 'exam_series__sitting',
        )
        .order_by('-completed_at')
    )
    if subject_id:
        sessions_qs = sessions_qs.filter(subject_id=subject_id)

    from django.core.paginator import Paginator
    paginator = Paginator(sessions_qs, 20)
    page      = paginator.get_page(request.GET.get('page', 1))

    context = {
        'page_obj':         page,
        'subjects':         subjects,
        'selected_subject': subject_id,
        'total_sessions':   paginator.count,
    }
    return render(request, 'teacher/session_history.html', context)


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
    from catalog.cache_utils import get_student_stats, get_subjects_with_question_counts
    subject_id    = request.GET.get('subject')
    student_stats = get_student_stats(subject_id)

    context = {
        'student_stats':    student_stats,
        'subjects':         get_subjects_with_question_counts(),
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


import logging
import difflib
from django.db import transaction
from catalog.models import LessonNote, Worksheet, Subject, Topic, Theme

logger = logging.getLogger(__name__)


def _build_topic_map(subject):
    """
    Fetch all topics for a subject into a dict keyed by lowercase name.
    Prefetches lesson_note and worksheet to avoid reverse OneToOne queries later.
    Returns: {lowercase_name: topic_instance}
    """
    qs = Topic.objects.filter(subject=subject).select_related('lesson_note', 'worksheet')
    return {t.name.lower(): t for t in qs}


def _resolve_topic(item, subject, topic_map):
    """
    Resolve a topic from the prefetched topic_map.
    Falls back to fuzzy match in memory.
    Never creates topics or themes — raises ValueError if not found.
    """
    name_raw   = item['topic'].strip()
    name_lower = name_raw.lower()

    # Exact match — O(1) dict lookup, case-insensitive
    topic = topic_map.get(name_lower)
    if topic:
        return topic

    # Fuzzy match — in memory, no extra DB query
    matches = difflib.get_close_matches(name_lower, list(topic_map.keys()), n=1, cutoff=0.7)
    if matches:
        return topic_map[matches[0]]

    raise ValueError(
        f'Topic "{name_raw}" not found for subject "{subject.name}". '
        f'Check spelling or add it to the curriculum first.'
    )


def _process_pdf_items(parsed, file_type, model_cls, subject_map,
                        topic_map_cache, video_url, overwrite, user):
    """
    Process parsed PDF items for either LessonNote or Worksheet.

    file_type      : 'Notes' or 'Worksheet' — used in error prefixes
    model_cls      : LessonNote or Worksheet
    subject_map    : {lowercase_name: subject} — prefetched before calling
    topic_map_cache: {subject_id: topic_map} — shared cache across both PDF types
    """
    results      = []
    errors       = []
    is_note      = model_cls is LessonNote
    prefix       = 'note' if is_note else 'ws'
    title_suffix = 'Revision Notes' if is_note else 'Worksheet'
    related_name = 'lesson_note' if is_note else 'worksheet'

    for item in parsed:
        try:
            subject_key = item['subject'].strip().lower()
            subject     = subject_map.get(subject_key)
            if not subject:
                errors.append(f'[{file_type}] Subject "{item["subject"]}" not found — skipped.')
                continue

            if subject.id not in topic_map_cache:
                topic_map_cache[subject.id] = _build_topic_map(subject)
            topic_map = topic_map_cache[subject.id]

            topic    = _resolve_topic(item, subject, topic_map)
            existing = getattr(topic, related_name, None)

            if existing and not overwrite:
                results.append({
                    'topic': topic.name, 'subject': subject.name,
                    'status': 'skipped', 'reason': 'already exists',
                })
                continue

            safe_subject = subject.name.lower().replace(' ', '_')
            safe_topic   = topic.name.lower().replace(' ', '_')
            filename     = f"{prefix}_{safe_subject}_{safe_topic}.pdf"

            obj, created = model_cls.objects.update_or_create(
                topic=topic,
                defaults={
                    'title':           f"{topic.name} — {title_suffix}",
                    'video_url':       video_url,
                    'is_ai_generated': False,
                    'uploaded_by':     user,
                }
            )
            obj.pdf_file.save(filename, ContentFile(item['pdf_bytes']), save=True)

            results.append({
                'topic':   topic.name,
                'subject': subject.name,
                'status':  'created' if created else 'updated',
                'video':   video_url or '—',
            })

        except Exception as e:
            logger.exception(f'[{file_type}] Failed "{item.get("topic", "?")}"')
            errors.append(f'[{file_type}] Failed "{item.get("topic", "?")}": {e}')

    return results, errors


@admin_required
def upload_notes(request):
    from catalog.note_pdf_parser import parse_note_pdf

    if request.method != 'POST':
        return render(request, 'teacher/upload_notes.html', {
            'subjects': Subject.objects.only('id', 'name').order_by('name'),
        })

    note_file           = request.FILES.get('note_pdf')
    worksheet_file      = request.FILES.get('worksheet_pdf')
    overwrite           = request.POST.get('overwrite') == 'on'
    note_video_url      = request.POST.get('note_video_url', '').strip() or None
    worksheet_video_url = request.POST.get('worksheet_video_url', '').strip() or None

    if not note_file and not worksheet_file:
        return render(request, 'teacher/upload_notes.html', {
            'error':    'Please upload at least one PDF file.',
            'subjects': Subject.objects.only('id', 'name').order_by('name'),
        })

    # Prefetch all subjects once — shared across both processing loops
    subject_map     = {s.name.lower(): s for s in Subject.objects.only('id', 'name')}
    topic_map_cache = {}
    note_results    = []
    ws_results      = []
    all_errors      = []

    if note_file:
        parsed, errors = parse_note_pdf(note_file.read())
        all_errors.extend(errors)
        results, errors = _process_pdf_items(
            parsed, 'Notes', LessonNote, subject_map,
            topic_map_cache, note_video_url, overwrite, request.user
        )
        note_results = results
        all_errors.extend(errors)

    if worksheet_file:
        parsed, errors = parse_note_pdf(worksheet_file.read())
        all_errors.extend(errors)
        results, errors = _process_pdf_items(
            parsed, 'Worksheet', Worksheet, subject_map,
            topic_map_cache, worksheet_video_url, overwrite, request.user
        )
        ws_results = results
        all_errors.extend(errors)

    return render(request, 'teacher/upload_notes.html', {
        'success':           True,
        'note_results':      note_results,
        'worksheet_results': ws_results,
        'errors':            all_errors,
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

@login_required
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
    themes_grouped   = {}
    subject_covered  = True
    ai_enabled       = is_feature_enabled('ai_lesson_notes', user=request.user)

    if selected_subject_id:
        try:
            selected_subject = Subject.objects.get(id=selected_subject_id)
            subject_covered  = selected_subject.id in covered_ids

            if subject_covered:
                topics = (
                    Topic.objects
                    .filter(subject=selected_subject)
                    .select_related('theme')
                    .prefetch_related('lesson_note', 'worksheet')
                    .order_by('theme__order', 'theme__name', 'name')
                )

                from collections import defaultdict
                themes_dict = defaultdict(list)
                for t in topics:
                    theme_name = t.theme.name if t.theme else 'General'
                    themes_dict[theme_name].append(t)
                themes_grouped = dict(themes_dict)
        except Subject.DoesNotExist:
            pass

    if selected_topic_id and subject_covered:
        try:
            selected_topic = (
                Topic.objects
                .prefetch_related('lesson_note', 'worksheet')
                .get(id=selected_topic_id, subject=selected_subject)
            )
            note      = getattr(selected_topic, 'lesson_note', None)
            worksheet = getattr(selected_topic, 'worksheet', None)
        except Topic.DoesNotExist:
            pass

    lesson_access        = None
    lesson_access_denied = False

    if selected_topic:
        from catalog.subscription_access import check_lesson_note_access
        from catalog.models import FreeTeacherTopicAccess

        lesson_access = check_lesson_note_access(request.user, selected_topic)

        if not lesson_access['allowed']:
            lesson_access_denied = True
        else:
            FreeTeacherTopicAccess.record_access(request.user, selected_topic)

    context = {
        'all_subjects':         all_subjects,
        'covered_ids':          covered_ids,
        'selected_subject':     selected_subject,
        'subject_covered':      subject_covered,
        'topics':               topics,
        'themes_grouped':       themes_grouped,
        'selected_topic':       selected_topic,
        'note':                 note,
        'ai_enabled':           ai_enabled,
        'lesson_access':        lesson_access,
        'lesson_access_denied': lesson_access_denied,
        'worksheet':            worksheet,
    }
    return render(request, 'teacher/lesson_notes.html', context)


def _handle_ai_generate(request, data):
    import anthropic
    topic_id = data.get('topic_id')
    try:
        topic = Topic.objects.select_related('subject', 'lesson_note').get(id=topic_id)
    except Topic.DoesNotExist:
        return JsonResponse({'error': 'Topic not found'}, status=404)

    existing_note = getattr(topic, 'lesson_note', None)
    if existing_note:
        if existing_note.pdf_file:
            return JsonResponse(
                {'error': 'An uploaded PDF note already exists for this topic. '
                          'AI generation is disabled when a PDF is present.'},
                status=409,
            )
        if existing_note.ai_content:
            return JsonResponse({
                'content':    existing_note.ai_content,
                'topic_name': topic.name,
                'cached':     True,
            })

    prompt = f"""You are an experienced {topic.subject.name} teacher preparing a focused revision note for Nigerian students writing WAEC, NECO, or JAMB.

Subject: {topic.subject.name}
Topic: {topic.name}

Write a REVISION NOTE — not a textbook chapter. Every line must be something a student could be examined on. Cut anything that cannot appear in an exam question.

STRUCTURE:
1. **Key Definitions** — every term a student must know for this topic. Write as a plain bullet list: **Term** — definition. Never use a table for definitions.

2. **Core Facts & Concepts** — for each major concept, write a short explanatory paragraph (2–4 sentences) that teaches the idea clearly, then follow it with bullet points covering the specific exam facts under that concept. Do NOT write bare bullet points without explanation. The paragraph must come first, then the bullets beneath it. Repeat this pattern for each distinct concept in the topic.

3. **Tables & Comparisons** — use a markdown table ONLY when the content is a genuine side-by-side comparison of two or more items across the same attributes (e.g., mitosis vs meiosis, series vs parallel circuits, demand vs supply). Do NOT use tables for definitions, lists of facts, enumerations, or any content that flows naturally as bullet points. Definitions belong in section 1 as a plain list. Exams frequently use table-completion questions, so when a table is appropriate, make it complete and accurate. If no genuine comparison exists for this topic, omit this section entirely including its heading.

4. **Worked Examples** — include ONLY if the subject requires calculation or step-by-step application (Mathematics, Physics, Chemistry, Economics). Skip entirely for purely factual topics. Do NOT include this section header if you are skipping it.
   Format every solution using numbered steps:
   **Step 1: [action heading]** — show full workings
   **Step 2: [action heading]** — show full workings
   Final answer on its own line in bold.
   Include 2–4 examples of increasing difficulty where relevant.

5. **Diagrams** — follow ALL rules below without exception:

   RULE 1 — GRAPHS (for topics commonly examined with a plotted graph):
   Graphs apply across ALL subjects — not Physics only. Common cases include:
   - Physics: force-extension, velocity-time, distance-time, I-V characteristics
   - Mathematics: quadratic curves, straight line graphs, cumulative frequency, histograms
   - Chemistry: reaction rate curves, Maxwell-Boltzmann distribution, titration curves
   - Economics: supply/demand curves, PPC curves, cost curves
   - Biology: population growth, enzyme activity curves
   - Geography: population pyramids, climate graphs

   When the topic is commonly examined with a graph, draw it as an SVG following these rules:
   - Draw a clean x-axis and y-axis with arrowheads at the positive ends
   - Label BOTH axes with the quantity and unit: e.g. <text>Force (N)</text>, <text>Extension (m)</text>
   - Plot the correct curve or line shape for this topic — do NOT leave axes empty
   - Mark and label ALL key points on the graph (e.g. P = Proportionality Limit, E = Elastic Limit, Y = Yield Point, B = Breaking Point) using small filled circles with leader lines and text labels
   - Shade or annotate key regions where examined (e.g. "Hooke's Law region", "plastic deformation")
   - Origin must be labelled O
   - Use gridlines sparingly if they aid reading
   - Graph title in bold at top of SVG

   RULE 2 — MERMAID FLOWCHARTS:
   Mermaid is STRICTLY FORBIDDEN except for Computer Science topics.
   Permitted Computer Science uses ONLY: algorithms, sorting, program flow, data structures, network topologies, decision trees.
   For ALL other subjects — Biology, Chemistry, Physics, Economics, Geography, etc. — do NOT produce a mermaid block under any circumstance. Use a table or SVG instead.
   When permitted, use a fenced code block tagged ```mermaid.

   RULE 3 — SVG STRUCTURAL DIAGRAMS:
   Use SVG ONLY when the topic is commonly examined with a physical labelled diagram AND you can draw it accurately.
   Suitable SVG topics: labelled anatomical or cellular structures, electrical circuits, ecosystem diagrams, map cross-sections, physical apparatus.
   DO NOT use SVG for: classifications, lists of types, comparisons between concepts, hierarchies, historical timelines, economic models, or any content better shown as a table.
   If you are not certain you can draw and label the structure accurately, DO NOT attempt SVG — use a table instead.

   RULE 4 — SVG TECHNICAL REQUIREMENTS (mandatory for ALL SVG including graphs):
   - Write raw <svg>...</svg> markup inline — do NOT wrap in backticks or a code block
   - viewBox="0 0 700 450"; background rect fill="#f9f9f9"; border rect stroke="#cccccc"
   - The SVG will be rendered at A4 width by the template — do NOT set a fixed width or height attribute on the <svg> tag. Use viewBox only. Example: <svg viewBox="0 0 700 450" xmlns="..."> with no width/height attributes
   - For structural diagrams, draw the main structure first, then add labels OUTSIDE the structure using this exact pattern for each label:
     * Place a filled circle marker at the point being labelled: <circle cx="X" cy="Y" r="3" fill="#333"/>
     * Draw a straight line from that point to the label position: <line x1="X" y1="Y" x2="LX" y2="LY" stroke="#555" stroke-width="1"/>
     * Place the label text at the line endpoint: <text x="LX" y="LY" font-size="13" fill="#222">Label Text</text>
     * Labels on the LEFT side: text-anchor="end", line goes left; Labels on the RIGHT side: text-anchor="start", line goes right
     * Minimum 30px gap between the structure boundary and the label text
     * No two label texts may share the same Y coordinate within 18px of each other
   - Left-side labels MUST have x no less than 80 — never place label text closer than 80px to the left edge of the viewBox
   - Right-side labels MUST have x no greater than 620 — never place label text closer than 80px to the right edge of the viewBox
   - The main structure must be centred within x=80 to x=620, leaving at least 80px on each side exclusively for label text
   - Label only the 5–7 most examined parts
   - Bold diagram title at top: <text x="350" y="24" text-anchor="middle" font-size="15" font-weight="bold" fill="#111">Title</text>
   - Use distinct fill colours for different parts to aid identification
   - Total SVG under 150 lines. Do not sacrifice label accuracy, structure detail, or correct positioning to meet the line limit. Every label must have its own circle marker, connector line, and text element — these must never be skipped to save lines.
   - CRITICAL: If you include a Diagrams section, it MUST contain actual rendered content (graph SVG, structural SVG, or mermaid block). An empty Diagrams section or a section with only a heading and description text is FORBIDDEN. If you cannot produce a valid diagram, omit the entire section including the heading.

   RULE 5 — ASCII:
   Use ASCII only for simple linear or relational content inline within text, never as a standalone section.

   RULE 6 — LIMITS:
   Maximum 4 diagrams per note. Omit the entire Diagrams section — including its heading — if diagrams are not commonly examined for this topic or if you cannot produce valid content.

6. **Likely Exam Questions** — 4–7 specific questions likely to appear in WAEC/NECO/JAMB on this topic, with concise model answers. Format strictly as Q: / A: pairs.

7. **Exam Tips & Common Mistakes** — merge examiner strategy and student errors into one focused section. Format each point as:
   > ⚠️ **Mistake:** [what students get wrong and why it costs marks]
   > 💡 **Tip:** [strategic advice, memory aid, or examiner trap to watch for]
   Include 3–5 points total, mixing mistakes and tips as appropriate for the topic.

MATHEMATICAL NOTATION — CRITICAL:
Every mathematical expression, variable, equation, or formula MUST be wrapped in LaTeX delimiters.
Use \\( ... \\) for inline math and \\[ ... \\] for display (standalone) equations.

RULES:
- Write for a student with limited time to revise this topic before an exam
- Every fact must be accurate and pitched at the correct level for WAEC/NECO/JAMB
- Use Nigerian examples where relevant
- No introductions, no conclusions, no motivational sentences
- No repetition — state each fact once
- TABLES: use sparingly — only for genuine side-by-side comparisons. Definitions, features, and enumerated facts must use bullet points or numbered lists, never a table
- CURRENCY: write Naira as ₦500 or NGN 500 — never bare $ signs
- OMIT any section heading entirely if that section has no content — never leave an empty section
- Format using markdown"""

    try:
        client  = anthropic.Anthropic()
        message = client.messages.create(
            model='claude-opus-4-6', max_tokens=7500,
            messages=[{"role": "user", "content": prompt}]
        )
        return JsonResponse({
            'content':    message.content[0].text,
            'topic_name': topic.name,
            'cached':     False,
        })
    except Exception as e:
        return JsonResponse({'error': f'AI generation failed: {e}'}, status=500)
    
def _handle_ai_accept(request, data):
    topic_id   = data.get('topic_id')
    ai_content = data.get('content', '').strip()
    if not ai_content:
        return JsonResponse({'error': 'No content provided'}, status=400)
    try:
        topic = Topic.objects.select_related('subject', 'lesson_note').get(id=topic_id)
    except Topic.DoesNotExist:
        return JsonResponse({'error': 'Topic not found'}, status=404)

    existing_note = getattr(topic, 'lesson_note', None)

    if existing_note and existing_note.pdf_file:
        return JsonResponse(
            {'error': 'An uploaded PDF already exists for this topic. '
                      'AI content cannot overwrite it.'},
            status=409,
        )

    if existing_note and existing_note.ai_content:
        return JsonResponse({
            'success':         True,
            'note_id':         existing_note.id,
            'message':         'Note already saved.',
            'already_existed': True,
        })

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

import subprocess
import tempfile
import os

from bs4 import BeautifulSoup, NavigableString


_SITTING_MAP = {
    'may':  'MAY_JUNE', 'june': 'MAY_JUNE',
    'nov':  'NOV_DEC',  'dec':  'NOV_DEC',
    'mock': 'MOCK',
}

# ── ASCII diagram detection ────────────────────────────────────────────────────
# Matches Unicode box-drawing and arrow characters that signal positional layout.
_ASCII_DRAW_RE = re.compile(
    r'[\u2500\u2501\u2502\u2503\u250c\u2510\u2514\u2518\u251c\u2524\u252c\u2534\u253c'
    r'\u2190\u2191\u2192\u2193\u2194\u27f5\u27f6'
    r'\u2504\u2505\u2508\u2509\u2506\u2507\u250a\u250b'
    r'\u250d\u250e\u250f\u2511\u2512\u2513\u2515\u2516\u2517\u2519\u251a\u251b]'
)


def _is_ascii_para(text: str) -> bool:
    """
    Return True if this paragraph text needs monospace/preformatted rendering.

    Detects:
      1. Box-drawing or arrow Unicode characters (\u2500 range, \u2190-\u2193)
      2. Caret/arrow annotations: "^ \u2190", "\u2191 label"
      3. Separator lines: 3+ chars composed only of - = _ space
      4. Pipe-separated column rows: "val | val | val"
      5. Positional slash/backslash lines used in geometry diagrams
    """
    stripped = text.strip()
    if not stripped:
        return False
    if _ASCII_DRAW_RE.search(text):
        return True
    if re.search(r'[\^\u2191\u2193]\s*[\u2190\u2192]', text) or re.search(r'[\u2190\u2192]\s*\^', text):
        return True
    if len(stripped) >= 3 and not re.sub(r'[-=_\s]', '', stripped):
        return True
    if re.search(r'\S\s*\|\s*\S', text):
        return True
    non_slash = re.sub(r'[/\\|\s]', '', stripped)
    if len(stripped) >= 2 and len(non_slash) / max(len(stripped), 1) < 0.35:
        return True
    return False


def _para_is_prose(text: str) -> bool:
    """Return True when a paragraph is clearly prose and should not be absorbed into an ASCII block."""
    stripped = text.strip()
    words    = stripped.split()
    if len(words) >= 6 and not _is_ascii_para(stripped):
        return True
    if len(words) >= 4 and stripped.endswith(('.', ':', '?', '!')):
        return True
    return False


def _group_and_wrap_ascii(html_parts: list) -> list:
    """
    Post-process explanation HTML parts and merge consecutive ASCII paragraphs
    into <pre class="ascii-diagram"> blocks, preserving math spans inside.

    Rules:
      - <table> always ends the current ASCII group.
      - Clearly prose paragraphs end the ASCII group.
      - Short ambiguous lines between ASCII lines are absorbed into the <pre>.
      - Math <span class="math inline"> elements are preserved as HTML inside <pre>.
    """
    from bs4 import BeautifulSoup as _BS

    result     = []
    pre_buffer = []
    in_ascii   = False

    def _flush():
        nonlocal in_ascii
        if pre_buffer:
            result.append(
                '<pre class="ascii-diagram">'
                + '\n'.join(pre_buffer)
                + '</pre>'
            )
            pre_buffer.clear()
        in_ascii = False

    for html_str in html_parts:
        frag = _BS(html_str, 'html.parser')
        elem = next((c for c in frag.children if hasattr(c, 'name')), None)

        if elem is None:
            _flush()
            result.append(html_str)
            continue

        if elem.name == 'table':
            _flush()
            result.append(html_str)
            continue

        if elem.name != 'p':
            _flush()
            result.append(html_str)
            continue

        text     = elem.get_text(separator='', strip=False)
        inner    = elem.decode_contents()
        is_asc   = _is_ascii_para(text)
        is_prose = _para_is_prose(text)

        if is_asc:
            in_ascii = True
            pre_buffer.append(inner)
        elif in_ascii and not is_prose:
            pre_buffer.append(inner)
        else:
            _flush()
            result.append(html_str)

    _flush()
    return result



def _resolve_sitting(s):
    s = s.lower()
    for key, val in _SITTING_MAP.items():
        if key and key in s:
            return val
    return 'MAY_JUNE'


def _split_para_into_lines(elem):
    """
    Split a <p> element into lines at <br/> boundaries.
    Returns list of (plain_text, html_string) tuples.
    """
    lines        = []
    current_html = ''
    current_text = ''

    for child in elem.children:
        if child.name == 'br':
            if current_text.strip():
                lines.append((current_text.strip(), current_html.strip()))
            current_html = ''
            current_text = ''
        elif isinstance(child, NavigableString):
            current_html += str(child)
            current_text += str(child)
        else:
            current_html += str(child)
            current_text += child.get_text()

    if current_text.strip():
        lines.append((current_text.strip(), current_html.strip()))

    return lines


def _is_choice_block(elem):
    """Return True if the paragraph begins with a choice label (A. / A))."""
    _choice_label_re = re.compile(r'^([A-E])[.\)]\s*')
    lines = _split_para_into_lines(elem)
    if not lines:
        return False
    return bool(_choice_label_re.match(lines[0][0]))


def _parse_choices(elem):
    """
    Extract choices from a <p> element.
    Returns list of dicts: {label, text (HTML), is_correct}.
    Math in choices is preserved as MathJax HTML.
    """
    _choice_label_re = re.compile(r'^([A-E])[.\)]\s*')
    lines   = _split_para_into_lines(elem)
    choices = []
    seen    = set()

    for plain, html in lines:
        m = _choice_label_re.match(plain)
        if m and m.group(1).upper() not in seen:
            label = m.group(1).upper()
            seen.add(label)
            choice_html = re.sub(r'^[A-E][.\)]\s*', '', html.strip())
            choices.append({
                'label':      label,
                'text':       choice_html,
                'is_correct': False,
            })

    return choices


def _parse_obj_blocks_numbered(raw_blocks, img_map, q_inline_re, topic_re, answer_re, explanation_re):
    """
    Parse objective (MCQ) question blocks from a pre-built raw_blocks dict.

    raw_blocks : {question_number: [BeautifulSoup elements]}

    Explanation handling
    ────────────────────
    Each question block may contain a multi-paragraph explanation section
    between "Explanation: ..." and "Topic: ...":

        Answer: C
        Explanation: First line of explanation.    ← explanation_re matches here
        More prose continuation...                 ← in_explanation accumulates
        | table row | ...  |                       ← tables also accumulated
        Topic: Some Topic                          ← resets in_explanation, saves

    The full explanation text is stored in q['explanation'] and attached to the
    correct Choice dict as c['explanation'].  It is NEVER appended to
    content_parts / question.content.
    """
    questions       = []
    choice_label_re = re.compile(r'^([A-E])[.\)]\s*')

    for number, block in sorted(raw_blocks.items()):
        q = {
            'number':              number,
            'content':             '',
            'content_after_image': '',
            'image_bytes':         None,
            'image_ext':           None,
            'choices':             [],
            'answer':              '',
            'explanation':         '',   # populated from explanation block; never from content
            'topics':              [],
        }
        content_parts     = []
        after_image_parts = []
        image_seen        = False
        in_choices        = False
        in_explanation    = False   # True while consuming explanation body paragraphs
        expl_parts        = []      # accumulates multi-paragraph explanation text
        seen_labels       = set()

        for elem in block:
            tag  = elem.name
            text = elem.get_text(separator='\n', strip=True)

            # ── First element: question stem ──────────────────────────────────
            if elem is block[0]:
                m = q_inline_re.match(text)
                if m:
                    # Strip leading "N. " from HTML and keep the rest
                    elem_html = re.sub(r'(<p[^>]*>)\s*\d+[.\)]\s*', r'\1', str(elem))
                    content_parts.append(elem_html)
                    continue
                if tag == 'p' and elem.find('br'):
                    pass   # fall through to <br/> handler below
                elif tag == 'p' and text:
                    content_parts.append(str(elem))
                    continue
                else:
                    continue

            # ── Image ─────────────────────────────────────────────────────────
            if tag in ('figure', 'img') or (tag == 'p' and elem.find('img')):
                image_seen = True
                img_tag    = elem.find('img') if tag != 'img' else elem
                if img_tag:
                    src   = img_tag.get('src', '')
                    fname = os.path.basename(src)
                    if fname in img_map:
                        q['image_bytes'] = img_map[fname]
                        q['image_ext']   = fname.split('.')[-1].lower()
                continue

            # ── Alpha <ol type="A"> choices ───────────────────────────────────
            if tag == 'ol' and elem.get('type') == 'A':
                in_choices     = True
                in_explanation = False
                for label_idx, li in enumerate(elem.find_all('li', recursive=False)):
                    label = chr(65 + label_idx)
                    if label not in seen_labels:
                        seen_labels.add(label)
                        q['choices'].append({
                            'label':      label,
                            'text':       li.get_text(separator='\n', strip=True),
                            'is_correct': False,
                        })
                continue

            # ── <p> with <br/> — split and route each line ────────────────────
            # Explanation continuation within a <br/>-split paragraph is handled
            # line-by-line using the same in_explanation state.
            if tag == 'p' and elem.find('br'):
                lines          = _split_para_into_lines(elem)
                question_lines = []
                for plain, html_str in lines:
                    me = explanation_re.match(plain)
                    if me:
                        in_explanation = True
                        in_choices     = False
                        first_line     = me.group(1).strip()
                        if first_line:
                            expl_parts.append(re.sub(r"^\s*[Ee]xplanation\s*:\s*", "", html_str.strip()))
                        continue
                    if in_explanation:
                        mt = topic_re.match(plain)
                        if mt:
                            in_explanation   = False
                            q['explanation'] = ''.join(_group_and_wrap_ascii(expl_parts)).strip()
                            expl_parts       = []
                            q['topics'].append(' '.join(mt.group(1).split()))
                        elif plain:
                            expl_parts.append(html_str)
                        continue
                    ma = answer_re.match(plain)
                    if ma:
                        q['answer'] = ma.group(1).upper()
                        in_choices  = False
                        continue
                    mt = topic_re.match(plain)
                    if mt:
                        q['topics'].append(' '.join(mt.group(1).split()))
                        in_choices = False
                        continue
                    mc = choice_label_re.match(plain)
                    if mc:
                        label = mc.group(1).upper()
                        if label not in seen_labels:
                            seen_labels.add(label)
                            choice_html = re.sub(r'^[A-E][.\)]\s*', '', html_str.strip())
                            q['choices'].append({
                                'label':      label,
                                'text':       choice_html,
                                'is_correct': False,
                            })
                        in_choices = True
                        continue
                    if not in_choices:
                        question_lines.append(html_str)
                if question_lines:
                    chunk = '<p>' + '<br/>'.join(question_lines) + '</p>'
                    if image_seen:
                        after_image_parts.append(chunk)
                    else:
                        content_parts.append(chunk)
                continue

            # ── Explanation — standalone <p>, no <br/> ────────────────────────
            me = explanation_re.match(text)
            if me:
                in_explanation = True       # enter explanation-accumulation mode
                in_choices     = False
                first_line     = me.group(1).strip()
                if first_line:
                    expl_parts.append(re.sub(r"Explanation\s*:\s*", "", str(elem), count=1, flags=re.IGNORECASE))
                continue

            # ── Explanation continuation ───────────────────────────────────────
            # Any element between Explanation: and Topic: belongs to the
            # explanation body — prose paragraphs, ASCII art, tables, etc.
            # Topic: is intercepted here to cleanly finalise expl_parts.
            if in_explanation:
                mt = topic_re.match(text)
                if mt:
                    # Topic: terminates the explanation section
                    in_explanation   = False
                    q['explanation'] = ''.join(_group_and_wrap_ascii(expl_parts)).strip()
                    expl_parts       = []
                    q['topics'].append(' '.join(mt.group(1).split()))
                elif text:
                    expl_parts.append(str(elem))
                continue

            # ── Answer ────────────────────────────────────────────────────────
            ma = answer_re.match(text)
            if ma:
                q['answer']    = ma.group(1).upper()
                in_choices     = False
                in_explanation = False   # guard: Answer: should not appear inside explanation
                continue

            # ── Topic ─────────────────────────────────────────────────────────
            mt = topic_re.match(text)
            if mt:
                # Finalise any accumulated explanation before recording topic
                if in_explanation:
                    in_explanation   = False
                    q['explanation'] = ''.join(_group_and_wrap_ascii(expl_parts)).strip()
                    expl_parts       = []
                q['topics'].append(' '.join(mt.group(1).split()))
                continue

            # ── Individual choice <p> (no <br/>) ─────────────────────────────
            if tag == 'p' and _is_choice_block(elem):
                in_choices     = True
                in_explanation = False
                lines = _split_para_into_lines(elem)
                for plain, html_str in lines:
                    mc = choice_label_re.match(plain)
                    if mc:
                        label = mc.group(1).upper()
                        if label not in seen_labels:
                            seen_labels.add(label)
                            choice_html = re.sub(r'^[A-E][.\)]\s*', '', html_str.strip())
                            q['choices'].append({
                                'label':      label,
                                'text':       choice_html,
                                'is_correct': False,
                            })
                continue

            # ── Regular content (catch-all) ───────────────────────────────────
            # Guard: in_explanation ensures explanation body never lands here.
            if not in_choices and not in_explanation and tag in ('p', 'table'):
                if image_seen:
                    after_image_parts.append(str(elem))
                else:
                    content_parts.append(str(elem))

        # ── Flush any trailing explanation not terminated by Topic: ──────────
        if expl_parts and not q['explanation']:
            q['explanation'] = ''.join(_group_and_wrap_ascii(expl_parts)).strip()

        q['content']             = '\n'.join(content_parts).strip()
        q['content_after_image'] = '\n'.join(after_image_parts).strip()

        # Mark correct choice and attach explanation to it
        if q['answer']:
            for c in q['choices']:
                if c['label'] == q['answer']:
                    c['is_correct']  = True
                    c['explanation'] = q.get('explanation', '')

        if q['number'] and (q['content'] or q['choices']):
            questions.append(q)

    return questions


def _parse_obj_blocks(blocks, img_map, q_num_re, q_inline_re, topic_re, answer_re, explanation_re):
    """
    Parse objective (MCQ) question blocks — legacy path kept for compatibility.
    Applies the same in_explanation state machine as _parse_obj_blocks_numbered.
    """
    questions = []

    for block in blocks:
        q = {
            'number':              None,
            'content':             '',
            'content_after_image': '',
            'image_bytes':         None,
            'image_ext':           None,
            'choices':             [],
            'answer':              '',
            'explanation':         '',
            'topics':              [],
        }
        content_parts     = []
        after_image_parts = []
        image_seen        = False
        in_choices        = False
        in_explanation    = False
        expl_parts        = []

        for elem in block:
            tag  = elem.name
            text = elem.get_text(separator='\n', strip=True)

            # Question number
            if tag == 'p' and q['number'] is None:
                standalone = q_num_re.match(text)
                inline     = q_inline_re.match(text)
                if standalone:
                    q['number'] = int(standalone.group(1))
                    continue
                if inline:
                    q['number'] = int(inline.group(1))
                    elem_html   = re.sub(r'(<p[^>]*>)\s*\d+[.\)]\s*', r'\1', str(elem))
                    content_parts.append(elem_html)
                    continue

            # Image
            if tag in ('figure', 'img') or (tag == 'p' and elem.find('img')):
                image_seen = True
                img_tag    = elem.find('img') if tag != 'img' else elem
                if img_tag:
                    src   = img_tag.get('src', '')
                    fname = os.path.basename(src)
                    if fname in img_map:
                        q['image_bytes'] = img_map[fname]
                        q['image_ext']   = fname.split('.')[-1].lower()
                continue

            # Explanation first line
            me = explanation_re.match(text)
            if me:
                in_explanation = True
                in_choices     = False
                first_line     = me.group(1).strip()
                if first_line:
                    expl_parts.append(re.sub(r"Explanation\s*:\s*", "", str(elem), count=1, flags=re.IGNORECASE))
                continue

            # Explanation continuation
            if in_explanation:
                mt = topic_re.match(text)
                if mt:
                    in_explanation   = False
                    q['explanation'] = ''.join(_group_and_wrap_ascii(expl_parts)).strip()
                    expl_parts       = []
                    q['topics'].append(' '.join(mt.group(1).split()))
                elif text:
                    expl_parts.append(str(elem))
                continue

            # Answer key
            ma = answer_re.match(text)
            if ma:
                q['answer']    = ma.group(1).upper()
                in_choices     = False
                in_explanation = False
                continue

            # Topic
            mt = topic_re.match(text)
            if mt:
                if in_explanation:
                    in_explanation   = False
                    q['explanation'] = ''.join(_group_and_wrap_ascii(expl_parts)).strip()
                    expl_parts       = []
                q['topics'].append(' '.join(mt.group(1).split()))
                continue

            # Choices
            if tag == 'p' and _is_choice_block(elem):
                in_choices     = True
                in_explanation = False
                q['choices']   = _parse_choices(elem)
                continue

            # Regular content
            if not in_choices and not in_explanation and tag in ('p', 'table'):
                if image_seen:
                    after_image_parts.append(str(elem))
                else:
                    content_parts.append(str(elem))

        # Flush trailing explanation
        if expl_parts and not q['explanation']:
            q['explanation'] = ''.join(_group_and_wrap_ascii(expl_parts)).strip()

        q['content']             = '\n'.join(content_parts).strip()
        q['content_after_image'] = '\n'.join(after_image_parts).strip()

        if q['answer']:
            for c in q['choices']:
                if c['label'] == q['answer']:
                    c['is_correct']  = True
                    c['explanation'] = q.get('explanation', '')

        if q['number'] and (q['content'] or q['choices']):
            questions.append(q)

    return questions


def _parse_docx(file_bytes):
    """
    Parse a DOCX file using pandoc → HTML → BeautifulSoup.

    Handles paragraph-based (typed numbers), list-based (Word numbering),
    and mixed-format files in a unified two-pass block collection.

    Returns:
        (header, questions)

    header    : dict — subject, exam, year, sitting, paper_type
    questions : list of dicts — number, content (HTML), image_bytes,
                image_ext, topics, choices, answer, explanation (OBJ)
                              — theory_answer, marking_guide (THEORY)
    """
    q_num_re               = re.compile(r'^\s*(\d+)[.\)]\s*$')
    q_inline_re            = re.compile(r'^\s*(\d+)[.\)]\s*(.+)', re.DOTALL)
    topic_re               = re.compile(r'^topic\s*:\s*(.+)', re.IGNORECASE | re.DOTALL)
    answer_re              = re.compile(r'^answer\s*(?:key\s*)?:\s*([A-E])', re.IGNORECASE)
    theory_answer_start_re = re.compile(r'^(answer|solution)\s*:\s*(.*)$', re.IGNORECASE | re.DOTALL)
    marking_guide_re       = re.compile(r'^marking\s*guide\s*:\s*(.*)$',   re.IGNORECASE | re.DOTALL)
    choice_label_re        = re.compile(r'^([A-E])[.\)]\s*')
    explanation_re         = re.compile(r'^\s*explanation\s*:\s*(.*)',       re.IGNORECASE | re.DOTALL)

    with tempfile.TemporaryDirectory() as tmpdir:
        docx_path = os.path.join(tmpdir, 'input.docx')
        with open(docx_path, 'wb') as f:
            f.write(file_bytes)

        result = subprocess.run(
            ['pandoc', docx_path, '-t', 'html', '--mathjax',
             f'--extract-media={tmpdir}'],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            raise ValueError(f'pandoc conversion failed: {result.stderr}')

        html = result.stdout
        # Escape bare currency $ signs before MathJax interprets them
        html = re.sub(r'\$(?=\s*\d)', r'&#36;', html)

        img_map    = {}
        media_path = os.path.join(tmpdir, 'media')
        if os.path.exists(media_path):
            for fname in os.listdir(media_path):
                fpath = os.path.join(media_path, fname)
                with open(fpath, 'rb') as f:
                    img_map[fname] = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # ── Header parser ─────────────────────────────────────────────────────────
    def _parse_header(header_elems):
        header = {
            'subject':    '',
            'exam':       '',
            'year':       '',
            'sitting':    'MAY_JUNE',
            'paper_type': 'OBJ',
        }
        for elem in header_elems:
            text = elem.get_text(separator='\n', strip=True)
            tl   = text.lower()
            if tl.startswith('subject:'):
                header['subject'] = text.split(':', 1)[1].strip()
            elif tl.startswith('exam:'):
                header['exam'] = text.split(':', 1)[1].strip()
            elif tl.startswith('year:'):
                year_raw   = text.split(':', 1)[1].strip()
                year_match = re.search(r'\d{4}', year_raw)
                header['year'] = year_match.group(0) if year_match else year_raw.split()[0]
            elif tl.startswith('sitting:'):
                header['sitting'] = _resolve_sitting(text.split(':', 1)[1].strip())
            elif tl.startswith('paper type:'):
                raw = text.split(':', 1)[1].strip().upper()
                header['paper_type'] = (
                    'THEORY' if any(k in raw for k in ('THEORY', 'ESSAY', 'PAPER 2'))
                    else 'OBJ'
                )
        return header

    # ── Locate where questions begin ──────────────────────────────────────────
    first_ol      = soup.find('ol', type='1')
    first_p_match = None
    for p in soup.find_all('p'):
        t = p.get_text(separator='\n', strip=True)
        if q_num_re.match(t) or q_inline_re.match(t):
            first_p_match = p
            break

    header_elems = []
    for p in soup.find_all('p'):
        if (first_ol and p == first_ol) or (first_p_match and p == first_p_match):
            break
        header_elems.append(p)
    header = _parse_header(header_elems)

    # ── Two-pass block collection ─────────────────────────────────────────────
    raw_blocks = {}  # {question_number: [elements]}

    # Pass 1 — list-based questions from <ol type="1">
    for ol in soup.find_all('ol', type='1'):
        lis   = ol.find_all('li', recursive=False)
        start = int(ol.get('start', 1))

        for idx, li in enumerate(lis):
            number = start + idx
            elems  = list(li.find_all(['p', 'img', 'figure', 'table', 'ol']))

            if li == lis[-1]:
                next_sib = ol.find_next_sibling()
                while next_sib and not hasattr(next_sib, 'name'):
                    next_sib = next_sib.find_next_sibling()
                while next_sib and next_sib.name in ('ol', 'p'):
                    t = next_sib.get_text(strip=True)
                    if next_sib.name == 'ol' and next_sib.get('type') == 'A':
                        elems.append(next_sib)
                        next_sib = next_sib.find_next_sibling()
                    elif next_sib.name == 'p' and (
                        answer_re.match(t)
                        or topic_re.match(t)
                        or next_sib.find('img')
                        or next_sib.find('br')
                        or choice_label_re.match(t)
                    ):
                        elems.append(next_sib)
                        next_sib = next_sib.find_next_sibling()
                    else:
                        break

            raw_blocks[number] = elems

    # Pass 2 — paragraph-based questions (typed "N." numbers)
    # Only adds questions not already captured in Pass 1
    all_elements = list(soup.find_all(['p', 'img', 'table', 'figure']))
    current_num  = None
    current      = []

    for elem in all_elements:
        text       = elem.get_text(separator='\n', strip=True)
        standalone = q_num_re.match(text)
        inline     = q_inline_re.match(text)

        if standalone or inline:
            if current_num is not None and current_num not in raw_blocks:
                raw_blocks[current_num] = current
            current_num = int((standalone or inline).group(1))
            current     = [elem]
        elif current_num is not None:
            current.append(elem)

    if current_num is not None and current_num not in raw_blocks:
        raw_blocks[current_num] = current

    # ── Dispatch to correct parser ────────────────────────────────────────────
    if header['paper_type'] == 'THEORY':
        questions = _parse_theory_blocks(
            soup, img_map, q_num_re, q_inline_re, topic_re,
            theory_answer_start_re, marking_guide_re
        )
    else:
        questions = _parse_obj_blocks_numbered(
            raw_blocks, img_map, q_inline_re, topic_re, answer_re, explanation_re
        )

    return header, questions


import os
from bs4 import Tag

_TH_Q_TYPED_RE = re.compile(r'^\s*(\d+)[.)]\s*(.*)', re.DOTALL)
_TH_ANSWER_RE  = re.compile(r'^(answer|solution)\s*:\s*(.*)', re.IGNORECASE | re.DOTALL)
_TH_MARKING_RE = re.compile(r'^marking\s*guide\s*:\s*(.*)',   re.IGNORECASE | re.DOTALL)
_TH_VIDEO_RE   = re.compile(r'^video\s*:\s*(\S+)',            re.IGNORECASE)
_TH_MARKS_RE   = re.compile(r'^\[(\d+)\s*marks?\]$',         re.IGNORECASE)
_TH_TOPIC_RE   = re.compile(r'^topic\s*:\s*(.+)',             re.IGNORECASE | re.DOTALL)
_TH_SUBPART_RE = re.compile(
    r'^\s*[\(\[]?([a-zA-Z]{1,3}|i{1,4}v?|vi{0,3}|ix|x{1,3})[\)\].]\s*\S',
    re.IGNORECASE
)
_TH_IMG_W_RE = re.compile(r'width\s*:\s*([\d.]+)in',  re.IGNORECASE)
_TH_IMG_H_RE = re.compile(r'height\s*:\s*([\d.]+)in', re.IGNORECASE)


def _th_text(elem) -> str:
    return elem.get_text(separator=' ', strip=True).replace('\n', ' ')


def _th_is_topic(elem) -> bool:
    return bool(_TH_TOPIC_RE.match(_th_text(elem)))


def _th_topic_name(elem) -> str:
    m = _TH_TOPIC_RE.match(_th_text(elem))
    return ' '.join(m.group(1).split()) if m else ''


def _th_img_info(img_tag, img_map: dict):
    """
    Return (bytes, ext, width_px, height_px) or (None, None, None, None).
    96 dpi: px = inches × 96.
    """
    src   = img_tag.get('src', '')
    fname = os.path.basename(src)
    data  = img_map.get(fname)
    if not data:
        return None, None, None, None
    ext   = fname.rsplit('.', 1)[-1].lower() if '.' in fname else 'png'
    style = img_tag.get('style', '')
    wm    = _TH_IMG_W_RE.search(style)
    hm    = _TH_IMG_H_RE.search(style)
    w_px  = round(float(wm.group(1)) * 96) if wm else None
    h_px  = round(float(hm.group(1)) * 96) if hm else None
    return data, ext, w_px, h_px


def _th_ol_to_html(ol_elem, lv: int) -> str:
    """
    Render <ol type="a"|"i"> into sq-lv{N} indent blocks.
    Nested <ol> recurse one level deeper (capped at lv3).
    """
    parts = []
    for li in ol_elem.find_all('li', recursive=False):
        nested_ols = li.find_all('ol', recursive=False)
        for nol in nested_ols:
            nol.extract()
        inner = li.decode_contents().strip()
        if inner:
            parts.append('<div class="sq-lv%d">%s</div>' % (lv, inner))
        for nol in nested_ols:
            parts.append(_th_ol_to_html(nol, min(lv + 1, 3)))
    return '\n'.join(parts)


def _th_blockquote_html(bq_elem, img_map: dict, set_img_fn) -> list:
    """
    Walk a <blockquote> and return list of HTML strings.
    Skips Topic: paragraphs. Calls set_img_fn for any images found.
    """
    parts = []
    for child in bq_elem.find_all(
        ['p', 'ol', 'table', 'img', 'blockquote'], recursive=False
    ):
        if _th_is_topic(child):
            continue
        if child.name == 'ol':
            lv = 2 if child.get('type', 'a').lower() == 'a' else 3
            parts.append(_th_ol_to_html(child, lv))
        elif child.name == 'table':
            parts.append(str(child))
        elif child.name == 'img':
            b, ext, w, h = _th_img_info(child, img_map)
            set_img_fn(b, ext, w, h)
        elif child.name == 'blockquote':
            for html in _th_blockquote_html(child, img_map, set_img_fn):
                parts.append('<div class="sq-lv2">%s</div>' % html)
        else:
            img_t = child.find('img')
            if img_t:
                b, ext, w, h = _th_img_info(img_t, img_map)
                set_img_fn(b, ext, w, h)
            inner = child.decode_contents().strip()
            if inner:
                parts.append('<div class="sq-lv1"><p>%s</p></div>' % inner)
    return parts


def _parse_theory_blocks(blocks, img_map, q_num_re, q_inline_re, topic_re,
                          theory_answer_start_re, marking_guide_re):
    """
    Parse theory/essay questions from pandoc-generated HTML.

    Args:
        blocks   — BeautifulSoup soup object (repurposed arg name for compatibility)
        img_map  — {filename: bytes} from pandoc --extract-media

    Returns list of question dicts:
        number, content (HTML), image_bytes, image_ext,
        image_width_px, image_height_px, topics (list[str]),
        theory_answer (HTML), marking_guide (HTML), video_url (str|None)

    Section markers (place after question content, before Topic:):
        Answer: / Solution:  → theory_answer
        Marking Guide:       → marking_guide
        Video: https://...   → video_url (first occurrence wins)
        Topic:               → closes the question record
    """
    soup = blocks

    def _new_q(number):
        return {
            'number':          number,
            'content':         '',
            'image_bytes':     None,
            'image_ext':       None,
            'image_width_px':  None,
            'image_height_px': None,
            'topics':          [],
            'theory_answer':   '',
            'marking_guide':   '',
            'video_url':       None,
            'marks':           1,
        }

    questions     = []
    current_q     = None
    content_parts = []
    answer_parts  = []
    marking_parts = []
    section       = 'content'
    last_q_number = 0
    used_numbers  = set()

    def _flush():
        nonlocal current_q, content_parts, answer_parts
        nonlocal marking_parts, section, last_q_number
        if current_q is None:
            return
        current_q['content']       = '\n'.join(content_parts).strip()
        current_q['theory_answer'] = '\n'.join(answer_parts).strip()
        current_q['marking_guide'] = '\n'.join(marking_parts).strip()
        if current_q['content']:
            questions.append(current_q)
            last_q_number = current_q['number']
            used_numbers.add(current_q['number'])
        current_q     = None
        content_parts = []
        answer_parts  = []
        marking_parts = []
        section       = 'content'

    def _open(number):
        nonlocal current_q, section
        _flush()
        current_q = _new_q(number)
        section   = 'content'

    def _append(html):
        if not html:
            return
        if   section == 'content': content_parts.append(html)
        elif section == 'answer':  answer_parts.append(html)
        elif section == 'marking': marking_parts.append(html)

    def _set_image(b, ext, w, h):
        if current_q and current_q['image_bytes'] is None and b:
            current_q['image_bytes']     = b
            current_q['image_ext']       = ext
            current_q['image_width_px']  = w
            current_q['image_height_px'] = h

    def _try_section_switch(text) -> bool:
        nonlocal section

        mm = _TH_MARKS_RE.match(text.strip())
        if mm and current_q is not None:
            current_q['marks'] = int(mm.group(1))
            return True

        mv = _TH_VIDEO_RE.match(text)
        if mv and current_q is not None:
            if current_q['video_url'] is None:
                current_q['video_url'] = mv.group(1).strip()
            return True

        mg = _TH_MARKING_RE.match(text)
        if mg:
            section = 'marking'
            inline  = mg.group(1).strip()
            if inline:
                _append('<p>%s</p>' % inline)
            return True

        ans = _TH_ANSWER_RE.match(text)
        if ans:
            section = 'answer'
            inline  = ans.group(2).strip()
            if inline:
                _append('<p>%s</p>' % inline)
            return True

        return False

    top_elems = [e for e in soup.children if isinstance(e, Tag)]

    for elem in top_elems:
        tag  = elem.name
        text = _th_text(elem)

        # Topic → close question
        if _th_is_topic(elem):
            tn = _th_topic_name(elem)
            if tn and current_q is not None:
                current_q['topics'].append(tn)
            _flush()
            continue

        # Topic wrapped in <blockquote>
        if tag == 'blockquote':
            topic_p = next(
                (c for c in elem.find_all('p', recursive=True) if _th_is_topic(c)),
                None
            )
            if topic_p:
                tn = _th_topic_name(topic_p)
                if tn and current_q is not None:
                    current_q['topics'].append(tn)
                _flush()
                continue

        # Section switches at top level
        if current_q is not None and _try_section_switch(text):
            continue

        # <ol type="1"> — list-based questions
        if tag == 'ol' and elem.get('type') == '1':
            start_attr = elem.get('start')
            q_num      = int(start_attr) if start_attr else (last_q_number + 1)

            for li in elem.find_all('li', recursive=False):
                _open(q_num)
                q_num += 1

                for child in li.children:
                    if not isinstance(child, Tag):
                        continue
                    child_text = _th_text(child)

                    if _try_section_switch(child_text):
                        continue

                    if child.name == 'p':
                        img_t = child.find('img')
                        if img_t:
                            b, ext, w, h = _th_img_info(img_t, img_map)
                            _set_image(b, ext, w, h)
                        inner = child.decode_contents().strip()
                        if inner:
                            _append('<p>%s</p>' % inner)
                    elif child.name == 'ol':
                        lv = 2 if child.get('type', 'a').lower() == 'a' else 3
                        _append(_th_ol_to_html(child, lv))
                    elif child.name == 'blockquote':
                        for html in _th_blockquote_html(child, img_map, _set_image):
                            _append(html)
                    elif child.name == 'table':
                        _append(str(child))
            continue

        # <p>N. text — typed-number question
        if tag == 'p':
            m_typed = _TH_Q_TYPED_RE.match(text)
            if m_typed:
                q_num = int(m_typed.group(1))
                _open(q_num)
                raw_inner = elem.decode_contents().strip()
                stripped  = re.sub(r'^\s*\d+[.)]\s*', '', raw_inner, count=1)
                if stripped:
                    _append('<p>%s</p>' % stripped)
                img_t = elem.find('img')
                if img_t:
                    b, ext, w, h = _th_img_info(img_t, img_map)
                    _set_image(b, ext, w, h)
                continue

            # Orphan sub-part after a topic flush
            if current_q is None and _TH_SUBPART_RE.match(text):
                synthetic = last_q_number + 1
                while synthetic in used_numbers:
                    synthetic += 1
                _open(synthetic)

            if current_q is None:
                continue

            if _try_section_switch(text):
                continue

            img_t = elem.find('img')
            if img_t:
                b, ext, w, h = _th_img_info(img_t, img_map)
                _set_image(b, ext, w, h)
                if not text.strip():
                    continue

            inner = elem.decode_contents().strip()
            if inner:
                _append('<p>%s</p>' % inner)
            continue

        # <blockquote> — lv1 indented continuation
        if tag == 'blockquote':
            if current_q is None:
                continue
            for html in _th_blockquote_html(elem, img_map, _set_image):
                _append(html)
            continue

        # <ol type="a"|"i"> at top level
        if tag == 'ol' and elem.get('type', '').lower() in ('a', 'i'):
            if current_q is None:
                continue
            lv = 2 if elem.get('type', 'a').lower() == 'a' else 3
            _append(_th_ol_to_html(elem, lv))
            continue

        # <table>
        if tag == 'table':
            if current_q is None:
                continue
            _append(str(elem))
            continue

        # Bare <figure> or <img>
        if tag in ('figure', 'img'):
            if current_q is None:
                continue
            img_t = elem if tag == 'img' else elem.find('img')
            if img_t:
                b, ext, w, h = _th_img_info(img_t, img_map)
                _set_image(b, ext, w, h)
            continue

    _flush()
    return questions


@admin_required
@feature_required('docx_upload')
def upload_docx(request):
    if request.method != 'POST':
        return render(request, 'teacher/upload_docx.html')

    uploaded = request.FILES.get('docx_file')
    if not uploaded or not uploaded.name.endswith('.docx'):
        return render(request, 'teacher/upload_docx.html',
                      {'error': 'Please upload a valid .docx file.'})

    try:
        header, questions = _parse_docx(uploaded.read())
    except Exception as e:
        return render(request, 'teacher/upload_docx.html',
                      {'error': f'Could not read file: {e}'})

    if not questions:
        return render(request, 'teacher/upload_docx.html', {
            'error': 'No questions found. Make sure the file follows the expected format.'
        })

    subject_name = header['subject']
    board_name   = header['exam']
    year_str     = header['year']
    sitting      = header['sitting']
    paper_type   = header['paper_type']

    subject = Subject.objects.filter(name__iexact=subject_name).first()
    if not subject:
        all_subjects = ', '.join(Subject.objects.values_list('name', flat=True))
        return render(request, 'teacher/upload_docx.html', {
            'error': f'Subject "{subject_name}" not found. Available: {all_subjects}'
        })

    exam_board = (
        ExamBoard.objects.filter(name__iexact=board_name).first() or
        ExamBoard.objects.filter(abbreviation__iexact=board_name).first()
    )
    if not exam_board:
        all_boards = ', '.join(ExamBoard.objects.values_list('abbreviation', flat=True))
        return render(request, 'teacher/upload_docx.html', {
            'error': f'Exam board "{board_name}" not found. Available: {all_boards}'
        })

    try:
        year = int(year_str)
    except (ValueError, TypeError):
        return render(request, 'teacher/upload_docx.html',
                      {'error': f'Could not parse year "{year_str}".'})

    exam_series, _ = ExamSeries.objects.get_or_create(
        exam_board=exam_board, subject=subject, year=year, sitting=sitting,
    )

    # Pre-fetch everything needed for the loop — eliminates all N+1s
    existing_questions = {
        (q.question_number, q.question_type): q
        for q in Question.objects.filter(exam_series=exam_series, question_type=paper_type)
                                 .only('id', 'question_number', 'content', 'question_type')
    }

    topic_map = {
        t.name.lower(): t
        for t in Topic.objects.filter(subject=subject).only('id', 'name')
    }

    created_count = 0
    skipped_count = 0
    skipped_nums  = []
    errors        = []
    overwrite     = request.POST.get('overwrite') == 'on'

    for q_data in questions:
        existing = existing_questions.get((q_data['number'], paper_type))

        if existing and not overwrite:
            skipped_count += 1
            skipped_nums.append(q_data['number'])
            continue

        try:
            with transaction.atomic():
                if existing and overwrite:
                    existing.content             = q_data['content']
                    existing.content_after_image = q_data.get('content_after_image') or ''
                    existing.question_type       = paper_type
                    existing.marks               = q_data.get('marks') or existing.marks
                    existing.save(update_fields=['content', 'content_after_image', 'question_type', 'marks'])
                    question = existing
                    question.choices.all().delete()
                    question.topics.clear()
                else:
                    question = Question.objects.create(
                        subject=subject,
                        exam_series=exam_series,
                        question_number=q_data['number'],
                        question_type=paper_type,
                        content=q_data['content'],
                        content_after_image=q_data.get('content_after_image') or '',
                        marks=q_data.get('marks') or 1,
                    )

                # Image
                if q_data.get('image_bytes'):
                    ext      = q_data['image_ext'] or 'png'
                    filename = f"q_{subject.name.lower()}_{year}_{paper_type.lower()}_{q_data['number']}.{ext}"
                    question.image.save(filename, ContentFile(q_data['image_bytes']), save=True)
                elif existing and overwrite:
                    if question.image:
                        question.image.delete(save=False)
                        question.image = None
                        question.save(update_fields=['image'])

                # Choices — bulk_create: single INSERT regardless of choice count
                if paper_type == 'OBJ' and q_data['choices']:
                    seen_labels       = set()
                    choices_to_create = []
                    for c in q_data['choices']:
                        if c['label'] not in seen_labels:
                            seen_labels.add(c['label'])
                            choices_to_create.append(Choice(
                                question=question,
                                label=c['label'],
                                choice_text=c['text'],
                                is_correct=c['is_correct'],
                                explanation=c.get('explanation') or '',
                            ))
                    Choice.objects.bulk_create(choices_to_create)

                elif paper_type == 'THEORY' and q_data.get('theory_answer'):
                    TheoryAnswer.objects.update_or_create(
                        question=question,
                        defaults={
                            'content':       q_data['theory_answer'],
                            'marking_guide': q_data.get('marking_guide') or '',
                            'video_url':     q_data.get('video_url') or None,
                        }
                    )

                # Topics — single INSERT regardless of topic count
                topics_to_add = []
                for topic_name in q_data['topics']:
                    topic_name = " ".join(topic_name.split()).lower()
                    if not topic_name:
                        continue
                    topic = topic_map.get(topic_name)
                    if topic:
                        topics_to_add.append(topic)
                    else:
                        errors.append(
                            f"Q{q_data['number']}: Topic '{topic_name}' not found — skipped"
                        )
                if topics_to_add:
                    question.topics.add(*topics_to_add)

            created_count += 1

        except Exception as e:
            errors.append(f"Q{q_data['number']}: {e}")

    if created_count > 0:
        from catalog.cache_utils import invalidate_subject_caches
        invalidate_subject_caches(subject.id)

    SITTING_DISPLAY = {
        'MAY_JUNE': 'May/June', 'NOV_DEC': 'Nov/Dec',
        'MOCK': 'Mock',         'OTHER':   'Other',
    }

    context = {
        'success':       True,
        'subject':       subject.name,
        'exam_board':    exam_board.name,
        'year':          year,
        'sitting':       SITTING_DISPLAY.get(sitting, sitting),
        'paper_type':    paper_type,
        'total_parsed':  len(questions),
        'overwrite':     overwrite,
        'created_count': created_count,
        'skipped_count': skipped_count,
        'skipped_nums':  skipped_nums,
        'errors':        errors,
    }
    return render(request, 'teacher/upload_docx.html', context)


@admin_required
def referral_analytics(request):
    """Admin view showing referral statistics and top referrers."""
    total_referrals       = Referral.objects.count()
    total_referring_users = Referral.objects.values('referrer').distinct().count()

    thirty_days_ago  = timezone.now() - timedelta(days=30)
    recent_referrals = Referral.objects.filter(created_at__gte=thirty_days_ago).count()

    top_referrers = (
        Referral.objects
        .values('referrer__id', 'referrer__first_name', 'referrer__last_name', 'referrer__email')
        .annotate(total=Count('id'))
        .order_by('-total')[:20]
    )

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


@admin_required
def upload_past_paper(request):
    from catalog.models import Subject, ExamBoard, ExamSeries, PastPaper
    from django.core.files.base import ContentFile

    if request.method != 'POST':
        return render(request, 'teacher/upload_past_paper.html', {
            'subjects':    Subject.objects.only('id', 'name').order_by('name'),
            'exam_boards': ExamBoard.objects.only('id', 'name', 'abbreviation').order_by('name'),
        })

    subject_id    = request.POST.get('subject')
    board_id      = request.POST.get('exam_board')
    year_str      = request.POST.get('year', '').strip()
    sitting       = request.POST.get('sitting', 'MAY_JUNE')
    paper_type    = request.POST.get('paper_type', '').upper()
    video_url     = request.POST.get('video_url', '').strip() or None
    question_file = request.FILES.get('question_pdf')
    answer_file   = request.FILES.get('answer_pdf')

    errors = []
    if not subject_id:  errors.append('Please select a subject.')
    if not board_id:    errors.append('Please select an exam board.')
    if not year_str:    errors.append('Please enter a year.')
    if not paper_type:  errors.append('Please select a paper type.')
    if paper_type not in ('OBJ', 'THEORY', 'PRACTICAL'):
        errors.append('Invalid paper type.')
    if not question_file and not answer_file and not video_url:
        errors.append('Please provide at least one file or a video URL.')

    year = None
    try:
        year = int(year_str)
    except (ValueError, TypeError):
        errors.append(f'Invalid year: "{year_str}".')

    if errors:
        return render(request, 'teacher/upload_past_paper.html', {
            'subjects':    Subject.objects.only('id', 'name').order_by('name'),
            'exam_boards': ExamBoard.objects.only('id', 'name', 'abbreviation').order_by('name'),
            'errors':      errors,
            'post':        request.POST,
        })

    try:
        subject    = Subject.objects.only('id', 'name').get(id=subject_id)
        exam_board = ExamBoard.objects.only('id', 'name', 'abbreviation').get(id=board_id)
    except (Subject.DoesNotExist, ExamBoard.DoesNotExist):
        return render(request, 'teacher/upload_past_paper.html', {
            'subjects':    Subject.objects.only('id', 'name').order_by('name'),
            'exam_boards': ExamBoard.objects.only('id', 'name', 'abbreviation').order_by('name'),
            'errors':      ['Invalid subject or exam board.'],
            'post':        request.POST,
        })

    exam_series, _ = ExamSeries.objects.get_or_create(
        exam_board=exam_board, subject=subject,
        year=year, sitting=sitting,
    )

    paper, created    = PastPaper.objects.get_or_create(
        exam_series=exam_series,
        paper_type=paper_type,
    )

    save_fields       = ['uploaded_by']
    paper.uploaded_by = request.user
    updated_fields    = []

    if question_file:
        paper.question_pdf = question_file
        save_fields.append('question_pdf')
        updated_fields.append('question PDF')

    if answer_file:
        paper.answer_pdf = answer_file
        save_fields.append('answer_pdf')
        updated_fields.append('answer PDF')

    if video_url:
        paper.video_url = video_url
        save_fields.append('video_url')
        updated_fields.append('video URL')

    paper.save(update_fields=save_fields)

    from django.core.cache import cache
    cache.delete_many([
        f'pp:papers_board_{exam_board.id}',
        'pp:boards_with_counts',
    ])

    action  = 'Created' if created else 'Updated'
    summary = f"{action}: {exam_board.abbreviation} {subject.name} {sitting} {year} — {paper_type}"
    if updated_fields:
        summary += f" ({', '.join(updated_fields)} added)"

    return render(request, 'teacher/upload_past_paper.html', {
        'success': True,
        'summary': summary,
        'paper':   paper,
        'created': created,
    })