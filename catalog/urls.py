from django.urls import path
from .views import (
    SubjectListView, ExamBoardListView,
    TopicListView, AvailableYearsView, GenerateQuestionsView
)

app_name = 'catalog'

urlpatterns = [
    path('subjects/', SubjectListView.as_view(), name='subject-list'),
    path('exam-boards/', ExamBoardListView.as_view(), name='examboard-list'),
    path('topics/', TopicListView.as_view(), name='topic-list'),
    path('years/', AvailableYearsView.as_view(), name='available-years'),
    path('questions/generate/', GenerateQuestionsView.as_view(), name='generate-questions'),
]