from django.shortcuts import render, redirect
from django.core.mail import send_mail
from .models import CustomUser
from django.contrib.auth import login, logout
import random
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib import messages

def index(request):
    return render(request, 'Users/index.html')

def request_otp(request):
    if request.method == "POST":
        email = request.POST.get('email')
        user_exists = CustomUser.objects.filter(email=email).exists()
        otp = str(random.randint(100000, 999999))

        request.session['otp_code'] = otp
        request.session['otp_email'] = email
        request.session['otp_created'] = timezone.now().isoformat()

        send_mail(
        'Your Login Code', 
        f'Your OTP code is: {otp}\nExpires in 10 minutes', 
        'noreply@exam.com', 
        [email], fail_silently=False
        )
        messages.success(request, "OTP has been sent to your email.")
        return render(request, 'Users/verify_otp.html', {'email': email, 'new_user': not user_exists})
    return render(request, 'Users/login.html')

def verify_otp(request):
    email = request.session.get('otp_email')
    stored_otp = str(request.session.get('otp_code', '')).strip()

    # If session is empty, redirect back to login
    otp_created_str = request.session.get('otp_created')

    if not otp_created_str:
        messages.error(request, "OTP Failed")
        return redirect('Users:request_otp')

    otp_created = parse_datetime(otp_created_str)

    if not otp_created:
        messages.error(request, "Parsing Error, try agin later!")
        return redirect('Users:request_otp')

    if timezone.now() - otp_created > timedelta(minutes=10):
        for key in ['otp_code', 'otp_email', 'otp_created']:
            request.session.pop(key, None)
        messages.error(request, "OTP has expired!")
        return redirect('Users:request_otp')
    
    if request.method == "POST":
        otp_entered = str(request.POST.get('otp', '')).strip()


        if otp_entered == stored_otp and stored_otp != '':
            user = CustomUser.objects.filter(email=email).first()
            if not user:
                f_name=request.POST.get('first_name')
                l_name=request.POST.get('last_name')

                user = CustomUser.objects.create_user(
                email=email,first_name=f_name,
                last_name=l_name                
                )
            if user:
                login(request, user)
                # Delete only the OTP, don't flush the whole session!
                for key in ['otp_code', 'otp_email', 'otp_created']:
                    request.session.pop(key, None)
                messages.success(request, "Logged in successfully.")
                return redirect('Users:index')

        # If OTP is wrong, we MUST send 'email' and 'new_user' back to the template
        user_exists = CustomUser.objects.filter(email=email).exists()
        return render(request, 'Users/verify_otp.html', {
        'email': email,
        'new_user': not user_exists
        })
    
def logout_view(request):
    logout(request)
    return redirect('Users:index')