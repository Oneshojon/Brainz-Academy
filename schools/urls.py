from django.urls import path

from . import views

app_name = 'schools'

urlpatterns = [
    path('plans/', views.SchoolPlanListView.as_view(), name='plan-list'),
    path('register/', views.SchoolRegisterView.as_view(), name='register'),
    path('payments/callback/', views.school_payment_callback, name='payment-callback'),
    path('payments/webhook/', views.school_paystack_webhook, name='payment-webhook'),
]