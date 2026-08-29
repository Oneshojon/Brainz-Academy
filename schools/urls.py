from django.urls import path

from . import views

app_name = 'schools'

urlpatterns = [
    path('plans/', views.SchoolPlanListView.as_view(), name='plan-list'),
    path('register/', views.SchoolRegisterView.as_view(), name='register'),
    path('payments/callback/', views.school_payment_callback, name='payment-callback'),
    path('payments/webhook/', views.school_paystack_webhook, name='payment-webhook'),

    # ── Admin-management (IsSchoolAdmin) ────────────────────────────────
    path('terms/', views.AcademicTermListCreateView.as_view(), name='term-list'),
    path('terms/<int:pk>/', views.AcademicTermDetailView.as_view(), name='term-detail'),

    path('cohorts/', views.CohortListCreateView.as_view(), name='cohort-list'),
    path('cohorts/<int:pk>/', views.CohortDetailView.as_view(), name='cohort-detail'),

    path('staff/', views.SchoolStaffListView.as_view(), name='staff-list'),
    path('invites/', views.SchoolInviteCreateView.as_view(), name='invite-create'),
    path('invites/redeem/', views.SchoolInviteRedeemView.as_view(), name='invite-redeem'),

    path('class-groups/', views.ClassGroupListCreateView.as_view(), name='classgroup-list'),
    path('class-groups/<int:pk>/', views.ClassGroupDetailView.as_view(), name='classgroup-detail'),
]