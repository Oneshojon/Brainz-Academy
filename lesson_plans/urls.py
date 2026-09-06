from django.urls import path

from .views import (
    LessonPlanDetailView, LessonPlanDownloadView, LessonPlanGenerateView, LessonPlanListView,
)

app_name = 'lesson_plans'

urlpatterns = [
    path('', LessonPlanListView.as_view(), name='list'),
    path('<int:pk>/', LessonPlanDetailView.as_view(), name='detail'),
    path('<int:pk>/generate/', LessonPlanGenerateView.as_view(), name='generate'),
    path('<int:pk>/download/', LessonPlanDownloadView.as_view(), name='download'),
]