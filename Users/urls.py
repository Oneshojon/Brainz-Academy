from django.urls import path
from . import views
from django.views.generic import TemplateView

app_name = 'Users'

urlpatterns = [
    path('dashboard/',  views.dashboard,   name='dashboard'),
    path('',            views.index,       name='index'),
    path('get-otp/',    views.request_otp, name='request_otp'),
    path('join/',       views.request_otp, name='join'),
    path('verify/',     views.verify_otp,  name='verify_otp'),
    path('logout_view/', views.logout_view, name='logout'),
    path('pricing/',    views.pricing,     name='pricing'),
    path('referrals/',  views.referrals,   name='referrals'),

    # ── Public SEO landing pages ──────────────────────────────────
    path('waec-past-questions/',  views.exam_board_landing, {'board_slug': 'waec-past-questions'},  name='waec_landing'),
    path('neco-past-questions/',  views.exam_board_landing, {'board_slug': 'neco-past-questions'},  name='neco_landing'),
    path('jamb-past-questions/',  views.exam_board_landing, {'board_slug': 'jamb-past-questions'},  name='jamb_landing'),
    path('waec-cbt-practice/',    views.exam_board_landing, {'board_slug': 'waec-cbt-practice'},    name='waec_practice_landing'),
    path('jamb-cbt-practice/',    views.exam_board_landing, {'board_slug': 'jamb-cbt-practice'},    name='jamb_practice_landing'),

    # Google Search Console verification
    path('googlec64a23d029f9bf57.html',
         TemplateView.as_view(
             template_name='googlec64a23d029f9bf57.html',
             content_type='text/html'
         )),
]