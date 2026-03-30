import hashlib
import hmac
import json

import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from catalog.models import SubscriptionPlan, UserSubscription

PAYSTACK_SECRET = settings.PAYSTACK_SECRET_KEY
PAYSTACK_BASE   = 'https://api.paystack.co'


# ── STEP 1: Initialize payment ────────────────────────────────────────────────
@login_required
def initialize_payment(request):
    """
    POST { plan_id: <int> }
    Calls Paystack /transaction/initialize and redirects user to the
    Paystack-hosted checkout page.
    """
    if request.method != 'POST':
        return redirect('Users:pricing')

    plan_id = request.POST.get('plan_id')
    try:
        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return redirect('Users:pricing')

    # Amount in kobo (Paystack requires smallest currency unit)
    amount_kobo = int(plan.price * 100)

    # Build callback URL — Paystack redirects here after payment
    callback_url = request.build_absolute_uri('/payments/callback/')

    payload = {
        'email':        request.user.email,
        'amount':       amount_kobo,
        'currency':     'NGN',
        'callback_url': callback_url,
        'metadata': {
            'user_id': request.user.id,
            'plan_id': plan.id,
            'plan_type': plan.plan_type,
            'duration': plan.duration,
        },
    }

    response = requests.post(
        f'{PAYSTACK_BASE}/transaction/initialize',
        headers={
            'Authorization': f'Bearer {PAYSTACK_SECRET}',
            'Content-Type':  'application/json',
        },
        json=payload,
        timeout=15,
    )
    data = response.json()

    if data.get('status'):
        # Redirect user to Paystack-hosted payment page
        return redirect(data['data']['authorization_url'])

    # Something went wrong
    return render(request, 'Users/pricing.html', {
        'error': 'Could not initialize payment. Please try again.',
        'default_tab': 'student',
    })


# ── STEP 2: Callback (user returns from Paystack) ─────────────────────────────
@login_required
def payment_callback(request):
    """
    Paystack redirects here with ?reference=xxx after the user pays.
    We verify the transaction and activate the subscription.
    """
    reference = request.GET.get('reference')
    if not reference:
        return redirect('Users:pricing')

    # Verify with Paystack
    response = requests.get(
        f'{PAYSTACK_BASE}/transaction/verify/{reference}',
        headers={'Authorization': f'Bearer {PAYSTACK_SECRET}'},
        timeout=15,
    )
    data = response.json()

    if not data.get('status') or data['data']['status'] != 'success':
        return render(request, 'payments/payment_failed.html', {
            'reason': data.get('message', 'Payment was not successful.')
        })

    tx       = data['data']
    metadata = tx.get('metadata', {})
    plan_id  = metadata.get('plan_id')

    try:
        plan = SubscriptionPlan.objects.get(id=plan_id)
    except SubscriptionPlan.DoesNotExist:
        return redirect('Users:dashboard')

    _activate_subscription(
        user      = request.user,
        plan      = plan,
        reference = reference,
        amount    = tx['amount'] / 100,   # convert kobo → naira
    )

    return render(request, 'payments/payment_success.html', {
        'plan': plan,
        'user': request.user,
    })


# ── STEP 3: Webhook (server-to-server confirmation) ───────────────────────────
@csrf_exempt
@require_POST
def paystack_webhook(request):
    """
    Paystack calls this endpoint directly to confirm events.
    Used as a reliable backup to the callback (e.g. if user closes browser).
    Webhook URL to set in Paystack dashboard:
        https://yourdomain.com/payments/webhook/
    """
    # Verify the request is genuinely from Paystack
    paystack_signature = request.headers.get('X-Paystack-Signature', '')
    computed = hmac.new(
        PAYSTACK_SECRET.encode('utf-8'),
        request.body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(computed, paystack_signature):
        return HttpResponse(status=401)

    payload = json.loads(request.body)
    event   = payload.get('event')

    if event == 'charge.success':
        tx       = payload['data']
        metadata = tx.get('metadata', {})
        user_id  = metadata.get('user_id')
        plan_id  = metadata.get('plan_id')

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(id=user_id)
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except (User.DoesNotExist, SubscriptionPlan.DoesNotExist):
            return HttpResponse(status=200)   # acknowledge but skip

        # Only activate if not already active (webhook may fire twice)
        if not UserSubscription.objects.filter(
    user=user, 
    paystack_reference=tx['reference'], status='ACTIVE'
    ).exists():
            
            _activate_subscription(
                user      = user,
                plan      = plan,
                reference = tx['reference'],
                amount    = tx['amount'] / 100,
            )

    # Always return 200 — Paystack retries if it doesn't get a 200
    return HttpResponse(status=200)


# ── SHARED HELPER ─────────────────────────────────────────────────────────────
def _activate_subscription(user, plan, reference, amount):
    from dateutil.relativedelta import relativedelta

    # Deactivate current subscription if any
    UserSubscription.objects.filter(user=user, status='ACTIVE').update(status='EXPIRED')

    # Calculate end date based on plan duration
    now = timezone.now()
    if plan.duration == 'MONTHLY':
        expires_at = now + relativedelta(months=1)
    elif plan.duration == 'YEARLY':
        expires_at = now + relativedelta(years=1)
    else:
        expires_at = now + relativedelta(months=1)

    UserSubscription.objects.create(
        user               = user,
        plan               = plan,
        status             = 'ACTIVE',
        started_at         = now,
        expires_at         = expires_at,
        paystack_reference = reference,
        amount_paid        = amount,
    )