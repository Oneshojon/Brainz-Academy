"""
Covers GET rendering, valid/invalid POST, honeypot handling, rate
limiting, and graceful fallback when email delivery fails (Brevo circuit
open) — the ContactMessage row must still save and the user still sees
success, since email delivery is non-critical.
"""

import json
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.urls import reverse

from contact.models import ContactMessage

pytestmark = pytest.mark.django_db

VALID_PAYLOAD = {
    "category": "SUGGESTION",
    "name": "Chinedu Okafor",
    "email": "chinedu@example.com",
    "subject": "Dark mode request",
    "message": "It would be great to have a dark mode option for late-night study sessions.",
    "honeypot": "",
}


@pytest.fixture(autouse=True)
def clear_cache():
    """Rate limiting is cache-backed; isolate each test's window."""
    cache.clear()
    yield
    cache.clear()


class TestContactPageGet:
    def test_get_renders_form(self, client):
        response = client.get(reverse("contact:contact_page"))
        assert response.status_code == 200
        assert "form" in response.context
        assert response.templates[0].name == "contact/contact.html"


class TestContactPagePost:
    @patch("contact.views.send_contact_notification", return_value=True)
    def test_valid_submission_creates_message_and_sends_email(self, mock_send, client):
        response = client.post(
            reverse("contact:contact_page"),
            data=json.dumps(VALID_PAYLOAD),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json() == {"success": True}
        assert ContactMessage.objects.count() == 1

        saved = ContactMessage.objects.first()
        assert saved.email == VALID_PAYLOAD["email"]
        assert saved.user is None
        mock_send.assert_called_once()

    @patch("contact.views.send_contact_notification", return_value=True)
    def test_authenticated_user_is_attached(self, mock_send, client, django_user_model):
        user = django_user_model.objects.create_user(email="auth@example.com", password="pass1234")
        client.force_login(user)

        client.post(
            reverse("contact:contact_page"),
            data=json.dumps(VALID_PAYLOAD),
            content_type="application/json",
        )
        saved = ContactMessage.objects.first()
        assert saved.user == user

    def test_invalid_submission_returns_errors_and_saves_nothing(self, client):
        bad_payload = {**VALID_PAYLOAD, "email": "not-an-email"}
        response = client.post(
            reverse("contact:contact_page"),
            data=json.dumps(bad_payload),
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "email" in response.json()["errors"]
        assert ContactMessage.objects.count() == 0

    def test_honeypot_filled_returns_fake_success_and_saves_nothing(self, client):
        bot_payload = {**VALID_PAYLOAD, "honeypot": "I love spam"}
        response = client.post(
            reverse("contact:contact_page"),
            data=json.dumps(bot_payload),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json() == {"success": True}
        assert ContactMessage.objects.count() == 0

    @patch("contact.views.send_contact_notification", return_value=False)
    def test_email_delivery_failure_still_saves_and_reports_success(self, mock_send, client):
        """
        send_contact_notification() already swallows CircuitOpenError and
        returns False internally — the view never sees the exception. This
        confirms the DB write happens regardless of that return value.
        """
        response = client.post(
            reverse("contact:contact_page"),
            data=json.dumps(VALID_PAYLOAD),
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.json() == {"success": True}
        assert ContactMessage.objects.count() == 1

    @patch("contact.views.send_contact_notification", return_value=True)
    def test_rate_limit_blocks_after_max_submissions(self, mock_send, client):
        for _ in range(5):
            client.post(
                reverse("contact:contact_page"),
                data=json.dumps(VALID_PAYLOAD),
                content_type="application/json",
            )
        response = client.post(
            reverse("contact:contact_page"),
            data=json.dumps(VALID_PAYLOAD),
            content_type="application/json",
        )
        assert response.status_code == 429
        assert ContactMessage.objects.count() == 5

    def test_malformed_json_body_returns_400(self, client):
        response = client.post(
            reverse("contact:contact_page"),
            data="not-json",
            content_type="application/json",
        )
        assert response.status_code == 400