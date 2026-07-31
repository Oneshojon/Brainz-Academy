import pytest

from contact.models import ContactMessage
from contact.tests.factories import ContactMessageFactory

pytestmark = pytest.mark.django_db


class TestContactMessageModel:
    def test_creates_with_defaults(self):
        msg = ContactMessageFactory()
        assert msg.status == ContactMessage.Status.NEW
        assert msg.user is None
        assert msg.created_at is not None

    def test_str_representation(self):
        msg = ContactMessageFactory(
            category=ContactMessage.Category.COMPLAINT,
            subject="Payment not reflecting",
            email="student@example.com",
        )
        assert str(msg) == "[COMPLAINT] Payment not reflecting — student@example.com"

    def test_ordering_is_newest_first(self):
        older = ContactMessageFactory()
        newer = ContactMessageFactory()
        messages = list(ContactMessage.objects.all())
        assert messages[0] == newer
        assert messages[1] == older

    def test_user_set_null_on_user_delete(self, django_user_model):
        # NOTE: adjust create_user() kwargs if your custom user manager
        # doesn't accept email/password directly (e.g. OTP-only signup).
        user = django_user_model.objects.create_user(email="u@example.com", password="pass1234")
        msg = ContactMessageFactory(user=user)
        user.delete()
        msg.refresh_from_db()
        assert msg.user is None