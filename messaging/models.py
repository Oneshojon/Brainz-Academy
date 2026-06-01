"""
messaging/models.py

Two models:
  Message        — one record per admin broadcast
  MessageReceipt — one record per (message, recipient) pair

Index strategy:
  MessageReceipt(recipient, is_read) — bell-icon unread count (hits every page)
  MessageReceipt unique_together(message, recipient) — prevents duplicate delivery
  Message(sent_at) — history page ordering
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


class Message(models.Model):
    """
    Represents a single admin broadcast message.

    recipient_filter stores the raw filter params as JSON so the history
    page can display exactly who was targeted without re-running the query.

    recipient_count is a snapshot taken at send time — it may drift from
    the actual number of MessageReceipt rows if some deliveries failed, but
    is accurate for display purposes.
    """

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_messages',
    )
    title = models.CharField(max_length=255)
    body  = models.TextField()

    # JSON snapshot of the filter params used — for audit / history display
    recipient_filter = models.JSONField(
        default=dict,
        help_text='Filter params used to resolve recipients at send time.',
    )
    recipient_count = models.PositiveIntegerField(
        default=0,
        help_text='Snapshot of how many users were targeted.',
    )
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']
        indexes  = [models.Index(fields=['-sent_at'])]

    def __str__(self):
        return f'[{self.sent_at:%Y-%m-%d}] {self.title} → {self.recipient_count} recipients'


class MessageReceipt(models.Model):
    """
    One row per (message, recipient) pair.

    email_sent / email_error record per-recipient Brevo delivery state so
    the admin can diagnose failed deliveries from the history page.

    read_at is set once when the recipient first opens the message — never
    overwritten, recording the actual first-read timestamp.
    """

    message   = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='receipts',
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='message_receipts',
    )
    is_read     = models.BooleanField(default=False, db_index=True)
    read_at     = models.DateTimeField(null=True, blank=True)
    email_sent  = models.BooleanField(
        default=False,
        help_text='True when Brevo accepted the send request.',
    )
    email_error = models.TextField(
        blank=True,
        help_text='Brevo error message if delivery failed.',
    )

    class Meta:
        unique_together = ('message', 'recipient')
        indexes = [
            # Primary read path: unread count for bell icon, inbox listing
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        status = 'read' if self.is_read else 'unread'
        return f"{self.recipient.email} ← '{self.message.title}' ({status})"

    def mark_as_read(self):
        """Idempotent — only writes if not already read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])