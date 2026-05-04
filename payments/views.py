"""
payments/views.py

Paystack payment flow for BrainzAcademy.

All outbound Paystack calls go through services.payment_service — never
call requests or the Paystack API directly from here.

Flow
----
1. initialize_payment  — POST from pricing page; redirects to Paystack checkout
2. payment_callback    — Paystack redirects back; verify and activate subscription
3. paystack_webhook    — server-to-server backup confirmation from Paystack
"""

import json
import logging

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from catalog.models import SubscriptionPlan, UserSubscription
from services.payment_service import (
    PaystackError,
    PaystackUnavailableError,
    initialize_transaction,
    verify_transaction,
    verify_webhook_signature,
)

logger = logging.getLogger(__name__)


# ── STEP 1: Initialize payment ────────────────────────────────────────────────

@login_required
def initialize_payment(request):
    """
    POST { plan_id: <int> }
    Calls Paystack /transaction/initialize and redirects user to the
    Paystack-hosted checkout page.

    On circuit OPEN or timeout, renders pricing page with a clear message
    rather than raising an unhandled exception.
    """
    if request.method != 'POST':
        return redirect('Users:pricing')

    plan_id = request.POST.get('plan_id')
    try:
        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return redirect('Users:pricing')

    callback_url = request.build_absolute_uri('/payments/callback/')

    try:
        authorization_url = initialize_transaction(
            email        = request.user.email,
            amount_kobo  = int(plan.price * 100),
            callback_url = callback_url,
            metadata     = {
                'user_id':   request.user.id,
                'plan_id':   plan.id,
                'plan_type': plan.plan_type,
                'duration':  plan.duration,
            },
        )
        return redirect(authorization_url)

    except PaystackUnavailableError as exc:
        logger.warning(
            "Payment initialization unavailable for user %s: %s",
            request.user.id, exc,
        )
        return render(request, 'Users/pricing.html', {
            'error':       str(exc),
            'default_tab': 'teacher' if request.user.role == 'TEACHER' else 'student',
        })

    except PaystackError as exc:
        logger.error(
            "Payment initialization error for user %s: %s",
            request.user.id, exc,
        )
        return render(request, 'Users/pricing.html', {
            'error':       'Could not initialize payment. Please try again.',
            'default_tab': 'teacher' if request.user.role == 'TEACHER' else 'student',
        })


# ── STEP 2: Callback (user returns from Paystack) ─────────────────────────────

@login_required
def payment_callback(request):
    """
    Paystack redirects here with ?reference=xxx after the user completes payment.
    Verify the transaction and activate the subscription.

    On circuit OPEN, show a holding page — the webhook will activate the
    subscription server-to-server as a reliable backup.
    """
    reference = request.GET.get('reference')
    if not reference:
        return redirect('Users:pricing')

    try:
        tx = verify_transaction(reference)

    except PaystackUnavailableError as exc:
        # Paystack circuit is OPEN — the webhook backup will activate the
        # subscription. Reassure the user rather than showing an error.
        logger.warning(
            "Payment callback verification unavailable for ref %s: %s",
            reference, exc,
        )
        return render(request, 'payments/payment_pending.html', {
            'message': (
                'Your payment was received but we could not confirm it immediately. '
                'Your subscription will be activated within a few minutes. '
                'If it is not active after 10 minutes, please contact support.'
            ),
        })

    except PaystackError as exc:
        logger.error(
            "Payment callback verification failed for ref %s: %s",
            reference, exc,
        )
        return render(request, 'payments/payment_failed.html', {
            'reason': str(exc),
        })

    # Payment verified — extract plan and activate
    metadata = tx.get('metadata', {})
    plan_id  = metadata.get('plan_id')

    try:
        plan = SubscriptionPlan.objects.get(id=plan_id)
    except SubscriptionPlan.DoesNotExist:
        logger.error("Plan %s not found after successful payment ref %s", plan_id, reference)
        return redirect('Users:dashboard')

    _activate_subscription(
        user      = request.user,
        plan      = plan,
        reference = reference,
        amount    = tx['amount'] / 100,
    )

    # Send confirmation email (best-effort — non-critical)
    from services.email_service import send_subscription_confirmation
    from dateutil.relativedelta import relativedelta

    expiry = timezone.now() + (
        relativedelta(years=1) if plan.duration == 'YEARLY'
        else relativedelta(months=1)
    )
    send_subscription_confirmation(
        to_email   = request.user.email,
        user_name  = request.user.first_name or request.user.email,
        plan_name  = plan.name if hasattr(plan, 'name') else plan.plan_type,
        expiry_date= expiry.strftime('%d %B %Y'),
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
    Reliable backup to the callback — fires even if user closes their browser.

    Webhook URL to configure in Paystack dashboard:
        https://brainzacademy.com/payments/webhook/

    Note: webhook receives Paystack's server call — no outbound API call needed,
    so no circuit breaker is applied here.
    """
    paystack_signature = request.headers.get('X-Paystack-Signature', '')

    if not verify_webhook_signature(request.body, paystack_signature):
        logger.warning("Paystack webhook received with invalid signature.")
        return HttpResponse(status=401)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponse(status=400)

    event = payload.get('event')

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
            logger.error(
                "Webhook charge.success: user %s or plan %s not found.",
                user_id, plan_id,
            )
            return HttpResponse(status=200)

        # Idempotency guard — webhook may fire more than once
        already_active = UserSubscription.objects.filter(
            user                = user,
            paystack_reference  = tx['reference'],
            status              = 'ACTIVE',
        ).exists()

        if not already_active:
            _activate_subscription(
                user      = user,
                plan      = plan,
                reference = tx['reference'],
                amount    = tx['amount'] / 100,
            )
            logger.info(
                "Subscription activated via webhook for user %s, ref %s.",
                user_id, tx['reference'],
            )

    # Always return 200 — Paystack retries on non-200
    return HttpResponse(status=200)


# ── Shared helper ─────────────────────────────────────────────────────────────

def _activate_subscription(user, plan, reference: str, amount: float) -> None:
    """
    Deactivate any current subscription and create a new ACTIVE one.
    Pure DB logic — no external calls.
    """
    from dateutil.relativedelta import relativedelta

    # Expire existing active subscription
    UserSubscription.objects.filter(user=user, status='ACTIVE').update(status='EXPIRED')

    now = timezone.now()
    if plan.duration == 'YEARLY':
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
    logger.info(
        "Subscription created: user=%s plan=%s expires=%s ref=%s",
        user.id, plan.id, expires_at.date(), reference,
    )