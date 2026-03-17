from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('initialize/', views.initialize_payment, name='initialize'),
    path('callback/',   views.payment_callback,   name='callback'),
    path('webhook/',    views.paystack_webhook,    name='webhook'),
]