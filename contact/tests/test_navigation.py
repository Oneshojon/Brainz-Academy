"""Verifies the Contact link appears in both the nav and footer."""

import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


class TestContactNavigation:
    def test_contact_link_appears_in_nav_and_footer_on_homepage(self, client):
        response = client.get("/")
        assert response.status_code == 200
        content = response.content.decode()
        contact_url = reverse("contact:contact_page")
        # One occurrence in nav, one in footer
        assert content.count(contact_url) >= 2

    def test_contact_page_accessible_without_login(self, client):
        response = client.get(reverse("contact:contact_page"))
        assert response.status_code == 200