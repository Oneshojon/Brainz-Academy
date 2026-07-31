import pytest
from django.contrib.admin.sites import AdminSite
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory

from contact.admin import ContactMessageAdmin
from contact.models import ContactMessage
from contact.tests.factories import ContactMessageFactory

pytestmark = pytest.mark.django_db


class TestContactMessageAdmin:
    def test_list_select_related_avoids_n_plus_1_on_user(self):
        admin_instance = ContactMessageAdmin(ContactMessage, AdminSite())
        assert admin_instance.list_select_related == ("user",)

    def test_mark_resolved_action_updates_status(self, rf: RequestFactory, admin_user):
        msg1 = ContactMessageFactory(status=ContactMessage.Status.NEW)
        msg2 = ContactMessageFactory(status=ContactMessage.Status.NEW)

        admin_instance = ContactMessageAdmin(ContactMessage, AdminSite())
        request = rf.post("/admin/contact/contactmessage/")
        request.user = admin_user
        setattr(request, "session", "session")
        setattr(request, "_messages", FallbackStorage(request))

        queryset = ContactMessage.objects.filter(id__in=[msg1.id, msg2.id])
        admin_instance.mark_resolved(request, queryset)

        msg1.refresh_from_db()
        msg2.refresh_from_db()
        assert msg1.status == ContactMessage.Status.RESOLVED
        assert msg2.status == ContactMessage.Status.RESOLVED

    def test_mark_in_progress_action_updates_status(self, rf: RequestFactory, admin_user):
        """Covers the mark_in_progress admin action (previously untested)."""
        msg1 = ContactMessageFactory(status=ContactMessage.Status.NEW)
        msg2 = ContactMessageFactory(status=ContactMessage.Status.NEW)

        admin_instance = ContactMessageAdmin(ContactMessage, AdminSite())
        request = rf.post("/admin/contact/contactmessage/")
        request.user = admin_user
        setattr(request, "session", "session")
        setattr(request, "_messages", FallbackStorage(request))

        queryset = ContactMessage.objects.filter(id__in=[msg1.id, msg2.id])
        admin_instance.mark_in_progress(request, queryset)

        msg1.refresh_from_db()
        msg2.refresh_from_db()
        assert msg1.status == ContactMessage.Status.IN_PROGRESS
        assert msg2.status == ContactMessage.Status.IN_PROGRESS