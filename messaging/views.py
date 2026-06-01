"""
messaging/views.py

Recipient-facing views — accessible to any authenticated user.

  inbox      GET  /messaging/inbox/       Full inbox with read/unread state
  mark_read  POST /messaging/mark-read/   Mark one or all receipts as read
"""

import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_POST

from messaging.cache_utils import invalidate_unread_count
from messaging.models import MessageReceipt


@login_required
def inbox(request):
    """
    Display all messages addressed to the current user, newest first.

    One query: select_related pulls message + sender in the same JOIN.
    No N+1: sender name comes from the prefetched message row.
    """
    receipts = (
        MessageReceipt.objects
        .filter(recipient=request.user)
        .select_related('message', 'message__sender')
        .order_by('-message__sent_at')
    )

    # Evaluate once — split in Python, no second query
    receipts_list = list(receipts)
    unread = [r for r in receipts_list if not r.is_read]
    read   = [r for r in receipts_list if r.is_read]

    return render(request, 'messaging/inbox.html', {
        'unread': unread,
        'read':   read,
        'total':  len(receipts_list),
    })


@login_required
@require_POST
def mark_read(request):
    """
    Mark one receipt or all receipts as read.

    POST body (JSON):
        { "receipt_id": 42 }      — mark a single receipt
        { "mark_all": true }      — mark every unread receipt for this user

    Returns JSON { "success": true, "marked": int }
    Busts the per-user unread count cache after any write.
    """
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    receipt_id = data.get('receipt_id')
    mark_all   = data.get('mark_all', False)

    if not receipt_id and not mark_all:
        return JsonResponse(
            {'error': 'Provide receipt_id or mark_all=true.'}, status=400
        )

    now = timezone.now()

    if mark_all:
        # Single SQL UPDATE — no per-row loop
        marked = (
            MessageReceipt.objects
            .filter(recipient=request.user, is_read=False)
            .update(is_read=True, read_at=now)
        )
    else:
        try:
            receipt = MessageReceipt.objects.get(
                id=receipt_id,
                recipient=request.user,  # ownership guard
            )
        except MessageReceipt.DoesNotExist:
            return JsonResponse({'error': 'Receipt not found.'}, status=404)

        if not receipt.is_read:
            receipt.is_read = True
            receipt.read_at = now
            receipt.save(update_fields=['is_read', 'read_at'])
            marked = 1
        else:
            marked = 0

    # Bust cached unread count so the bell icon updates on next page load
    invalidate_unread_count(request.user.id)

    return JsonResponse({'success': True, 'marked': marked})