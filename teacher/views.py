from django.db.models import F, FloatField, ExpressionWrapper, Avg, Count
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from functools import wraps

from catalog.models import Subject, ExamBoard, Question, ExamSeries, Choice, Topic
from practice.models import PracticeSession, UserAnswer

# File upload handling
import re
import io
from docx import Document as DocxDocument
from docx.oxml.ns import qn
from django.core.files.base import ContentFile
from django.db import transaction

from catalog.models import LessonNote
from catalog.feature_flags import feature_required, is_feature_enabled
from django.http import JsonResponse
import json




def teacher_required(view_func):
    @wraps(view_func)
    @login_required
    def wrapper(request, *args, **kwargs):
        if request.user.role != 'TEACHER':
            return redirect('Users:dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper

def admin_required(view_func):
    @login_required
    def wrapper(request, *args, **kwargs):
        if not request.user.is_admin:
            return redirect('teacher:dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper

@teacher_required
def dashboard(request):
    # Quick stats
    total_students = PracticeSession.objects.values('user').distinct().count()
    total_sessions = PracticeSession.objects.filter(completed_at__isnull=False).count()
    total_questions = Question.objects.count()

    # Recent sessions across all students
    recent_sessions = (
        PracticeSession.objects
        .filter(completed_at__isnull=False)
        .select_related('user', 'subject')
        .order_by('-completed_at')[:8]
    )

    # Top subjects by session count
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
        'total_students': total_students,
        'total_sessions': total_sessions,
        'total_questions': total_questions,
        'recent_sessions': recent_sessions,
        'top_subjects': top_subjects,
    }
    return render(request, 'teacher/dashboard.html', context)


@teacher_required
def question_sets(request):
    """View and manage previously generated question sets (saved by the React test builder)."""
    from catalog.models import ExamSeries
    subjects = Subject.objects.all().order_by('name')
    exam_boards = ExamBoard.objects.all().order_by('name')

    # Filter
    subject_id = request.GET.get('subject')
    board_id = request.GET.get('board')

    questions = Question.objects.select_related('exam_series', 'exam_series__subject', 'exam_series__exam_board').order_by('-exam_series__year')

    if subject_id:
        questions = questions.filter(exam_series__subject_id=subject_id)
    if board_id:
        questions = questions.filter(exam_series__exam_board_id=board_id)

    # Group by exam series
    from itertools import groupby
    questions = list(questions.select_related('exam_series'))
    grouped = {}
    for q in questions:
        key = str(q.exam_series) if q.exam_series else 'Uncategorised'
        grouped.setdefault(key, []).append(q)

    context = {
        'grouped': grouped,
        'subjects': subjects,
        'exam_boards': exam_boards,
        'selected_subject': subject_id,
        'selected_board': board_id,
        'total_questions': len(questions),
    }
    return render(request, 'teacher/question_sets.html', context)


@teacher_required
def students(request):
    """Student performance overview."""
    from Users.models import CustomUser

    subject_id = request.GET.get('subject')
    subjects = Subject.objects.all().order_by('name')

    student_qs = CustomUser.objects.filter(role='STUDENT').prefetch_related('practice_sessions')

    # Build student stats
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
            'student': student,
            'session_count': session_count,
            'avg_score': round(avg_score, 1) if avg_score else None,
            'last_active': last_session.completed_at if last_session else None,
            'streak': student.streak,
        })

    # Sort by avg score desc
    student_stats.sort(key=lambda x: x['avg_score'] or 0, reverse=True)

    context = {
        'student_stats': student_stats,
        'subjects': subjects,
        'selected_subject': subject_id,
        'total_students': len(student_stats),
    }
    return render(request, 'teacher/students.html', context)

@admin_required
@feature_required('csv_upload')
def upload_questions(request):
    """Bulk question upload via CSV."""
    if request.method == 'POST':
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return render(request, 'teacher/upload.html', {'error': 'Please select a CSV file.'})

        if not csv_file.name.endswith('.csv'):
            return render(request, 'teacher/upload.html', {'error': 'Only CSV files are supported.'})

        import csv, io
        decoded = csv_file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))

        created = 0
        errors = []
        required_fields = {'content', 'question_type', 'subject'}

        for i, row in enumerate(reader, start=2):
            missing = required_fields - set(row.keys())
            if missing:
                errors.append(f'Row {i}: Missing columns: {", ".join(missing)}')
                continue
            try:
                # Minimal create — extend as needed
                subject = Subject.objects.filter(name__iexact=row['subject'].strip()).first()
                if not subject:
                    errors.append(f'Row {i}: Subject "{row["subject"]}" not found.')
                    continue

                q_type = row['question_type'].strip().upper()
                if q_type not in ('OBJ', 'THEORY'):
                    errors.append(f'Row {i}: question_type must be OBJ or THEORY.')
                    continue

                from catalog.models import ExamSeries
                series = None
                if row.get('exam_board') and row.get('year'):
                    board = ExamBoard.objects.filter(abbreviation__iexact=row['exam_board'].strip()).first()
                    if board:
                        series, _ = ExamSeries.objects.get_or_create(
                            subject=subject, exam_board=board,
                            year=int(row['year']),
                            defaults={'sitting': row.get('sitting', 'MAY_JUNE')}
                        )

                q = Question.objects.create(
                    content=row['content'].strip(),
                    question_type=q_type,
                    subject=subject,          # ← add this
                    exam_series=series,
                    question_number=row.get('question_number') or None,
                )

                # Handle topics
                topics_raw = row.get('topics', '').strip()
                if topics_raw:
                    from catalog.models import Topic
                    topic_names = [t.strip() for t in topics_raw.split('|') if t.strip()]
                    for name in topic_names:
                        topic = Topic.objects.filter(
                            name__iexact=name,
                            subject=subject
                        ).first()
                        if topic:
                            q.topics.add(topic)
                        else:
                            errors.append(f'Row {i}: Topic "{name}" not found for {subject.name} — skipped.')

                # OBJ choices — expects columns choice_a, choice_b, choice_c, choice_d, correct_answer
                if q_type == 'OBJ':
                    from catalog.models import Choice
                    correct = row.get('correct_answer', 'A').strip().upper()
                    for label in ['A', 'B', 'C', 'D']:
                        text = row.get(f'choice_{label.lower()}', '').strip()
                        if text:
                            Choice.objects.create(
                                question=q, label=label,
                                choice_text=text,
                                is_correct=(label == correct),
                            )
                created += 1
            except Exception as e:
                errors.append(f'Row {i}: {str(e)}')

        return render(request, 'teacher/upload.html', {
            'success': True,
            'created': created,
            'errors': errors,
        })

    # GET
    subjects = Subject.objects.all().order_by('name')
    exam_boards = ExamBoard.objects.all().order_by('name')
    return render(request, 'teacher/upload.html', {'subjects': subjects, 'exam_boards': exam_boards})


@teacher_required
def lesson_notes(request):
    """Lesson note generator — stub for AI-powered generation."""
    return render(request, 'teacher/lesson_notes.html')


# ── SITTING MAP ───────────────────────────────────────────────────────────────
# Maps keywords found in "Paper Type" or "Sitting" header lines → ExamSeries.sitting choices
_SITTING_MAP = {
    'may':      'MAY_JUNE',
    'june':     'MAY_JUNE',
    'nov':      'NOV_DEC',
    'dec':      'NOV_DEC',
    'mock':     'MOCK',
    'cbt':      'MAY_JUNE',   # default for CBT papers
    '':         'MAY_JUNE',
}

def _resolve_sitting(paper_type_str):
    s = paper_type_str.lower()
    for key, val in _SITTING_MAP.items():
        if key and key in s:
            return val
    return 'MAY_JUNE'


# ── DOCX PARSER ───────────────────────────────────────────────────────────────

def _parse_docx(file_bytes):
    """
    Parse a DOCX file and return:
        header   – dict with subject, exam, year, sitting
        questions – list of dicts:
            {
                number:  int,
                content: str,          # full question text
                image_bytes: bytes|None,
                image_ext:   str|None,
                choices: [{'label': 'A', 'text': '...', 'is_correct': bool}],
                answer:  str,          # correct label e.g. 'C'
                topics:  [str],        # topic name strings
            }
    """
    doc = DocxDocument(io.BytesIO(file_bytes))
    paras = doc.paragraphs

    # ── Build a lookup: rId → image bytes ────────────────────────────────────
    img_map = {}
    for rel in doc.part.rels.values():
        if 'image' in rel.reltype:
            try:
                img_map[rel.rId] = (rel.target_part.blob,
                                    rel.target_ref.split('.')[-1].lower())
            except Exception:
                pass

    def _para_image(para):
        """Return (bytes, ext) if paragraph contains an inline image, else (None, None)."""
        for blip in para._element.findall('.//' + qn('a:blip')):
            rid = blip.get(qn('r:embed'))
            if rid and rid in img_map:
                return img_map[rid]
        return None, None

    # ── Parse header (first paragraphs before first numbered question) ────────
    header = {'subject': '', 'exam': '', 'year': '', 'sitting': 'MAY_JUNE'}
    # \s* instead of \s — handles "4." after strip() as well as "4. text"
    q_start_re = re.compile(r'^(\d+)\.\s*')
    first_q_idx = 0

    for i, para in enumerate(paras):
        text = para.text.strip()
        if q_start_re.match(text):
            first_q_idx = i
            break
        if text.lower().startswith('subject:'):
            header['subject'] = text.split(':', 1)[1].strip()
        elif text.lower().startswith('exam:'):
            header['exam'] = text.split(':', 1)[1].strip()
        elif text.lower().startswith('year:'):
            # May contain "Year: 2024\nPaper Type: CBT"
            parts = text.split('\n')
            header['year'] = parts[0].split(':', 1)[1].strip()
            if len(parts) > 1 and 'paper' in parts[1].lower():
                pt = parts[1].split(':', 1)[1].strip()
                header['sitting'] = _resolve_sitting(pt)
        elif text.lower().startswith('paper type:'):
            header['sitting'] = _resolve_sitting(text.split(':', 1)[1].strip())
        elif text.lower().startswith('sitting:'):
            header['sitting'] = _resolve_sitting(text.split(':', 1)[1].strip())

    # ── Group paragraphs into per-question blocks ─────────────────────────────
    blocks = []        # list of paragraph-index lists
    current = []
    for i in range(first_q_idx, len(paras)):
        text = paras[i].text.strip()
        if q_start_re.match(text) and current:
            blocks.append(current)
            current = [i]
        elif q_start_re.match(text):
            current = [i]
        else:
            if current:
                current.append(i)
    if current:
        blocks.append(current)

    # ── Parse each block ──────────────────────────────────────────────────────
    choice_re  = re.compile(r'^([A-E])[.\)]\s+(.+)$', re.DOTALL)
    answer_re  = re.compile(r'^answer\s*:\s*([A-E])', re.IGNORECASE)
    topic_re   = re.compile(r'^topic\s*:\s*(.+)$', re.IGNORECASE)

    questions = []

    for block_idx in blocks:
        q = {
            'number':      None,
            'content':     '',
            'image_bytes': None,
            'image_ext':   None,
            'choices':     [],
            'answer':      '',
            'topics':      [],
        }

        content_parts = []   # text fragments that make up question content
        in_choices    = False

        for idx in block_idx:
            para  = paras[idx]
            text  = para.text.strip()
            img_b, img_e = _para_image(para)
            is_bold = any(r.bold for r in para.runs)

            # ── Question number line: "4. Some text" or "4. " ────────────────
            m = q_start_re.match(text)
            if m and q['number'] is None:
                q['number'] = int(m.group(1))
                remainder   = text[m.end():].strip()
                if remainder:
                    content_parts.append(remainder)
                # Image may be on same paragraph (unlikely) or next
                if img_b:
                    q['image_bytes'] = img_b
                    q['image_ext']   = img_e
                continue

            # ── Image paragraph (empty para with embedded image) ─────────────
            if img_b and not text:
                q['image_bytes'] = img_b
                q['image_ext']   = img_e
                continue

            # ── Answer line ──────────────────────────────────────────────────
            ma = answer_re.match(text)
            if ma:
                q['answer'] = ma.group(1).upper()
                in_choices  = False
                continue

            # ── Topic line (bold) ─────────────────────────────────────────────
            mt = topic_re.match(text)
            if mt:
                q['topics'].append(mt.group(1).strip())
                continue

            # ── Skip blank lines ─────────────────────────────────────────────
            if not text:
                continue

            # ── Choices paragraph: starts with "A." or "A)" ──────────────────
            # Choices may all be on one paragraph separated by \n, or the
            # paragraph text may start with a choice label
            raw_lines = para.text.split('\n')  # use original (not stripped) to preserve \n
            first_line = raw_lines[0].strip()
            if choice_re.match(first_line):
                in_choices = True
                for line in raw_lines:
                    line = line.strip()
                    if not line:
                        continue
                    mc = choice_re.match(line)
                    if mc:
                        q['choices'].append({
                            'label':      mc.group(1).upper(),
                            'text':       mc.group(2).strip(),
                            'is_correct': False,
                        })
                continue

            # ── Continuation of question text (e.g. after an image) ──────────
            if not in_choices:
                content_parts.append(text)

        # Combine content parts into full question text
        q['content'] = ' '.join(content_parts).strip()

        # Mark correct choice
        if q['answer']:
            for c in q['choices']:
                if c['label'] == q['answer']:
                    c['is_correct'] = True

        if q['number'] and q['content']:
            questions.append(q)

    return header, questions


# ── VIEW ──────────────────────────────────────────────────────────────────────

@feature_required('docx_upload')
@admin_required   # reuse your existing admin_required decorator
def upload_docx(request):
    """
    GET  → render the upload form (reuses upload.html or its own template)
    POST → parse DOCX, insert questions, return summary
    """
    if request.method != 'POST':
        return render(request, 'teacher/upload_docx.html')

    uploaded = request.FILES.get('docx_file')
    if not uploaded or not uploaded.name.endswith('.docx'):
        return render(request, 'teacher/upload_docx.html', {
            'error': 'Please upload a valid .docx file.'
        })

    # ── Parse ─────────────────────────────────────────────────────────────────
    try:
        header, questions = _parse_docx(uploaded.read())
    except Exception as e:
        return render(request, 'teacher/upload_docx.html', {
            'error': f'Could not read file: {e}'
        })

    if not questions:
        return render(request, 'teacher/upload_docx.html', {
            'error': 'No questions found. Make sure the file follows the expected format.'
        })

    # ── Resolve header objects ────────────────────────────────────────────────
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
        return render(request, 'teacher/upload_docx.html', {
            'error': f'Could not parse year "{year_str}".'
        })

    exam_series, _ = ExamSeries.objects.get_or_create(
        exam_board=exam_board,
        subject=subject,
        year=year,
        sitting=sitting,
    )

    # ── Insert questions ──────────────────────────────────────────────────────
    created_count  = 0
    skipped_count  = 0
    skipped_nums   = []
    errors         = []

    for q_data in questions:
        try:
            # Skip duplicates (unique_together: exam_series + question_number)
            if Question.objects.filter(
                exam_series=exam_series,
                question_number=q_data['number']
            ).exists():
                skipped_count += 1
                skipped_nums.append(q_data['number'])
                continue

            # Wrap in savepoint — if choices fail, the question row is rolled back too
            with transaction.atomic():
                question = Question.objects.create(
                    subject         = subject,
                    exam_series     = exam_series,
                    question_number = q_data['number'],
                    question_type   = 'OBJ' if q_data['choices'] else 'THEORY',
                    content         = q_data['content'],
                    marks           = 1,
                )

                # Attach image
                if q_data['image_bytes']:
                    ext      = q_data['image_ext'] or 'png'
                    filename = f"q_{subject.name.lower()}_{year}_{q_data['number']}.{ext}"
                    question.image.save(filename, ContentFile(q_data['image_bytes']), save=True)

                # Deduplicate choices before inserting (parser bug safety net)
                seen_labels = set()
                for c in q_data['choices']:
                    if c['label'] in seen_labels:
                        continue
                    seen_labels.add(c['label'])
                    Choice.objects.create(
                        question    = question,
                        label       = c['label'],
                        choice_text = c['text'],
                        is_correct  = c['is_correct'],
                    )

                # Resolve and attach topics
                for topic_name in q_data['topics']:
                    topic_name = topic_name.strip()
                    if topic_name:
                        topic, _ = Topic.objects.get_or_create(
                            name__iexact=topic_name,
                            defaults={'name': topic_name, 'subject': subject}
                        )
                        question.topics.add(topic)

            created_count += 1

        except Exception as e:
            errors.append(f"Q{q_data['number']}: {e}")

    # ── Summary ───────────────────────────────────────────────────────────────
    context = {
        'success': True,
        'subject':        subject.name,
        'exam_board':     exam_board.name,
        'year':           year,
        'sitting':        sitting,
        'total_parsed':   len(questions),
        'created_count':  created_count,
        'skipped_count':  skipped_count,
        'skipped_nums':   skipped_nums,
        'errors':         errors,
    }
    return render(request, 'teacher/upload_docx.html', context)

@teacher_required
@feature_required('lesson_notes')
def lesson_notes(request):
    """
    Teacher lesson notes browser.

    GET  ?subject=<id>&topic=<id>  → filter notes
    POST { action:'generate_ai', topic_id:X } → generate AI note and return it
    POST { action:'accept_ai',   topic_id:X } → save AI note to DB
    """
    from catalog.models import Subject, Topic, LessonNote
    from catalog.feature_flags import is_feature_enabled

    # ── POST: AI generation actions ──────────────────────────────────────────
    if request.method == 'POST':
        import json
        data   = json.loads(request.body)
        action = data.get('action')

        if action == 'generate_ai':
            return _handle_ai_generate(request, data)

        if action == 'accept_ai':
            return _handle_ai_accept(request, data)

        return JsonResponse({'error': 'Unknown action'}, status=400)

    # ── GET: render page ─────────────────────────────────────────────────────
    all_subjects    = Subject.objects.all().order_by('name')
    covered_subjects = Subject.objects.filter(
        topics__isnull=False
    ).distinct().order_by('name')
    covered_ids     = set(covered_subjects.values_list('id', flat=True))

    selected_subject_id = request.GET.get('subject')
    selected_topic_id   = request.GET.get('topic')

    selected_subject = None
    topics           = []
    selected_topic   = None
    note             = None
    subject_covered  = True
    ai_enabled       = is_feature_enabled('ai_lesson_notes', user=request.user)

    if selected_subject_id:
        try:
            selected_subject = Subject.objects.get(id=selected_subject_id)
            subject_covered  = selected_subject.id in covered_ids

            if subject_covered:
                topics = Topic.objects.filter(
                    subject=selected_subject
                ).order_by('name')

        except Subject.DoesNotExist:
            pass

    if selected_topic_id and subject_covered:
        try:
            selected_topic = Topic.objects.get(
                id=selected_topic_id,
                subject=selected_subject
            )
            note = getattr(selected_topic, 'lesson_note', None)
        except Topic.DoesNotExist:
            pass

    context = {
        'all_subjects':      all_subjects,
        'covered_ids':       covered_ids,
        'selected_subject':  selected_subject,
        'subject_covered':   subject_covered,
        'topics':            topics,
        'selected_topic':    selected_topic,
        'note':              note,
        'ai_enabled':        ai_enabled,
    }
    return render(request, 'teacher/lesson_notes.html', context)


def _handle_ai_generate(request, data):
    """Call Anthropic API to generate lesson notes for a topic."""
    from catalog.models import Topic
    import anthropic   # pip install anthropic

    topic_id = data.get('topic_id')
    try:
        topic = Topic.objects.select_related('subject').get(id=topic_id)
    except Topic.DoesNotExist:
        return JsonResponse({'error': 'Topic not found'}, status=404)

    subject_name = topic.subject.name
    topic_name   = topic.name

    prompt = f"""You are an expert {topic.subject.name} educator writing a comprehensive lesson note for Nigerian secondary school students (WAEC/NECO level).

Write detailed lesson notes on:
Subject: {subject_name}
Topic: {topic_name}

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
        client   = anthropic.Anthropic()
        message  = client.messages.create(
            model      = "claude-opus-4-6",
            max_tokens = 4096,
            messages   = [{"role": "user", "content": prompt}]
        )
        ai_text = message.content[0].text
        return JsonResponse({'content': ai_text, 'topic_name': topic_name})
    except Exception as e:
        return JsonResponse({'error': f'AI generation failed: {e}'}, status=500)


def _handle_ai_accept(request, data):
    """Save accepted AI content as a LessonNote record."""
    from catalog.models import Topic, LessonNote

    topic_id   = data.get('topic_id')
    ai_content = data.get('content', '').strip()

    if not ai_content:
        return JsonResponse({'error': 'No content provided'}, status=400)

    try:
        topic = Topic.objects.select_related('subject').get(id=topic_id)
    except Topic.DoesNotExist:
        return JsonResponse({'error': 'Topic not found'}, status=404)

    note, created = LessonNote.objects.update_or_create(
        topic=topic,
        defaults={
            'title':            f"{topic.name} — Lesson Notes",
            'ai_content':       ai_content,
            'is_ai_generated':  True,
            'uploaded_by':      request.user,
            'description':      f"AI-generated notes for {topic.name}.",
        }
    )

    return JsonResponse({
        'success': True,
        'note_id': note.id,
        'message': 'Lesson note saved successfully.',
    })


@admin_required
def feature_flags_page(request):
    """Admin page to toggle feature flags."""
    from catalog.models import FeatureFlag
    flags = FeatureFlag.objects.all().order_by('label')
    return render(request, 'teacher/feature_flags.html', {'flags': flags})


@admin_required
def toggle_flag(request):
    """AJAX endpoint to toggle a single feature flag."""
    from catalog.models import FeatureFlag
    import json

    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    data    = json.loads(request.body)
    flag_id = data.get('flag_id')
    enabled = data.get('enabled', True)

    try:
        flag = FeatureFlag.objects.get(id=flag_id)
        flag.is_enabled = bool(enabled)
        flag.save(update_fields=['is_enabled', 'updated_at'])
        return JsonResponse({'success': True, 'key': flag.key, 'enabled': flag.is_enabled})
    except FeatureFlag.DoesNotExist:
        return JsonResponse({'error': 'Flag not found'}, status=404)
