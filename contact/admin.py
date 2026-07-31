"""
contact/admin.py
"""

from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "category", "status", "name", "email", "created_at")
    list_filter = ("category", "status", "created_at")
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = (
        "name", "email", "subject", "message", "ip_address", "created_at", "updated_at", "user",
    )
    # Avoids an N+1 query on the `user` FK when rendering each row of the changelist.
    list_select_related = ("user",)
    actions = ["mark_resolved", "mark_in_progress"]
    date_hierarchy = "created_at"

    @admin.action(description="Mark selected messages as Resolved")
    def mark_resolved(self, request, queryset):
        updated = queryset.update(status=ContactMessage.Status.RESOLVED)
        self.message_user(request, f"{updated} message(s) marked as Resolved.")

    @admin.action(description="Mark selected messages as In Progress")
    def mark_in_progress(self, request, queryset):
        updated = queryset.update(status=ContactMessage.Status.IN_PROGRESS)
        self.message_user(request, f"{updated} message(s) marked as In Progress.")