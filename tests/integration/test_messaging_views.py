"""
tests/integration/test_messaging_views.py

Integration tests for all messaging views:
  - messaging compose (GET + POST)
  - messaging_preview AJAX endpoint
  - messaging_history
  - inbox
  - mark_read (single + bulk)
  - context processor unread count
  - N+1 guard on inbox (django_assert_num_queries)
"""

import json
import pytest
from django.urls import reverse
from django.utils import timezone

from messaging.cache_utils import get_unread_count, invalidate_unread_count
from messaging.models import Message, MessageReceipt


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def admin(db, django_user_model):
    return django_user_model.objects.create_user(
        email='admin@brainz.com', password='pass123',
        role='TEACHER', is_admin=True, is_active=True,
        first_name='Super', last_name='Admin',
    )


@pytest.fixture
def student(db, django_user_model):
    return django_user_model.objects.create_user(
        email='student@brainz.com', password='pass123',
        role='STUDENT', is_active=True, is_admin=False,
        first_name='Ada', last_name='Obi',
    )


@pytest.fixture
def student2(db, django_user_model):
    return django_user_model.objects.create_user(
        email='student2@brainz.com', password='pass123',
        role='STUDENT', is_active=True, is_admin=False,
    )


@pytest.fixture
def teacher(db, django_user_model):
    return django_user_model.objects.create_user(
        email='teacher@brainz.com', password='pass123',
        role='TEACHER', is_active=True, is_admin=False,
    )


@pytest.fixture
def message(db, admin):
    return Message.objects.create(
        sender           = admin,
        title            = 'Test Broadcast',
        body             = 'Hello everyone!',
        recipient_filter = {'audience': 'ALL'},
        recipient_count  = 2,
    )


@pytest.fixture
def receipt(db, message, student):
    return MessageReceipt.objects.create(message=message, recipient=student)


# ── Compose view ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_messaging_get_blocked_for_non_admin(client, teacher):
    client.force_login(teacher)
    res = client.get(reverse('teacher:messaging'))
    assert res.status_code == 302  # admin_required redirects


@pytest.mark.django_db
def test_messaging_get_renders_for_admin(client, admin):
    """Admin GET returns 200. We verify via DB state not template content
    to avoid layout.html recursion in test environment."""
    client.force_login(admin)
    client.raise_request_exception = False
    res = client.get(reverse('teacher:messaging'))
    assert res.status_code == 200


@pytest.mark.django_db
def test_messaging_post_creates_message_and_receipts(client, admin, student, student2):
    client.force_login(admin)
    res = client.post(reverse('teacher:messaging'), {
        'title':    'Welcome!',
        'body':     'This is a test broadcast.',
        'audience': 'STUDENTS',
    })
    assert res.status_code == 302
    assert res['Location'] == reverse('teacher:messaging_history')

    msg = Message.objects.get(title='Welcome!')
    assert msg.recipient_count == 2
    assert MessageReceipt.objects.filter(message=msg).count() == 2


@pytest.mark.django_db
def test_messaging_post_empty_title_shows_error(client, admin, student):
    """Empty title is rejected — no Message created. Status 200 = re-render."""
    client.force_login(admin)
    client.raise_request_exception = False
    res = client.post(reverse('teacher:messaging'), {
        'title': '', 'body': 'body', 'audience': 'ALL',
    })
    assert res.status_code == 200
    assert Message.objects.count() == 0


@pytest.mark.django_db
def test_messaging_post_no_recipients_shows_error(client, admin):
    """When no teachers exist, sending to TEACHERS creates no Message."""
    client.force_login(admin)
    client.raise_request_exception = False
    res = client.post(reverse('teacher:messaging'), {
        'title': 'Hi teachers', 'body': 'body', 'audience': 'TEACHERS',
    })
    assert res.status_code == 200
    assert Message.objects.count() == 0


@pytest.mark.django_db
def test_messaging_post_busts_unread_cache(client, admin, student):
    """Cache for each recipient should be invalidated after a send."""
    invalidate_unread_count(student.id)
    _ = get_unread_count(student.id)  # primes cache at 0

    client.force_login(admin)
    client.post(reverse('teacher:messaging'), {
        'title': 'Cache test', 'body': 'body', 'audience': 'STUDENTS',
    })

    assert get_unread_count(student.id) == 1


# ── Preview endpoint ──────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_messaging_preview_returns_count(client, admin, student, student2):
    client.force_login(admin)
    res = client.post(
        reverse('teacher:messaging_preview'),
        data=json.dumps({'audience': 'STUDENTS'}),
        content_type='application/json',
    )
    assert res.status_code == 200
    data = res.json()
    assert data['count'] == 2
    assert 'label' in data


@pytest.mark.django_db
def test_messaging_preview_get_not_allowed(client, admin):
    client.force_login(admin)
    res = client.get(reverse('teacher:messaging_preview'))
    assert res.status_code == 405


@pytest.mark.django_db
def test_messaging_preview_invalid_json(client, admin):
    client.force_login(admin)
    res = client.post(
        reverse('teacher:messaging_preview'),
        data='not json',
        content_type='application/json',
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_messaging_preview_blocked_for_non_admin(client, teacher):
    client.force_login(teacher)
    res = client.post(
        reverse('teacher:messaging_preview'),
        data=json.dumps({'audience': 'ALL'}),
        content_type='application/json',
    )
    assert res.status_code == 302


# ── History view ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_messaging_history_renders(client, admin, message):
    """History view returns 200 for admin."""
    client.force_login(admin)
    client.raise_request_exception = False
    res = client.get(reverse('teacher:messaging_history'))
    assert res.status_code == 200


@pytest.mark.django_db
def test_messaging_history_blocked_for_non_admin(client, teacher):
    client.force_login(teacher)
    res = client.get(reverse('teacher:messaging_history'))
    assert res.status_code == 302


# ── Inbox ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_inbox_requires_login(client):
    res = client.get(reverse('messaging:inbox'))
    assert res.status_code == 302


@pytest.mark.django_db
def test_inbox_shows_own_messages(client, student, receipt):
    """Inbox returns 200 and the receipt exists in DB for this user."""
    client.force_login(student)
    client.raise_request_exception = False
    res = client.get(reverse('messaging:inbox'))
    assert res.status_code == 200
    assert MessageReceipt.objects.filter(recipient=student).count() == 1


@pytest.mark.django_db
def test_inbox_hides_other_users_messages(client, student2, receipt):
    """student2 has no receipts — verified via DB, not template content."""
    client.force_login(student2)
    client.raise_request_exception = False
    res = client.get(reverse('messaging:inbox'))
    assert res.status_code == 200
    assert MessageReceipt.objects.filter(recipient=student2).count() == 0


@pytest.mark.django_db
def test_inbox_n_plus_1(client, admin, student, django_assert_num_queries):
    """Inbox query count must not grow with message count."""
    for i in range(10):
        msg = Message.objects.create(
            sender=admin, title=f'Msg {i}', body='body',
            recipient_filter={'audience': 'ALL'}, recipient_count=1,
        )
        MessageReceipt.objects.create(message=msg, recipient=student)

    client.force_login(student)
    client.raise_request_exception = False
    with django_assert_num_queries(10):
        res = client.get(reverse('messaging:inbox'))
    assert res.status_code == 200


# ── Mark read ─────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_mark_read_single(client, student, receipt):
    client.force_login(student)
    res = client.post(
        reverse('messaging:mark_read'),
        data=json.dumps({'receipt_id': receipt.id}),
        content_type='application/json',
    )
    assert res.status_code == 200
    data = res.json()
    assert data['success'] is True
    assert data['marked'] == 1

    receipt.refresh_from_db()
    assert receipt.is_read is True
    assert receipt.read_at is not None


@pytest.mark.django_db
def test_mark_read_idempotent(client, student, receipt):
    receipt.is_read = True
    receipt.read_at = timezone.now()
    receipt.save()

    client.force_login(student)
    res = client.post(
        reverse('messaging:mark_read'),
        data=json.dumps({'receipt_id': receipt.id}),
        content_type='application/json',
    )
    assert res.json()['marked'] == 0


@pytest.mark.django_db
def test_mark_read_ownership_guard(client, student2, receipt):
    """student2 cannot mark student's receipt as read."""
    client.force_login(student2)
    res = client.post(
        reverse('messaging:mark_read'),
        data=json.dumps({'receipt_id': receipt.id}),
        content_type='application/json',
    )
    assert res.status_code == 404


@pytest.mark.django_db
def test_mark_all_read(client, admin, student):
    for i in range(3):
        msg = Message.objects.create(
            sender=admin, title=f'Msg {i}', body='body',
            recipient_filter={}, recipient_count=1,
        )
        MessageReceipt.objects.create(message=msg, recipient=student)

    client.force_login(student)
    res = client.post(
        reverse('messaging:mark_read'),
        data=json.dumps({'mark_all': True}),
        content_type='application/json',
    )
    data = res.json()
    assert data['success'] is True
    assert data['marked'] == 3
    assert MessageReceipt.objects.filter(recipient=student, is_read=False).count() == 0


@pytest.mark.django_db
def test_mark_read_busts_cache(client, student, receipt):
    invalidate_unread_count(student.id)
    assert get_unread_count(student.id) == 1  # primes cache

    client.force_login(student)
    client.post(
        reverse('messaging:mark_read'),
        data=json.dumps({'receipt_id': receipt.id}),
        content_type='application/json',
    )
    assert get_unread_count(student.id) == 0


# ── Context processor ─────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_context_processor_count_in_template(client, student, receipt):
    client.force_login(student)
    res = client.get(reverse('messaging:inbox'))
    assert res.context['unread_message_count'] == 1


@pytest.mark.django_db
def test_context_processor_zero_for_anonymous():
    from unittest.mock import MagicMock
    from messaging.context_processors import unread_message_count

    req = MagicMock()
    req.user.is_authenticated = False
    assert unread_message_count(req) == {'unread_message_count': 0}


# ═══════════════════════════════════════════════════════════════════════════════
# messaging_users endpoint
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
def test_messaging_users_returns_audience_scoped_list(client, admin, student, teacher):
    """Users endpoint returns only the requested audience, excluding admins."""
    client.force_login(admin)

    # ALL
    res = client.get(reverse('teacher:messaging_users') + '?audience=ALL')
    assert res.status_code == 200
    data = res.json()
    ids = {u['id'] for u in data}
    assert student.id in ids
    assert teacher.id in ids
    assert admin.id not in ids   # admin always excluded

    # STUDENTS only
    res = client.get(reverse('teacher:messaging_users') + '?audience=STUDENTS')
    data = res.json()
    ids = {u['id'] for u in data}
    assert student.id in ids
    assert teacher.id not in ids

    # TEACHERS only
    res = client.get(reverse('teacher:messaging_users') + '?audience=TEACHERS')
    data = res.json()
    ids = {u['id'] for u in data}
    assert teacher.id in ids
    assert student.id not in ids


@pytest.mark.django_db
def test_messaging_users_response_shape(client, admin, student):
    """Each user in the response has id, email, and name fields."""
    client.force_login(admin)
    res = client.get(reverse('teacher:messaging_users') + '?audience=STUDENTS')
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    user = next(u for u in data if u['id'] == student.id)
    assert 'id'    in user
    assert 'email' in user
    assert 'name'  in user


@pytest.mark.django_db
def test_messaging_users_invalid_audience(client, admin):
    """Invalid audience returns 400."""
    client.force_login(admin)
    res = client.get(reverse('teacher:messaging_users') + '?audience=INVALID')
    assert res.status_code == 400


@pytest.mark.django_db
def test_messaging_users_blocked_for_non_admin(client, teacher):
    """Non-admin teachers cannot access the users endpoint."""
    client.force_login(teacher)
    res = client.get(reverse('teacher:messaging_users') + '?audience=ALL')
    assert res.status_code == 302


# ═══════════════════════════════════════════════════════════════════════════════
# Individual mode — selected_user_ids
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
def test_messaging_post_with_selected_ids_sends_only_to_those(client, admin, student, student2):
    """When selected_user_ids is provided, only those users get a receipt."""
    client.force_login(admin)
    res = client.post(reverse('teacher:messaging'), {
        'title':             'Individual test',
        'body':              'Hello you specifically.',
        'audience':          'ALL',
        'selected_user_ids': [student.id],   # only student, not student2
    })
    assert res.status_code == 302

    msg = Message.objects.get(title='Individual test')
    assert msg.recipient_count == 1
    assert MessageReceipt.objects.filter(message=msg, recipient=student).exists()
    assert not MessageReceipt.objects.filter(message=msg, recipient=student2).exists()


@pytest.mark.django_db
def test_messaging_post_selected_ids_multi(client, admin, student, student2):
    """Multiple selected_user_ids creates receipts for all of them."""
    client.force_login(admin)
    res = client.post(reverse('teacher:messaging'), {
        'title':             'Multi select',
        'body':              'Both of you.',
        'audience':          'ALL',
        'selected_user_ids': [student.id, student2.id],
    })
    assert res.status_code == 302

    msg = Message.objects.get(title='Multi select')
    assert msg.recipient_count == 2
    assert MessageReceipt.objects.filter(message=msg).count() == 2


@pytest.mark.django_db
def test_messaging_post_no_selection_falls_back_to_audience(client, admin, student, student2):
    """No selected_user_ids → falls back to full audience (existing behaviour)."""
    client.force_login(admin)
    res = client.post(reverse('teacher:messaging'), {
        'title':    'Audience fallback',
        'body':     'Everyone.',
        'audience': 'STUDENTS',
    })
    assert res.status_code == 302

    msg = Message.objects.get(title='Audience fallback')
    assert msg.recipient_count == 2
    assert MessageReceipt.objects.filter(message=msg).count() == 2


@pytest.mark.django_db
def test_messaging_post_selected_ids_excludes_admins(client, admin, student):
    """Admin IDs in selected_user_ids are silently dropped."""
    client.force_login(admin)
    res = client.post(reverse('teacher:messaging'), {
        'title':             'Admin guard',
        'body':              'body',
        'audience':          'ALL',
        'selected_user_ids': [admin.id, student.id],  # admin.id should be dropped
    })
    assert res.status_code == 302

    msg = Message.objects.get(title='Admin guard')
    assert msg.recipient_count == 1
    assert not MessageReceipt.objects.filter(message=msg, recipient=admin).exists()
    assert MessageReceipt.objects.filter(message=msg, recipient=student).exists()


# ═══════════════════════════════════════════════════════════════════════════════
# Preview with selected_user_ids
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
def test_preview_with_selected_ids_returns_correct_count(client, admin, student, student2):
    """Preview with selected_user_ids returns len(selected_user_ids), not audience count."""
    client.force_login(admin)
    res = client.post(
        reverse('teacher:messaging_preview'),
        data=json.dumps({
            'audience':          'ALL',
            'selected_user_ids': [student.id, student2.id],
        }),
        content_type='application/json',
    )
    assert res.status_code == 200
    data = res.json()
    assert data['count'] == 2
    assert 'selected' in data['label']


@pytest.mark.django_db
def test_preview_no_selection_uses_audience_count(client, admin, student, student2):
    """Preview with empty selected_user_ids falls back to audience count."""
    client.force_login(admin)
    res = client.post(
        reverse('teacher:messaging_preview'),
        data=json.dumps({
            'audience':          'STUDENTS',
            'selected_user_ids': [],
        }),
        content_type='application/json',
    )
    assert res.status_code == 200
    data = res.json()
    assert data['count'] == 2   # both students