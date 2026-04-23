from django.urls import path
from . import views

app_name = 'practice'

urlpatterns = [
    path('', views.practice_home, name='practice_home'),
    path('start/', views.start_session, name='start_session'),
    path('exam/<int:session_id>/', views.exam_page, name='exam_page'),
    path('submit-answer/', views.submit_answer, name='submit_answer'),
    path('exam/<int:session_id>/finish/', views.finish_session, name='finish_session'),
    path('results/<int:session_id>/', views.results_page, name='results_page'),
    path('history/', views.history, name='history'),
    path('analytics/', views.analytics, name='analytics'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('bookmarks/', views.bookmarks, name='bookmarks'),
    path('toggle-bookmark/', views.toggle_bookmark, name='toggle_bookmark'),
    path('revision/', views.revision, name='revision'),
    path('referral/', views.referral, name='referral'),

    # ── Question comments ─────────────────────────────────────────────────────
    path(
        'questions/<int:question_id>/comments/',
        views.question_comments,
        name='question_comments',
    ),
    path(
        'questions/<int:question_id>/comments/<int:comment_id>/delete/',
        views.delete_comment,
        name='delete_comment',
    ),
]