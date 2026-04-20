# teacher/lesson_note_urls.py
from django.urls import path
from . import views

app_name = 'lessonnotes'

urlpatterns = [
    path('', views.lesson_notes, name='lesson_notes'),
    # add any other lesson-note sub-paths here as they grow
]