from django.urls import path
from . import views

app_name = 'practice'

urlpatterns = [
    path('past-papers/', views.past_papers, name='past_papers'),
    # Practice home — exam/session selection
    path('', views.practice_home, name='practice_home'),

    # Start a session (POST)
    path('start/', views.start_session, name='start_session'),

    # CBT exam page
    path('exam/<int:session_id>/', views.exam_page, name='exam_page'),

    # Submit a single answer (AJAX POST)
    path('submit-answer/', views.submit_answer, name='submit_answer'),

    # Finish session and calculate score (POST)
    path('exam/<int:session_id>/finish/', views.finish_session, name='finish_session'),

    # Results and answer review
    path('results/<int:session_id>/', views.results_page, name='results_page'),

    # History
    path('history/', views.history, name='history'),

    # Analytics
    path('analytics/', views.analytics, name='analytics'),

    # Leaderboard
    path('leaderboard/', views.leaderboard, name='leaderboard'),

    # Bookmarks
    path('bookmarks/', views.bookmarks, name='bookmarks'),

    # Toggle bookmark (AJAX POST)
    path('toggle-bookmark/', views.toggle_bookmark, name='toggle_bookmark'),

    # Revision mode
    path('revision/', views.revision, name='revision'),

    # Referral
    path('referral/', views.referral, name='referral'),
]