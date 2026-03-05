from django.urls import path
from . import views

app_name = 'teacher'

urlpatterns = [
    path('upload-docx/', views.upload_docx, name='upload_docx'),
    path('', views.dashboard, name='dashboard'),
    path('question-sets/', views.question_sets, name='question_sets'),
    path('students/', views.students, name='students'),
    path('upload/', views.upload_questions, name='upload'),
    path('lesson-notes/', views.lesson_notes, name='lesson_notes'),
    path('lesson-notes/',  views.lesson_notes,       name='lesson_notes'),
    path('feature-flags/', views.feature_flags_page, name='feature_flags'),
    path('feature-flags/toggle/', views.toggle_flag, name='toggle_flag'),
]