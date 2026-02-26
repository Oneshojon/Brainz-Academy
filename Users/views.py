from django.shortcuts import render, redirect
from django.core.mail import send_mail
from .models import CustomUser
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
    if request.method == "POST":
        email = request.POST.get('email')
        user_exists = CustomUser.objects.filter(email=email).exists()

        # Cryptographically secure OTP
        otp = str(secrets.randbelow(900000) + 100000)

        # Store hashed OTP in session, never plain text
        otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        request.session['otp_code'] = otp_hash
        request.session['otp_email'] = email
        request.session['otp_created'] = timezone.now().isoformat()
        request.session['otp_attempts'] = 0  # reset attempt counter on fresh OTP

        send_mail(
            'Your Login Code',
            f'Your OTP code is: {otp}\nExpires in 10 minutes.',
            'noreply@exam.com',
            [email],
            fail_silently=False
        )

        messages.success(request, "OTP has been sent to your email.")
        return render(request, 'Users/verify_otp.html', {
            'email': email,
            'new_user': not user_exists
        })

    return render(request, 'Users/login.html')


def verify_otp(request):
    email = request.session.get('otp_email')
    stored_otp = request.session.get('otp_code', '')
    otp_created_str = request.session.get('otp_created')

    # Guard: session data must be present
    if not otp_created_str or not stored_otp or not email:
        messages.error(request, "Session expired or invalid. Please request a new OTP.")
        return redirect('Users:request_otp')

    otp_created = parse_datetime(otp_created_str)

    if not otp_created:
        messages.error(request, "Parsing error, please try again.")
        return redirect('Users:request_otp')

    # Guard: OTP must not be expired
    if timezone.now() - otp_created > timedelta(minutes=10):
        for key in ['otp_code', 'otp_email', 'otp_created', 'otp_attempts']:
            request.session.pop(key, None)
        messages.error(request, "OTP has expired. Please request a new one.")
        return redirect('Users:request_otp')

    # Guard: brute force protection
    attempts = request.session.get('otp_attempts', 0)
    if attempts >= 3:
        for key in ['otp_code', 'otp_email', 'otp_created', 'otp_attempts']:
            request.session.pop(key, None)
        messages.error(request, "Too many failed attempts. Please request a new OTP.")
        return redirect('Users:request_otp')

    if request.method == "POST":
        otp_entered = str(request.POST.get('otp', '')).strip()
        entered_hash = hashlib.sha256(otp_entered.encode()).hexdigest()

        if entered_hash == stored_otp:
            user = CustomUser.objects.filter(email=email).first()

            if not user:
                role = request.POST.get('role', 'STUDENT')

                # Validate it to prevent arbitrary values being passed in
                if role not in ['STUDENT', 'TEACHER']:
                    role = 'STUDENT'

                user = CustomUser.objects.create_user(
                    email=email,
                    first_name=request.POST.get('first_name', ''),
                    last_name=request.POST.get('last_name', ''),
                    role=role
                )

            # Clear OTP session data before logging in
            for key in ['otp_code', 'otp_email', 'otp_created', 'otp_attempts']:
                request.session.pop(key, None)

            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            messages.success(request, "Logged in successfully.")
            return redirect('Users:dashboard')

        else:
            request.session['otp_attempts'] = attempts + 1
            remaining = 3 - (attempts + 1)
            if remaining > 0:
                messages.error(request, f"Invalid OTP. {remaining} attempt(s) remaining.")
            else:
                messages.error(request, "Too many failed attempts. Please request a new OTP.")
            # Fall through to re-render the form

    user_exists = CustomUser.objects.filter(email=email).exists()
    return render(request, 'Users/verify_otp.html', {
        'email': email,
        'new_user': not user_exists
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