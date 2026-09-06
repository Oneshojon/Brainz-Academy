"""
Routes every /tools/* path to the same SPA shell (Test Builder + Lesson
Plan Generator). React Router (basename "/tools") handles navigation from
there, so a browser refresh on /tools/lesson-plans/7 still needs Django to
serve the shell rather than 404 — same pattern as schools/frontend_urls.py.
"""

from django.urls import path, re_path
from .views import index

app_name = 'frontend'

urlpatterns = [
    path('', index, name='frontend-index'),
    re_path(r'^(?P<subpath>.*)$', index, name='frontend-index-catchall'),
]