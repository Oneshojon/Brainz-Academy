from django.urls import path
from teacher.health_views import health_dashboard, health_status_json, reset_circuit_view
 
app_name = 'health'
 
urlpatterns = [
    path('',        health_dashboard,    name='dashboard'),
    path('json/',   health_status_json,  name='json'),
    path('reset/',  reset_circuit_view,  name='reset'),
]