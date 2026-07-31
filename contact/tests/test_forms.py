import pytest

from contact.forms import ContactMessageForm

pytestmark = pytest.mark.django_db

VALID_DATA = {
    "category": "INQUIRY",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "subject": "Question about subscriptions",
    "message": "I'd like to know if premium plans support family accounts.",
    "honeypot": "",
}


class TestContactMessageForm:
    def test_valid_data_is_valid(self):
        form = ContactMessageForm(data=VALID_DATA)
        assert form.is_valid(), form.errors

    def test_missing_required_field_is_invalid(self):
        form = ContactMessageForm(data={**VALID_DATA, "email": ""})
        assert not form.is_valid()
        assert "email" in form.errors

    def test_short_message_is_rejected(self):
        form = ContactMessageForm(data={**VALID_DATA, "message": "Hi"})
        assert not form.is_valid()
        assert "message" in form.errors

    def test_honeypot_filled_is_invalid(self):
        form = ContactMessageForm(data={**VALID_DATA, "honeypot": "I am a bot"})
        assert not form.is_valid()
        assert "honeypot" in form.errors

    def test_invalid_email_format_rejected(self):
        form = ContactMessageForm(data={**VALID_DATA, "email": "not-an-email"})
        assert not form.is_valid()
        assert "email" in form.errors