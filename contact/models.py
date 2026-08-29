"""
contact/models.py

Stores Contact Us submissions for the general Inquiry / Suggestion /
Complaint track. The "Work With the Developer" card on the same page is
static (direct email/LinkedIn/X links) and has no model — nothing to store.
"""

from django.conf import settings
from django.db import models


class ContactMessage(models.Model):
    """A single Contact Us form submission."""

    class Category(models.TextChoices):
        INQUIRY = "INQUIRY", "Inquiry"
        SUGGESTION = "SUGGESTION", "Suggestion"
        COMPLAINT = "COMPLAINT", "Complaint"

    class Status(models.TextChoices):
        NEW = "NEW", "New"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="contact_messages",
        help_text="Set automatically when the sender is logged in. Null for anonymous submissions.",
    )
    category = models.CharField(max_length=20, choices=Category.choices)
    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=150)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["category", "status", "-created_at"], name="contact_cat_status_idx"),
        ]

    def __str__(self):
        return f"[{self.category}] {self.subject} — {self.email}"