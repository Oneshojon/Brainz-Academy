"""
contact/forms.py

ModelForm for the general Contact Us submission. Includes a honeypot
field for lightweight bot protection — no external captcha dependency.
"""

from django import forms

from .models import ContactMessage


class ContactMessageForm(forms.ModelForm):
    """
    Public-facing contact form.

    `honeypot` is not a model field — it's a hidden trap. Real users never
    see or fill it (hidden off-screen via CSS rather than display:none, so
    unsophisticated bots that skip display:none fields still get caught).
    A filled honeypot is treated as spam in clean_honeypot().
    """

    honeypot = forms.CharField(required=False, widget=forms.HiddenInput())

    class Meta:
        model = ContactMessage
        fields = ["category", "name", "email", "subject", "message"]
        widgets = {
            "category": forms.Select(attrs={"class": "form-select"}),
            "name": forms.TextInput(attrs={
                "class": "form-input", "maxlength": 120, "placeholder": "Your full name",
            }),
            "email": forms.EmailInput(attrs={
                "class": "form-input", "placeholder": "you@example.com",
            }),
            "subject": forms.TextInput(attrs={
                "class": "form-input", "maxlength": 150, "placeholder": "What's this about?",
            }),
            "message": forms.Textarea(attrs={
                "class": "form-textarea", "rows": 6, "placeholder": "Tell us more...",
            }),
        }

    def clean_honeypot(self):
        value = self.cleaned_data.get("honeypot")
        if value:
            raise forms.ValidationError("Spam detected.")
        return value

    def clean_message(self):
        message = self.cleaned_data.get("message", "").strip()
        if len(message) < 10:
            raise forms.ValidationError("Please provide a bit more detail (at least 10 characters).")
        return message