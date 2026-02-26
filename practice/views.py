from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Avg, Count, Q
from django.contrib.auth import get_user_model
import json
import random
import string

from catalog.models import Subject, ExamBoard, ExamSeries, Question, Topic
from .models import PracticeSession, UserAnswer, Bookmark
from .models import PracticeSession

User = get_user_model()
# --- SESSIONS----




# ── HELPERS ──────────────────────────────────────────────────────────────────


def student_required(view_func):
    """Decorator: user must be logged in. Teachers can also access student pages."""
    @login_required
    def wrapper(request, *args, **kwargs):
        return view_func(request, *args, **kwargs)
    return wrapper


def update_streak(user):
    """Update the user's daily practice streak."""
    today = timezone.now().date()
    if user.last_practice_date is None:
        user.streak = 1
    elif user.last_practice_date == today:
        pass  # already practiced today, no change
    elif (today - user.last_practice_date).days == 1:
        user.streak += 1  # consecutive day
    else:
        user.streak = 1  # streak broken
    user.last_practice_date = today
    user.save(update_fields=['streak', 'last_practice_date'])


# ── PRACTICE HOME ─────────────────────────────────────────────────────────────

@student_required
def practice_home(request):
    """Exam/session selection page."""
    subjects = Subject.objects.all().order_by('name')
    exam_boards = ExamBoard.objects.all().order_by('name')

    context = {
        'subjects': subjects,
        'exam_boards': exam_boards,
    }
    return render(request, 'practice/practice_home.html', context)


# ── START SESSION ─────────────────────────────────────────────────────────────

@student_required
def start_session(request):
    """POST: create a PracticeSession and redirect to exam page."""
    if request.method != 'POST':
        return redirect('practice:practice_home')

    subject_id = request.POST.get('subject')
    exam_board_id = request.POST.get('exam_board')
    year = request.POST.get('year')
    sitting = request.POST.get('sitting')
    question_type = request.POST.get('question_type')  # OBJ, THEORY, or ''
    session_type = request.POST.get('session_type', 'EXAM')  # EXAM, TOPIC, CUSTOM
    topic_ids = request.POST.getlist('topics')
    num_questions = int(request.POST.get('num_questions', 40))

    # Build question queryset
    qs = Question.objects.all()

    if subject_id:
        qs = qs.filter(subject_id=subject_id)
    if question_type:
        qs = qs.filter(question_type=question_type)
    if topic_ids:
        qs = qs.filter(topics__id__in=topic_ids).distinct()

    # Filter by exam series
    if exam_board_id or year or sitting:
        series_qs = ExamSeries.objects.all()
        if exam_board_id:
            series_qs = series_qs.filter(exam_board_id=exam_board_id)
        if year:
            series_qs = series_qs.filter(year=year)
        if sitting:
            series_qs = series_qs.filter(sitting=sitting)
        if subject_id:
            series_qs = series_qs.filter(subject_id=subject_id)
        qs = qs.filter(exam_series__in=series_qs)

    questions = list(qs[:num_questions])

    if not questions:
        return render(request, 'practice/practice_home.html', {
            'subjects': Subject.objects.all(),
            'exam_boards': ExamBoard.objects.all(),
            'error': 'No questions found for your selection. Please try different filters.',
        })

    # Resolve related objects
    subject = Subject.objects.filter(id=subject_id).first() if subject_id else None
    exam_series = None
    if exam_board_id and year:
        exam_series = ExamSeries.objects.filter(
            exam_board_id=exam_board_id, subject_id=subject_id, year=year
        ).first()

    # Create session
    session = PracticeSession.objects.create(
        user=request.user,
        session_type=session_type,
        subject=subject,
        exam_series=exam_series,
        total_marks=sum(q.marks for q in questions),
    )

    # Store question IDs in session (Django session, not DB)
    request.session[f'session_{session.id}_questions'] = [q.id for q in questions]

    return redirect('practice:exam_page', session_id=session.id)


# ── EXAM PAGE ─────────────────────────────────────────────────────────────────

@student_required
def exam_page(request, session_id):
    """CBT exam page."""
    session = get_object_or_404(PracticeSession, id=session_id, user=request.user)

    if session.is_completed:
        return redirect('practice:results_page', session_id=session.id)

    # Get question IDs from Django session
    question_ids = request.session.get(f'session_{session.id}_questions', [])

    if not question_ids:
        # Fallback: reload from UserAnswers already saved or redirect home
        return redirect('practice:practice_home')

    questions = list(
        Question.objects.filter(id__in=question_ids)
        .prefetch_related('choices', 'topics')
        .order_by('question_number')
    )

    # Sort by original order
    id_order = {qid: idx for idx, qid in enumerate(question_ids)}
    questions.sort(key=lambda q: id_order.get(q.id, 0))

    # Get already answered questions
    answered = UserAnswer.objects.filter(session=session).values_list('question_id', flat=True)
    answered_ids = set(answered)

    # Build question status list for the grid
    question_status = []
    for q in questions:
        if q.id in answered_ids:
            status = 'answered'
        else:
            status = 'unanswered'
        question_status.append({'id': q.id, 'number': q.question_number, 'status': status})

    context = {
        'session': session,
        'questions': questions,
        'question_status': question_status,
        'answered_count': len(answered_ids),
        'total_count': len(questions),
    }
    return render(request, 'practice/exam_page.html', context)


# ── SUBMIT ANSWER (AJAX) ──────────────────────────────────────────────────────

@student_required
def submit_answer(request):
    """POST (AJAX): save a single answer during an exam."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    session_id = data.get('session_id')
    question_id = data.get('question_id')
    choice_id = data.get('choice_id')  # for OBJ
    theory_response = data.get('theory_response')  # for THEORY

    session = get_object_or_404(PracticeSession, id=session_id, user=request.user)
    question = get_object_or_404(Question, id=question_id)

    if session.is_completed:
        return JsonResponse({'error': 'Session already completed'}, status=400)

    # Determine correctness for OBJ
    is_correct = None
    selected_choice = None

    if question.question_type == 'OBJ' and choice_id:
        from catalog.models import Choice
        selected_choice = get_object_or_404(Choice, id=choice_id, question=question)
        is_correct = selected_choice.is_correct

    # Save or update answer
    answer, created = UserAnswer.objects.update_or_create(
        session=session,
        question=question,
        defaults={
            'selected_choice': selected_choice,
            'theory_response': theory_response,
            'is_correct': is_correct,
        }
    )

    # Count answered questions
    answered_count = UserAnswer.objects.filter(session=session).count()
    total_count = len(request.session.get(f'session_{session.id}_questions', []))

    return JsonResponse({
        'success': True,
        'is_correct': is_correct,
        'answered_count': answered_count,
        'total_count': total_count,
    })


# ── FINISH SESSION ────────────────────────────────────────────────────────────

@student_required
def finish_session(request, session_id):
    """POST: mark session complete and calculate score."""
    if request.method != 'POST':
        return redirect('practice:exam_page', session_id=session_id)

    session = get_object_or_404(PracticeSession, id=session_id, user=request.user)

    if not session.is_completed:
        # Calculate score from correct OBJ answers
        correct_answers = UserAnswer.objects.filter(
            session=session, is_correct=True
        ).select_related('question')

        score = sum(a.question.marks for a in correct_answers)
        session.score = score
        session.completed_at = timezone.now()
        session.save()

        # Update streak
        update_streak(request.user)

        # Clean up Django session data
        request.session.pop(f'session_{session.id}_questions', None)

    return redirect('practice:results_page', session_id=session.id)


# ── RESULTS PAGE ──────────────────────────────────────────────────────────────

@student_required
def results_page(request, session_id):
    """Show results and answer review after a session."""
    session = get_object_or_404(PracticeSession, id=session_id, user=request.user)

    answers = UserAnswer.objects.filter(session=session).select_related(
        'question', 'selected_choice', 'question__theory_answer'
    ).prefetch_related('question__choices', 'question__topics')

    # Get user's bookmarks for these questions
    question_ids = [a.question_id for a in answers]
    bookmarked_ids = set(
        Bookmark.objects.filter(user=request.user, question_id__in=question_ids)
        .values_list('question_id', flat=True)
    )

    # Build answer review data
    answer_review = []
    for answer in answers:
        answer_review.append({
            'answer': answer,
            'question': answer.question,
            'is_bookmarked': answer.question_id in bookmarked_ids,
            'correct_choice': answer.question.choices.filter(is_correct=True).first() if answer.question.question_type == 'OBJ' else None,
        })

    context = {
        'session': session,
        'answer_review': answer_review,
        'correct_count': sum(1 for a in answers if a.is_correct),
        'incorrect_count': sum(1 for a in answers if a.is_correct is False),
        'unanswered_count': sum(1 for a in answers if a.is_correct is None and not a.theory_response),
    }
    return render(request, 'practice/results_page.html', context)


# ── HISTORY ───────────────────────────────────────────────────────────────────

@student_required
def history(request):
    """All past practice sessions."""
    sessions = PracticeSession.objects.filter(
        user=request.user, completed_at__isnull=False
    ).select_related('subject', 'exam_series').order_by('-completed_at')

    context = {'sessions': sessions}
    return render(request, 'practice/history.html', context)


# ── ANALYTICS ─────────────────────────────────────────────────────────────────

@student_required
def analytics(request):
    """Performance charts and weak topics."""
    user = request.user

    # Scores per subject
    subject_stats = PracticeSession.objects.filter(
        user=user, completed_at__isnull=False, score__isnull=False
    ).values('subject__name').annotate(
        avg_score=Avg('score'),
        session_count=Count('id')
    ).order_by('subject__name')

    # Weak topics: topics where user gets more wrong than right
    wrong_answers = UserAnswer.objects.filter(
        session__user=user, is_correct=False
    ).values('question__topics__name').annotate(
        wrong_count=Count('id')
    ).order_by('-wrong_count')[:8]

    # Recent scores for chart (last 10 completed sessions)
    recent_sessions = PracticeSession.objects.filter(
        user=user, completed_at__isnull=False, score__isnull=False
    ).select_related('subject').order_by('-completed_at')[:10]

    # Overall stats
    total_sessions = PracticeSession.objects.filter(user=user, completed_at__isnull=False).count()
    total_questions_attempted = UserAnswer.objects.filter(session__user=user).count()
    overall_accuracy = UserAnswer.objects.filter(
        session__user=user, is_correct__isnull=False
    ).aggregate(
        correct=Count('id', filter=Q(is_correct=True)),
        total=Count('id')
    )
    accuracy_pct = None
    if overall_accuracy['total']:
        accuracy_pct = round((overall_accuracy['correct'] / overall_accuracy['total']) * 100, 1)

    context = {
        'subject_stats': list(subject_stats),
        'weak_topics': list(wrong_answers),
        'recent_sessions': list(recent_sessions),
        'total_sessions': total_sessions,
        'total_questions_attempted': total_questions_attempted,
        'accuracy_pct': accuracy_pct,
        'streak': user.streak,
    }
    return render(request, 'practice/analytics.html', context)


# ── LEADERBOARD ───────────────────────────────────────────────────────────────

@student_required
def leaderboard(request):
    """Rankings by subject."""
    subject_id = request.GET.get('subject')
    subjects = Subject.objects.all().order_by('name')

    rankings = []
    selected_subject = None

    if subject_id:
        selected_subject = get_object_or_404(Subject, id=subject_id)
        rankings = PracticeSession.objects.filter(
            subject_id=subject_id,
            completed_at__isnull=False,
            score__isnull=False,
            total_marks__isnull=False,
        ).values(
            'user__first_name', 'user__last_name', 'user__email'
        ).annotate(
            best_score=Avg('score'),
            sessions=Count('id')
        ).order_by('-best_score')[:20]

    context = {
        'subjects': subjects,
        'selected_subject': selected_subject,
        'rankings': rankings,
    }
    return render(request, 'practice/leaderboard.html', context)


# ── BOOKMARKS ─────────────────────────────────────────────────────────────────

@student_required
def bookmarks(request):
    """Saved questions."""
    user_bookmarks = Bookmark.objects.filter(
        user=request.user
    ).select_related(
        'question', 'question__subject'
    ).prefetch_related(
        'question__choices', 'question__topics'
    ).order_by('-created_at')

    # Group by subject
    grouped = {}
    for bm in user_bookmarks:
        subject_name = bm.question.subject.name
        if subject_name not in grouped:
            grouped[subject_name] = []
        grouped[subject_name].append(bm)

    context = {'grouped_bookmarks': grouped}
    return render(request, 'practice/bookmarks.html', context)


# ── TOGGLE BOOKMARK (AJAX) ────────────────────────────────────────────────────

@student_required
def toggle_bookmark(request):
    """POST (AJAX): add or remove a bookmark."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    question_id = data.get('question_id')
    question = get_object_or_404(Question, id=question_id)

    bookmark, created = Bookmark.objects.get_or_create(
        user=request.user, question=question
    )

    if not created:
        bookmark.delete()
        return JsonResponse({'bookmarked': False})

    return JsonResponse({'bookmarked': True})


# ── REVISION ──────────────────────────────────────────────────────────────────

@student_required
def revision(request):
    """Topic-wise revision mode — browse questions without timer."""
    subjects = Subject.objects.all().order_by('name')
    subject_id = request.GET.get('subject')
    topic_id = request.GET.get('topic')

    topics = []
    questions = []
    selected_subject = None
    selected_topic = None

    if subject_id:
        selected_subject = get_object_or_404(Subject, id=subject_id)
        topics = Topic.objects.filter(subject_id=subject_id).order_by('name')

    if topic_id:
        selected_topic = get_object_or_404(Topic, id=topic_id)
        questions = Question.objects.filter(
            topics=selected_topic
        ).prefetch_related('choices', 'topics').select_related('subject')

        # Mark bookmarked questions
        bookmarked_ids = set(
            Bookmark.objects.filter(
                user=request.user,
                question__in=questions
            ).values_list('question_id', flat=True)
        )
        questions = [
            {'question': q, 'is_bookmarked': q.id in bookmarked_ids}
            for q in questions
        ]

    context = {
        'subjects': subjects,
        'selected_subject': selected_subject,
        'topics': topics,
        'selected_topic': selected_topic,
        'questions': questions,
    }
    return render(request, 'practice/revision.html', context)


# ── REFERRAL ──────────────────────────────────────────────────────────────────

@student_required
def referral(request):
    """Generate and display referral link."""
    user = request.user

    if not user.referral_code:
        # Generate a unique referral code
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not User.objects.filter(referral_code=code).exists():
                break
        user.referral_code = code
        user.save(update_fields=['referral_code'])

    referral_link = request.build_absolute_uri(f'/register/?ref={user.referral_code}')
    referrals_made = User.objects.filter(referred_by=user).count()

    context = {
        'referral_link': referral_link,
        'referrals_made': referrals_made,
    }
    return render(request, 'practice/referral.html', context)

# ── MODELS (SESSIONS) ───────────────────────────────────────────────────
@student_required
def practice_home(request):
    recent_sessions = PracticeSession.objects.filter(
        user=request.user, completed_at__isnull=False
    ).select_related('subject', 'exam_series').order_by('-completed_at')[:4]

    return render(request, 'practice/practice_home.html', {
        'subjects': Subject.objects.all().order_by('name'),
        'exam_boards': ExamBoard.objects.all().order_by('name'),
        'recent_sessions': recent_sessions,
    })



def analytics(request):
    # ... existing code ...

    recent_sessions_json = json.dumps([
        {'score_pct': s.score_percentage, 'subject': str(s.subject)}
        for s in recent_sessions if s.score_percentage is not None
    ])
    subject_stats_json = json.dumps(list(subject_stats))

    context = {
        # ... existing context ...
        'recent_sessions_json': recent_sessions_json,
        'subject_stats_json': subject_stats_json,
    }