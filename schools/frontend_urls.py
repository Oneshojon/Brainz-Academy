"""
Routes every /school-plan/* path to the same SPA shell. React Router
handles navigation from there, so a browser refresh on /school-plan/admin
still needs Django to serve the shell rather than 404 — hence the catch-all.
"""

from django.urls import path, re_path

from . import frontend_views

app_name = 'schools_frontend'

urlpatterns = [
    path('', frontend_views.index, name='index'),
    re_path(r'^(?P<subpath>.*)$', frontend_views.index, name='index-catchall'),
]