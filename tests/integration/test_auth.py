"""
Integration tests: authentication flows.

OTP flow (verified from Users/views.py):
  - request_otp view: generates OTP, stores in session['otp'] + session['otp_email'],
    sends email via django mail, redirects to Users:verify_otp
  - verify_otp view: reads session['otp'] + session['otp_email'], checks entered code,
    logs user in on match
  - No external helper functions — all logic is inline in the view

No mocking of send_otp_email or verify_otp_code (they don't exist as functions).
Email is mocked via EMAIL_BACKEND = locmem in settings_test.py.
"""

import pytest
from django.urls import reverse
from django.core import mail


@pytest.mark.django_db
class TestRequestOTP:

    def test_otp_page_renders(self, client):
        url = reverse('Users:request_otp')
        response = client.get(url)
        assert response.status_code == 200

    def test_otp_page_contains_email_input(self, client):
        url = reverse('Users:request_otp')
        response = client.get(url)
        assert b'email' in response.content.lower()

    def test_post_registered_email_sends_otp_email(self, client, student):
        """
        Posting a registered email triggers OTP generation and sends an email.
        EMAIL_BACKEND = locmem so mail.outbox captures it.
        """
        url = reverse('Users:request_otp')
        response = client.post(url, {'email': student.email})
        # Should redirect to verify page
        assert response.status_code == 302
        assert 'verify' in response['Location'] or \
               reverse('Users:verify_otp') in response['Location']
        # OTP email sent
        assert len(mail.outbox) == 1

    def test_post_stores_otp_in_session(self, client, student):
        url = reverse('Users:request_otp')
        client.post(url, {'email': student.email})
        assert 'otp' in client.session
        assert 'otp_email' in client.session
        assert client.session['otp_email'] == student.email

    def test_post_unknown_email_does_not_500(self, client):
        """Unknown email should return 200 or redirect — not crash."""
        url = reverse('Users:request_otp')
        response = client.post(url, {'email': 'nobody@example.com'})
        assert response.status_code in (200, 302)

    def test_post_empty_email_does_not_500(self, client):
        url = reverse('Users:request_otp')
        response = client.post(url, {'email': ''})
        assert response.status_code in (200, 302)


@pytest.mark.django_db
class TestVerifyOTP:

    def _seed_otp_session(self, client, student, otp='123456'):
        """Manually plant OTP in session — simulates request_otp completing."""
        from django.utils import timezone
        session = client.session
        session['otp'] = otp
        session['otp_email'] = student.email
        session['otp_created_at'] = timezone.now().isoformat()
        session.save()

    def test_verify_page_renders(self, client, student):
        self._seed_otp_session(client, student)
        url = reverse('Users:verify_otp')
        response = client.get(url)
        assert response.status_code == 200

    def test_verify_page_without_session_redirects_to_request(self, client):
        """No session → redirect back to request_otp."""
        url = reverse('Users:verify_otp')
        response = client.get(url)
        assert response.status_code == 302

    def test_correct_otp_logs_user_in(self, client, student):
        self._seed_otp_session(client, student, otp='654321')
        url = reverse('Users:verify_otp')
        response = client.post(url, {'otp': '654321'})
        # After login, should redirect to dashboard or home
        assert response.status_code == 302
        assert '_auth_user_id' in client.session

    def test_wrong_otp_does_not_log_in(self, client, student):
        self._seed_otp_session(client, student, otp='999999')
        url = reverse('Users:verify_otp')
        response = client.post(url, {'otp': '000000'})
        assert '_auth_user_id' not in client.session

    def test_wrong_otp_returns_200_with_error(self, client, student):
        self._seed_otp_session(client, student, otp='999999')
        url = reverse('Users:verify_otp')
        response = client.post(url, {'otp': '000000'})
        assert response.status_code == 200

    def test_expired_otp_does_not_log_in(self, client, student):
        """OTP created 15 minutes ago should be rejected."""
        from django.utils import timezone
        from datetime import timedelta
        session = client.session
        session['otp'] = '123456'
        session['otp_email'] = student.email
        session['otp_created_at'] = (
            timezone.now() - timedelta(minutes=15)
        ).isoformat()
        session.save()
        url = reverse('Users:verify_otp')
        response = client.post(url, {'otp': '123456'})
        assert '_auth_user_id' not in client.session


@pytest.mark.django_db
class TestLogout:

    def test_logout_redirects(self, client, student):
        client.force_login(student)
        response = client.post('/logout_view/')
        assert response.status_code in (200, 302)

    def test_logged_out_user_cannot_access_dashboard(self, client):
        url = reverse('Users:dashboard')
        response = client.get(url)
        assert response.status_code == 302

    def test_logout_clears_session(self, client, student):
        client.force_login(student)
        assert '_auth_user_id' in client.session
        client.post('/logout_view/')
        assert '_auth_user_id' not in client.session


@pytest.mark.django_db
class TestDashboardAccess:

    def test_student_can_access_dashboard(self, client, student):
        client.force_login(student)
        url = reverse('Users:dashboard')
        response = client.get(url)
        assert response.status_code == 200

    def test_teacher_can_access_dashboard(self, client, teacher):
        client.force_login(teacher)
        url = reverse('Users:dashboard')
        response = client.get(url)
        assert response.status_code == 200

    def test_unauthenticated_redirected_from_dashboard(self, client):
        url = reverse('Users:dashboard')
        response = client.get(url)
        assert response.status_code == 302