from django.urls import path
from . import views

app_name = 'Users'

urlpatterns = [
    path('', views.index, name='index'),
    path('get-otp', views.request_otp, name='request_otp'),
    path('verify', views.verify_otp, name="verify_otp"),
    path('logout_view', views.logout_view, name='logout'),
]