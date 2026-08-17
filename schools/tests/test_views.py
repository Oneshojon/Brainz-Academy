"""
schools/tests/test_views.py

Covers: plan listing, registration (auth required, feature-flag gated,
one-school-per-account), and the Paystack callback/webhook activation
flow (success, pending-on-circuit-open, failure, and idempotency).

Paystack itself is never called — services.payment_service functions are
patched at the point of use in schools.views, same convention as
contact/tests/test_views.py patches send_contact_notification.
"""

import json
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.urls import reverse

from catalog.models import FeatureFlag
from services.payment_service import PaystackError, PaystackUnavailableError
from tests.conftest import TeacherUserFactory, UserFactory, assert_max_queries

from schools.models import School, SchoolStaff, SchoolSubscription
from schools.tests.factories import SchoolFactory, SchoolPlanFactory, SchoolSubscriptionFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def school_plan_enabled():
    """
    school_plan ships OFF by default (see catalog INITIAL_FLAGS) until the
    full flow is ready for general availability. Tests that exercise the
    flow need it explicitly ON.
    """
    FeatureFlag.objects.filter(key='school_plan').update(is_enabled=True)
    cache.clear()
    yield
    cache.clear()


# ---------------------------------------------------------------------------
# SchoolPlanListView
# ---------------------------------------------------------------------------

class TestSchoolPlanListView:

    def test_404_when_feature_flag_off(self, client):
        response = client.get(reverse('schools:plan-list'))
        assert response.status_code == 404

    def test_lists_active_plans_when_enabled(self, client, school_plan_enabled):
        SchoolPlanFactory(name='School Basic', is_active=True)
        SchoolPlanFactory(name='School Pro', duration='YEARLY', is_active=True)
        SchoolPlanFactory(name='Discontinued', is_active=False)

        response = client.get(reverse('schools:plan-list'))

        assert response.status_code == 200
        names = [p['name'] for p in response.json()['plans']]
        assert 'School Basic' in names
        assert 'School Pro' in names
        assert 'Discontinued' not in names

    def test_no_n_plus_one_on_plan_list(self, client, school_plan_enabled):
        for _ in range(5):
            SchoolPlanFactory(name=f'Plan {_}', is_active=True)

        with assert_max_queries(4):
            response = client.get(reverse('schools:plan-list'))
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# SchoolRegisterView
# ---------------------------------------------------------------------------

VALID_PAYLOAD = {
    'name': 'Bright Future College',
    'state': 'Lagos',
    'contact_email': 'admin@brightfuture.example.com',
}


class TestSchoolRegisterView:

    def test_requires_authentication(self, client, school_plan_enabled):
        plan = SchoolPlanFactory()
        response = client.post(
            reverse('schools:register'),
            data=json.dumps({**VALID_PAYLOAD, 'plan_id': plan.id}),
            content_type='application/json',
        )
        assert response.status_code in (401, 403)

    def test_404_when_feature_flag_off(self, client):
        teacher = TeacherUserFactory()
        client.force_login(teacher)
        plan = SchoolPlanFactory()
        response = client.post(
            reverse('schools:register'),
            data=json.dumps({**VALID_PAYLOAD, 'plan_id': plan.id}),
            content_type='application/json',
        )
        assert response.status_code == 404

    @patch('schools.views.initialize_transaction', return_value='https://checkout.paystack.com/abc123')
    def test_successful_registration_creates_school_staff_and_subscription(
        self, mock_init, client, school_plan_enabled,
    ):
        teacher = TeacherUserFactory()
        client.force_login(teacher)
        plan = SchoolPlanFactory(price=50000)

        response = client.post(
            reverse('schools:register'),
            data=json.dumps({**VALID_PAYLOAD, 'plan_id': plan.id}),
            content_type='application/json',
        )

        assert response.status_code == 201
        assert response.json()['authorization_url'] == 'https://checkout.paystack.com/abc123'

        school = School.objects.get(name='Bright Future College')
        assert school.status == 'PENDING_PAYMENT'
        assert school.created_by == teacher

        staff = SchoolStaff.objects.get(user=teacher)
        assert staff.school == school
        assert staff.school_role == 'ADMIN'

        subscription = SchoolSubscription.objects.get(school=school)
        assert subscription.plan == plan
        assert subscription.status == 'PENDING'

        # Amount passed to Paystack is in kobo (Naira × 100).
        mock_init.assert_called_once()
        assert mock_init.call_args.kwargs['amount_kobo'] == 50000 * 100
        assert mock_init.call_args.kwargs['metadata']['school_id'] == school.id

    def test_user_already_on_a_school_cannot_register_another(self, client, school_plan_enabled):
        teacher = TeacherUserFactory()
        SchoolStaff.objects.create(user=teacher, school=SchoolFactory(), school_role='TEACHER')
        client.force_login(teacher)
        plan = SchoolPlanFactory()

        response = client.post(
            reverse('schools:register'),
            data=json.dumps({**VALID_PAYLOAD, 'plan_id': plan.id}),
            content_type='application/json',
        )

        assert response.status_code == 400
        assert School.objects.filter(name='Bright Future College').count() == 0

    @patch('schools.views.initialize_transaction', side_effect=PaystackUnavailableError('circuit open'))
    def test_paystack_unavailable_returns_503_but_school_row_persists(
        self, mock_init, client, school_plan_enabled,
    ):
        """
        School/SchoolStaff/SchoolSubscription are committed before the
        Paystack call — a circuit-open failure shouldn't lose the lead,
        same principle as contact form submissions surviving Brevo outages.
        """
        teacher = TeacherUserFactory()
        client.force_login(teacher)
        plan = SchoolPlanFactory()

        response = client.post(
            reverse('schools:register'),
            data=json.dumps({**VALID_PAYLOAD, 'plan_id': plan.id}),
            content_type='application/json',
        )

        assert response.status_code == 503
        assert School.objects.filter(name='Bright Future College').exists()

    @patch('schools.views.initialize_transaction', side_effect=PaystackError('bad request'))
    def test_paystack_error_returns_502(self, mock_init, client, school_plan_enabled):
        teacher = TeacherUserFactory()
        client.force_login(teacher)
        plan = SchoolPlanFactory()

        response = client.post(
            reverse('schools:register'),
            data=json.dumps({**VALID_PAYLOAD, 'plan_id': plan.id}),
            content_type='application/json',
        )

        assert response.status_code == 502

    def test_inactive_plan_is_rejected(self, client, school_plan_enabled):
        teacher = TeacherUserFactory()
        client.force_login(teacher)
        plan = SchoolPlanFactory(is_active=False)

        response = client.post(
            reverse('schools:register'),
            data=json.dumps({**VALID_PAYLOAD, 'plan_id': plan.id}),
            content_type='application/json',
        )

        assert response.status_code == 400


# ---------------------------------------------------------------------------
# school_payment_callback
# ---------------------------------------------------------------------------

class TestSchoolPaymentCallback:

    def test_requires_login(self, client):
        response = client.get(reverse('schools:payment-callback'), {'reference': 'ref123'})
        assert response.status_code == 302  # redirected to login

    def test_missing_reference_shows_failed_page(self, client):
        user = UserFactory()
        client.force_login(user)
        response = client.get(reverse('schools:payment-callback'))
        assert response.status_code == 200
        assert response.templates[0].name == 'schools/registration_failed.html'

    @patch('schools.views.verify_transaction')
    def test_successful_verification_activates_school(self, mock_verify, client):
        subscription = SchoolSubscriptionFactory(status='PENDING', started_at=None, expires_at=None)
        mock_verify.return_value = {
            'metadata': {'school_id': subscription.school_id},
            'amount': int(subscription.plan.price * 100),
        }
        user = UserFactory()
        client.force_login(user)

        response = client.get(reverse('schools:payment-callback'), {'reference': 'ref123'})

        assert response.status_code == 200
        assert response.templates[0].name == 'schools/registration_success.html'

        subscription.refresh_from_db()
        subscription.school.refresh_from_db()
        assert subscription.status == 'ACTIVE'
        assert subscription.paystack_reference == 'ref123'
        assert subscription.school.status == 'ACTIVE'

    @patch('schools.views.verify_transaction', side_effect=PaystackUnavailableError('circuit open'))
    def test_circuit_open_shows_pending_page_without_activating(self, mock_verify, client):
        subscription = SchoolSubscriptionFactory(status='PENDING')
        user = UserFactory()
        client.force_login(user)

        response = client.get(reverse('schools:payment-callback'), {'reference': 'ref123'})

        assert response.status_code == 200
        assert response.templates[0].name == 'schools/registration_pending.html'
        subscription.refresh_from_db()
        assert subscription.status == 'PENDING'

    @patch('schools.views.verify_transaction', side_effect=PaystackError('not successful'))
    def test_verification_failure_shows_failed_page(self, mock_verify, client):
        user = UserFactory()
        client.force_login(user)
        response = client.get(reverse('schools:payment-callback'), {'reference': 'ref123'})
        assert response.status_code == 200
        assert response.templates[0].name == 'schools/registration_failed.html'

    @patch('schools.views.verify_transaction')
    def test_unknown_school_id_shows_failed_page(self, mock_verify, client):
        mock_verify.return_value = {'metadata': {'school_id': 999999}, 'amount': 100}
        user = UserFactory()
        client.force_login(user)
        response = client.get(reverse('schools:payment-callback'), {'reference': 'ref123'})
        assert response.status_code == 200
        assert response.templates[0].name == 'schools/registration_failed.html'


# ---------------------------------------------------------------------------
# school_paystack_webhook
# ---------------------------------------------------------------------------

class TestSchoolPaystackWebhook:

    def _post_webhook(self, client, payload, signature='valid-signature'):
        return client.post(
            reverse('schools:payment-webhook'),
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )

    @patch('schools.views.verify_webhook_signature', return_value=False)
    def test_invalid_signature_returns_401(self, mock_verify_sig, client):
        response = self._post_webhook(client, {'event': 'charge.success', 'data': {}})
        assert response.status_code == 401

    @patch('schools.views.verify_webhook_signature', return_value=True)
    def test_malformed_json_returns_400(self, mock_verify_sig, client):
        response = client.post(
            reverse('schools:payment-webhook'),
            data='not-json',
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE='valid-signature',
        )
        assert response.status_code == 400

    @patch('schools.views.verify_webhook_signature', return_value=True)
    def test_charge_success_activates_school(self, mock_verify_sig, client):
        subscription = SchoolSubscriptionFactory(status='PENDING', started_at=None, expires_at=None)
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'ref456',
                'metadata': {'school_id': subscription.school_id},
            },
        }

        response = self._post_webhook(client, payload)

        assert response.status_code == 200
        subscription.refresh_from_db()
        subscription.school.refresh_from_db()
        assert subscription.status == 'ACTIVE'
        assert subscription.school.status == 'ACTIVE'

    @patch('schools.views.verify_webhook_signature', return_value=True)
    def test_duplicate_webhook_delivery_does_not_reactivate(self, mock_verify_sig, client):
        """Paystack may retry the same event — activation must be idempotent."""
        subscription = SchoolSubscriptionFactory(status='PENDING', started_at=None, expires_at=None)
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'ref789',
                'metadata': {'school_id': subscription.school_id},
            },
        }

        self._post_webhook(client, payload)
        subscription.refresh_from_db()
        first_expires_at = subscription.expires_at

        self._post_webhook(client, payload)
        subscription.refresh_from_db()

        assert subscription.expires_at == first_expires_at

    @patch('schools.views.verify_webhook_signature', return_value=True)
    def test_unrecognized_event_is_ignored(self, mock_verify_sig, client):
        response = self._post_webhook(client, {'event': 'charge.failed', 'data': {}})
        assert response.status_code == 200

    @patch('schools.views.verify_webhook_signature', return_value=True)
    def test_unknown_school_id_returns_200(self, mock_verify_sig, client):
        """Always ack Paystack — logging the mismatch is enough, retries would be pointless."""
        payload = {
            'event': 'charge.success',
            'data': {'reference': 'refXYZ', 'metadata': {'school_id': 999999}},
        }
        response = self._post_webhook(client, payload)
        assert response.status_code == 200