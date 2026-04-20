from django.shortcuts import render, redirect, get_object_or_404
from django.core.mail import send_mail
from .models import CustomUser
import uuid
import random
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from datetime import timedelta
import hashlib
import secrets
from practice.models import PracticeSession
from catalog.cache_utils import get_subjects_for_board
from catalog.models import ExamBoard, ExamSeries

def index(request):
    return render(request, 'Users/index.html')

BOARD_SLUGS = {
    'waec-past-questions': 'WAEC',
    'neco-past-questions': 'NECO',
    'jamb-past-questions': 'JAMB',
    'waec-cbt-practice':   'WAEC',
    'jamb-cbt-practice':   'JAMB',
}

def exam_board_landing(request, board_slug):
    from django.http import Http404
    abbreviation = BOARD_SLUGS.get(board_slug)
    if not abbreviation:
        raise Http404

    board    = get_object_or_404(ExamBoard, abbreviation=abbreviation)
    subjects = get_subjects_for_board(board.id)

    years = (
        ExamSeries.objects
        .filter(exam_board=board)
        .values_list('year', flat=True)
        .order_by('year')
        .distinct()
    )
    year_range = f"{years.first()}–{years.last()}" if years.exists() else ''

    return render(request, 'Users/exam_board_landing.html', {
        'board':       board,
        'board_slug':  board_slug,
        'subjects':    subjects,
        'year_range':  year_range,
        'is_practice': 'practice' in board_slug or 'cbt' in board_slug,
    })

def test_builder_landing(request):
    from catalog.cache_utils import get_boards_with_question_counts
    boards = get_boards_with_question_counts()
    return render(request, 'Users/test_builder_landing.html', {'boards': boards})

def request_otp(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip().lower()
        ref = request.POST.get('ref', '').strip() 

        if not email:
            return render(request, 'Users/login.html', {'error': 'Please enter your email address.'})

        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(email)
        except ValidationError:
            return render(request, 'Users/login.html', {'error': 'Please enter a valid email address.'})

        # Generate and store OTP
        otp = str(random.randint(100000, 999999))
        request.session['otp'] = otp
        request.session['otp_email'] = email
        request.session['otp_created_at'] = timezone.now().isoformat()
        if ref:
            request.session['ref_code'] = ref

        # Send OTP email
        from django.core.mail import send_mail
        from django.core.mail import EmailMultiAlternatives

        msg = EmailMultiAlternatives(
            subject='BrainzAcademy Login Code',
            body=f'Your login code is: {otp}\n\nThis code expires in 10 minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        msg.attach_alternative(
            f'<p>Your BrainzAcademy login code is: <strong>{otp}</strong></p><p>This code expires in 10 minutes.</p>',
            "text/html"
        )
        msg.send(fail_silently=False)

        return redirect('Users:verify_otp')

    # GET - check for ?ref= in URL
    ref = request.GET.get('ref', '')
    return render(request, 'Users/login.html', {'ref': ref})


def verify_otp(request):
    email = request.session.get('otp_email')
    if not email:
        return redirect('Users:request_otp')

    ref_code = request.session.get('ref_code', '')

    if request.method == 'POST':
        entered_otp = request.POST.get('otp', '').strip()
        stored_otp = request.session.get('otp')

        # Check expiry (10 minutes)
        created_at_str = request.session.get('otp_created_at')
        if created_at_str:
            from datetime import timedelta
            created_at = timezone.datetime.fromisoformat(created_at_str)
            if timezone.now() > created_at + timedelta(minutes=10):
                return render(request, 'Users/verify_otp.html', {
                    'email': email, 'ref_code': ref_code,
                    'error': 'Your code has expired. Please request a new one.',
                })

        if entered_otp != stored_otp:
            # Check if this is a new user form submit
            user_exists = CustomUser.objects.filter(email=email).exists()
            return render(request, 'Users/verify_otp.html', {
                'email': email,
                'new_user': not user_exists,
                'ref_code': ref_code,
                'error': 'Invalid code. Please try again.',
            })

        # OTP correct — get or create user
        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={}
        )

        if created:
            # New user — collect registration details
            first_name = request.POST.get('first_name', '').strip()
            last_name = request.POST.get('last_name', '').strip()
            role = request.POST.get('role', 'STUDENT')

            if not first_name or not last_name:
                return render(request, 'Users/verify_otp.html', {
                    'email': email, 'new_user': True, 'ref_code': ref_code,
                    'error': 'Please enter your first and last name.',
                })

            if role not in ('STUDENT', 'TEACHER'):
                role = 'STUDENT'

            user.first_name = first_name
            user.last_name = last_name
            user.role = role

            gender = request.POST.get('gender', '').strip()
            if gender in ('M', 'F', 'O', 'N'):
                user.gender = gender

            # Generate referral code for new user
            user.referral_code = str(uuid.uuid4())[:8].upper()

            # Handle referral — who referred this user?
            ref = request.POST.get('ref', '').strip() or ref_code
            if ref:
                try:
                    referrer = CustomUser.objects.get(referral_code=ref)
                    if referrer != user:
                        user.referred_by = referrer
                        # Create Referral record
                        from Users.models import Referral
                        Referral.objects.get_or_create(referrer=referrer, referred=user)
                except CustomUser.DoesNotExist:
                    pass

            user.save()

        # Clear OTP session data
        for key in ('otp', 'otp_email', 'otp_created_at', 'ref_code'):
            request.session.pop(key, None)

        login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        # Redirect based on role
        if user.role == 'TEACHER':
            return redirect('teacher:dashboard')
        return redirect('Users:dashboard')

    # GET — check if new or existing user
    user_exists = CustomUser.objects.filter(email=email).exists()
    return render(request, 'Users/verify_otp.html', {
        'email': email,
        'new_user': not user_exists,
        'ref_code': ref_code,
    })




@login_required
def referrals(request):
    """
    Student referral page — shows all referrals made by this user,
    their shareable link, and the leaderboard if admin has enabled it.
    """
    from Users.models import Referral
    from catalog.models import FeatureFlag
 
    user = request.user
 
    # Generate referral code if not set
    if not user.referral_code:
        user.referral_code = str(uuid.uuid4())[:8].upper()
        user.save(update_fields=['referral_code'])
 
    # All referrals made by this user
    my_referrals = (
        Referral.objects
        .filter(referrer=user)
        .select_related('referred')
        .order_by('-created_at')
    )
 
    # Shareable link
    referral_link = request.build_absolute_uri(f'/join/?ref={user.referral_code}')
 
    # Leaderboard — only shown if admin has enabled the flag
    show_leaderboard = FeatureFlag.objects.filter(
        key='referral_leaderboard', is_enabled=True
    ).exists()
 
    leaderboard = []
    if show_leaderboard:
        from django.db.models import Count
        leaderboard = (
            Referral.objects
            .values('referrer__id', 'referrer__first_name', 'referrer__email')
            .annotate(total=Count('id'))
            .order_by('-total')[:20]
        )
 
    context = {
        'my_referrals':    my_referrals,
        'referral_count':  my_referrals.count(),
        'referral_link':   referral_link,
        'show_leaderboard': show_leaderboard,
        'leaderboard':     leaderboard,
    }
    return render(request, 'Users/referrals.html', context)
 
 
# ── Update dashboard view to include referral data ────────────────────────────
# Replace the existing dashboard view with this:
 
@login_required
def dashboard(request):
    from Users.models import Referral
    from catalog.subscription_access import check_practice_access, check_test_builder_access
    from catalog.models import FreeTeacherTopicAccess

    user = request.user

    # Last 3 practice sessions
    recent_sessions = (
        PracticeSession.objects
        .filter(user=user, completed_at__isnull=False)
        .select_related('subject', 'exam_series')
        .order_by('-completed_at')[:3]
    )
    last_session = recent_sessions.first()

    # Access checks — drive banner and limit pills
    practice_access = check_practice_access(user)
    builder_access  = check_test_builder_access(user)
    slots_remaining = (
        FreeTeacherTopicAccess.slots_remaining(user)
        if user.role == 'TEACHER' else 0
    )

    # Referral data for dashboard widget (students only)
    referral_count   = 0
    recent_referrals = []
    referral_link    = ''

    if user.role == 'STUDENT':
        if not user.referral_code:
            user.referral_code = str(uuid.uuid4())[:8].upper()
            user.save(update_fields=['referral_code'])

        referral_count = Referral.objects.filter(referrer=user).count()
        recent_referrals = (
            Referral.objects
            .filter(referrer=user)
            .select_related('referred')
            .order_by('-created_at')[:3]
        )
        referral_link = request.build_absolute_uri(f'/join/?ref={user.referral_code}')

    context = {
        'user':             user,
        'recent_sessions':  recent_sessions,
        'last_session':     last_session,
        'practice_access':  practice_access,
        'builder_access':   builder_access,
        'slots_remaining':  slots_remaining,
        'referral_count':   referral_count,
        'recent_referrals': recent_referrals,
        'referral_link':    referral_link,
        'streak':           user.streak or 0,
    }
    return render(request, 'Users/dashboard.html', context)

def logout_view(request):
    logout(request)
    return redirect('Users:index')

def pricing(request):
    """
    Public pricing page. Pre-selects role tab based on logged-in user.
    Passes plan data from DB if available, otherwise falls back to hardcoded defaults.
    """
    from catalog.models import SubscriptionPlan
 
    # Determine default tab
    if request.user.is_authenticated:
        default_tab = 'teacher' if request.user.role == 'TEACHER' else 'student'
    else:
        default_tab = request.GET.get('tab', 'student')
 
    # Try to load plans from DB (seeded via _seed_plans())
    # Falls back to empty list if migrations haven't run yet
    try:
        student_plans = list(
            SubscriptionPlan.objects.filter(
                plan_type='STUDENT_BASIC', is_active=True
            ).order_by('price')
        )
        teacher_plans = list(
            SubscriptionPlan.objects.filter(
                plan_type='TEACHER_PRO', is_active=True
            ).order_by('price')
        )
    except Exception:
        student_plans = []
        teacher_plans = []
 
    context = {
        'default_tab':    default_tab,
        'student_plans':  student_plans,
        'teacher_plans':  teacher_plans,
    }
    return render(request, 'Users/pricing.html', context)