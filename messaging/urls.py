"""
messaging/urls.py  —  namespace: messaging

Recipient-facing routes only.
Admin compose/preview/history live in teacher/urls.py under the 'teacher' namespace.
"""

from django.urls import path
from . import views

app_name = 'messaging'

urlpatterns = [
    path('inbox/',      views.inbox,     name='inbox'),
    path('mark-read/',  views.mark_read, name='mark_read'),
]