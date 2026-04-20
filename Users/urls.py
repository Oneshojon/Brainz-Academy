from django.urls import path
from . import views
from django.views.generic import TemplateView

app_name = 'Users'

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('', views.index, name='index'),
    path('get-otp/', views.request_otp, name='request_otp'),
    path('join/', views.request_otp, name='join'),
    path('verify/', views.verify_otp, name="verify_otp"),
    path('logout_view/', views.logout_view, name='logout'),
    path('pricing/', views.pricing, name='pricing'),
    path('referrals/', views.referrals, name='referrals'),
    path('google1234abcd.html',
         TemplateView.as_view(
             template_name='google1234abcd.html',
             content_type='text/html'
         )),
]