from django.urls import path
from . import views

app_name = 'teacher'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('question-sets/', views.question_sets, name='question_sets'),
    path('students/', views.students, name='students'),
    path('upload/', views.upload_questions, name='upload'),
    path('feature-flags/', views.feature_flags_page, name='feature_flags'),
    path('feature-flags/toggle/', views.toggle_flag, name='toggle_flag'),
    path('referral-analytics/', views.referral_analytics, name='referral_analytics'),
    path('upload-past-paper/', views.upload_past_paper, name='upload_past_paper'),
    path('upload-notes/', views.upload_notes, name='upload_notes'),
    path('upload-docx/', views.upload_docx, name='upload_docx'),
    path('sessions/', views.session_history, name='session_history'),
    path('lesson-notes/download-docx/<int:note_id>/', views.download_lesson_note_docx, name='download_lesson_note_docx'),
    path('topics-for-subject/<int:subject_id>/', views.topics_for_subject, name='topics_for_subject'),

    # ── Messaging (admin-only broadcast) ─────────────────────────────────────
    path('messaging/',          views.messaging,          name='messaging'),
    path('messaging/preview/',  views.messaging_preview,  name='messaging_preview'),
    path('messaging/history/',  views.messaging_history,  name='messaging_history'),
    path('messaging/users/',    views.messaging_users,    name='messaging_users'),
]