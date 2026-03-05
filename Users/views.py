from django.shortcuts import render, redirect
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

def index(request):
    return render(request, 'Users/index.html')


def request_otp(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip().lower()
        ref = request.POST.get('ref', '').strip()  # carry referral code forward

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
        send_mail(
            subject='Your ExamPrep Login Code',
            message=f'Your ExamPrep login code is: {otp}\n\nThis code expires in 10 minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

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
def dashboard(request):
    user = request.user
    
    # Last 3 practice sessions
    recent_sessions = PracticeSession.objects.filter(
        user=user, completed_at__isnull=False
    ).select_related('subject', 'exam_series').order_by('-completed_at')[:3]

    # Last completed session for score display
    last_session = recent_sessions.first()

    context = {
        'user': user,
        'recent_sessions': recent_sessions,
        'last_session': last_session,
    }
    return render(request, 'Users/dashboard.html', context)

def logout_view(request):
    logout(request)
    return redirect('Users:index')