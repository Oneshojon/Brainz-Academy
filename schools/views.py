"""
schools/views.py

School Plan self-service registration + Paystack payment flow.

Registration requires an existing platform login — reuses the OTP flow
already in Users.views (request_otp / verify_otp). No separate auth path
is introduced here.

The payment flow deliberately mirrors payments/views.py step for step
(initialize -> callback -> webhook), using the same
services.payment_service helpers and the same PaystackUnavailableError /
PaystackError handling, so anyone already familiar with the individual
subscription flow recognizes this one immediately.
"""

import json
import logging

from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.feature_flags import is_feature_enabled
from services.payment_service import (
    PaystackError,
    PaystackUnavailableError,
    initialize_transaction,
    verify_transaction,
    verify_webhook_signature,
)

from .models import (
    AcademicTerm,
    ClassGroup,
    Cohort,
    School,
    SchoolInvite,
    SchoolPlan,
    SchoolStaff,
    SchoolSubscription,
)
from .permissions import IsSchoolAdmin
from .serializers import (
    AcademicTermSerializer,
    ClassGroupSerializer,
    CohortSerializer,
    SchoolInviteCreateSerializer,
    SchoolInviteRedeemSerializer,
    SchoolPlanSerializer,
    SchoolRegistrationSerializer,
    SchoolStaffSerializer,
)

logger = logging.getLogger(__name__)

FEATURE_FLAG_KEY = 'school_plan'


# ── Plan listing & registration (JSON API for the React registration page) ──

class SchoolPlanListView(APIView):
    """
    GET /schools/plans/
    Public list of active School Plans. Returns 404 while the school_plan
    feature flag is off, same convention used elsewhere for flag-gated
    functionality that isn't ready for general availability yet.

    permission_classes is set explicitly here — the project's DRF default
    is IsAuthenticated (see REST_FRAMEWORK in settings.py), but a pricing
    page has to be reachable by visitors who haven't logged in yet.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        if not is_feature_enabled(FEATURE_FLAG_KEY, user=request.user):
            return Response({'error': 'School Plan is not currently available.'}, status=404)

        plans = SchoolPlan.objects.filter(is_active=True).order_by('price')
        serializer = SchoolPlanSerializer(plans, many=True)
        return Response({'plans': serializer.data})


class SchoolRegisterView(APIView):
    """
    POST /schools/register/
    Body: { name, state, contact_email, plan_id }

    Requires an authenticated user (existing OTP login). Creates
    School(PENDING_PAYMENT) + SchoolStaff(ADMIN) + SchoolSubscription(PENDING)
    in one transaction, then hands back a Paystack checkout URL exactly
    like payments.initialize_payment does for individual subscriptions.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_feature_enabled(FEATURE_FLAG_KEY, user=request.user):
            return Response({'error': 'School Plan is not currently available.'}, status=404)

        serializer = SchoolRegistrationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        plan = serializer.validated_data['plan']

        with transaction.atomic():
            school = School.objects.create(
                name=serializer.validated_data['name'],
                state=serializer.validated_data['state'],
                contact_email=serializer.validated_data['contact_email'],
                status='PENDING_PAYMENT',
                created_by=request.user,
            )
            SchoolStaff.objects.create(user=request.user, school=school, school_role='ADMIN')
            subscription = SchoolSubscription.objects.create(school=school, plan=plan, status='PENDING')

        callback_url = request.build_absolute_uri('/schools/payments/callback/')

        try:
            authorization_url = initialize_transaction(
                email=request.user.email,
                amount_kobo=int(plan.price * 100),
                callback_url=callback_url,
                metadata={
                    'school_id': school.id,
                    'subscription_id': subscription.id,
                    'plan_id': plan.id,
                },
            )
        except PaystackUnavailableError as exc:
            logger.warning(
                "School payment initialization unavailable for school %s: %s", school.id, exc,
            )
            return Response({'error': str(exc)}, status=503)
        except PaystackError as exc:
            logger.error(
                "School payment initialization error for school %s: %s", school.id, exc,
            )
            return Response({'error': 'Could not initialize payment. Please try again.'}, status=502)

        return Response({'authorization_url': authorization_url, 'school_id': school.id}, status=201)


# ── Payment callback (browser redirect) & webhook (server-to-server) ────────

@login_required
def school_payment_callback(request):
    """
    GET /schools/payments/callback/?reference=xxx
    Paystack redirects the browser here after checkout. Mirrors
    payments.payment_callback's three-outcome handling exactly.
    """
    reference = request.GET.get('reference')
    if not reference:
        return render(request, 'schools/registration_failed.html', {
            'reason': 'Missing payment reference.',
        })

    try:
        tx = verify_transaction(reference)

    except PaystackUnavailableError as exc:
        # Circuit OPEN — reassure the user; the webhook is the reliable backup.
        logger.warning(
            "School payment callback verification unavailable for ref %s: %s", reference, exc,
        )
        return render(request, 'schools/registration_pending.html', {
            'message': (
                'Your payment was received but we could not confirm it immediately. '
                'Your school will be activated within a few minutes. '
                'If it is not active after 10 minutes, please contact support.'
            ),
        })

    except PaystackError as exc:
        logger.error(
            "School payment callback verification failed for ref %s: %s", reference, exc,
        )
        return render(request, 'schools/registration_failed.html', {'reason': str(exc)})

    metadata = tx.get('metadata', {})
    school_id = metadata.get('school_id')

    try:
        subscription = (
            SchoolSubscription.objects
            .select_related('school', 'plan')
            .get(school_id=school_id)
        )
    except SchoolSubscription.DoesNotExist:
        logger.error(
            "School subscription not found for school %s after successful payment ref %s",
            school_id, reference,
        )
        return render(request, 'schools/registration_failed.html', {
            'reason': 'We could not find your school record. Please contact support.',
        })

    _activate_school(subscription, reference)

    return render(request, 'schools/registration_success.html', {'school': subscription.school})


@csrf_exempt
@require_POST
def school_paystack_webhook(request):
    """
    POST /schools/payments/webhook/
    Server-to-server backup confirmation. Mirrors payments.paystack_webhook —
    no circuit breaker needed here since this is an inbound call, not one
    we're making.
    """
    paystack_signature = request.headers.get('X-Paystack-Signature', '')

    if not verify_webhook_signature(request.body, paystack_signature):
        logger.warning("School Paystack webhook received with invalid signature.")
        return HttpResponse(status=401)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponse(status=400)

    if payload.get('event') == 'charge.success':
        tx = payload['data']
        metadata = tx.get('metadata', {})
        school_id = metadata.get('school_id')

        try:
            subscription = (
                SchoolSubscription.objects.select_related('school').get(school_id=school_id)
            )
        except SchoolSubscription.DoesNotExist:
            logger.error("Webhook charge.success: school %s not found.", school_id)
            return HttpResponse(status=200)

        _activate_school(subscription, tx['reference'])
        logger.info("School %s activation confirmed via webhook, ref %s.", school_id, tx['reference'])

    # Always return 200 — Paystack retries on non-200.
    return HttpResponse(status=200)


# ── Shared helper ─────────────────────────────────────────────────────────────

def _activate_school(subscription, reference):
    """
    Activate a school's subscription and flip the school to ACTIVE.
    Idempotent — safe to call from both the callback and the webhook,
    whichever arrives first, without double-activating on the second call.
    """
    if subscription.is_active and subscription.paystack_reference == reference:
        return

    subscription.activate(reference=reference)
    subscription.school.status = 'ACTIVE'
    subscription.school.save(update_fields=['status', 'updated_at'])


# ══════════════════════════════════════════════════════════════════════════
# Admin-management views
#
# Every view below is gated by IsSchoolAdmin and every queryset is scoped
# to request.user.school_staff_profile.school — a school admin can only
# ever see or modify their own school's data. Serializer-level
# validate_<field> methods (see schools/serializers.py) back this up by
# rejecting cross-school FK references even if an admin guesses a valid
# ID belonging to another school.
# ══════════════════════════════════════════════════════════════════════════

# ── AcademicTerm ──────────────────────────────────────────────────────────

class AcademicTermListCreateView(generics.ListCreateAPIView):
    """
    GET  /schools/terms/    — list this admin's school's terms
    POST /schools/terms/    — create a term
    """

    serializer_class = AcademicTermSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = self.request.user.school_staff_profile.school
        return AcademicTerm.objects.filter(school=school).order_by('-year', 'term')

    def perform_create(self, serializer):
        school = self.request.user.school_staff_profile.school
        term = serializer.save(school=school)
        self._enforce_single_current_term(term)

    @staticmethod
    def _enforce_single_current_term(term):
        # Not a DB constraint by design (see AcademicTerm docstring — a
        # brief overlap during rollover is harmless) but the API should
        # still behave as "setting one current un-sets the others."
        if term.is_current:
            AcademicTerm.objects.filter(school=term.school).exclude(pk=term.pk).update(is_current=False)


class AcademicTermDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / PUT / DELETE /schools/terms/<id>/"""

    serializer_class = AcademicTermSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        return AcademicTerm.objects.filter(school=self.request.user.school_staff_profile.school)

    def perform_update(self, serializer):
        term = serializer.save()
        AcademicTermListCreateView._enforce_single_current_term(term)


# ── Cohort ────────────────────────────────────────────────────────────────

class CohortListCreateView(generics.ListCreateAPIView):
    """
    GET  /schools/cohorts/    — list this admin's school's cohorts
    POST /schools/cohorts/    — create a cohort
    """

    serializer_class = CohortSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = self.request.user.school_staff_profile.school
        return (
            Cohort.objects.filter(school=school)
            .select_related('academic_term', 'class_teacher__user')
            .order_by('level', 'name')
        )

    def perform_create(self, serializer):
        school = self.request.user.school_staff_profile.school
        serializer.save(school=school)


class CohortDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / PUT / DELETE /schools/cohorts/<id>/"""

    serializer_class = CohortSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = self.request.user.school_staff_profile.school
        return Cohort.objects.filter(school=school).select_related('academic_term', 'class_teacher__user')


# ── Staff & invites ──────────────────────────────────────────────────────

class SchoolStaffListView(generics.ListAPIView):
    """GET /schools/staff/ — read-only roster of this admin's school's staff."""

    serializer_class = SchoolStaffSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = self.request.user.school_staff_profile.school
        return SchoolStaff.objects.filter(school=school).select_related('user').order_by('user__last_name')


class SchoolInviteCreateView(generics.CreateAPIView):
    """
    POST /schools/invites/
    Creates an invite link (ADMIN/TEACHER school-wide, or STUDENT scoped
    to a class_group). Returns the token — the frontend builds the
    shareable URL from it.
    """

    serializer_class = SchoolInviteCreateSerializer
    permission_classes = [IsSchoolAdmin]

    def perform_create(self, serializer):
        school = self.request.user.school_staff_profile.school
        serializer.save(school=school, created_by=self.request.user)


class SchoolInviteRedeemView(APIView):
    """
    POST /schools/invites/redeem/  { token }

    Any authenticated user not already on a school can redeem an
    ADMIN/TEACHER invite to join it. STUDENT invites are out of scope for
    this phase — there's no self-service student enrollment flow yet
    (CohortEnrollment/ClassEnrollment creation needs its own design, not
    bolted onto this endpoint) — so those are rejected with a clear
    message rather than silently mishandled.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SchoolInviteRedeemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']

        try:
            invite = SchoolInvite.objects.select_related('school').get(token=token)
        except SchoolInvite.DoesNotExist:
            return Response({'error': 'Invalid invite link.'}, status=404)

        if not invite.is_valid:
            return Response({'error': 'This invite has expired or been fully used.'}, status=400)

        if hasattr(request.user, 'school_staff_profile'):
            return Response({'error': "You're already part of a school."}, status=400)

        if invite.role not in ('ADMIN', 'TEACHER'):
            return Response({'error': 'Student invites are not yet supported.'}, status=400)

        SchoolStaff.objects.create(user=request.user, school=invite.school, school_role=invite.role)
        invite.redeem()

        return Response({'school_id': invite.school_id, 'role': invite.role}, status=200)


# ── ClassGroup ───────────────────────────────────────────────────────────

class ClassGroupListCreateView(generics.ListCreateAPIView):
    """
    GET  /schools/class-groups/    — list this admin's school's class groups
    POST /schools/class-groups/    — create a class group (teacher+subject+cohort)
    """

    serializer_class = ClassGroupSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = self.request.user.school_staff_profile.school
        return (
            ClassGroup.objects.filter(cohort__school=school)
            .select_related('teacher__user', 'subject', 'cohort')
            .order_by('cohort', 'subject')
        )


class ClassGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / PUT / DELETE /schools/class-groups/<id>/"""

    serializer_class = ClassGroupSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school = self.request.user.school_staff_profile.school
        return (
            ClassGroup.objects.filter(cohort__school=school)
            .select_related('teacher__user', 'subject', 'cohort')
        )