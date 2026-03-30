from django.urls import path
from .views import (
    SubjectListView, ExamBoardListView, TestBuilderAccessView,
    TopicListView, AvailableYearsView, GenerateQuestionsView, QuestionDownloadView,
    ThemeListView, TopicsByThemeView, QuestionsByTopicView, QuestionDetailView, FeatureFlagsView
)

app_name = 'catalog'

urlpatterns = [
    path('feature-flags/', FeatureFlagsView.as_view(), name='feature-flags'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('questions/download/', QuestionDownloadView.as_view(), name='question-download'),
    path('subjects/', SubjectListView.as_view(), name='subject-list'),
    path('exam-boards/', ExamBoardListView.as_view(), name='examboard-list'),
    path('topics/', TopicListView.as_view(), name='topic-list'),
    path('years/', AvailableYearsView.as_view(), name='available-years'),
    path('questions/generate/', GenerateQuestionsView.as_view(), name='generate-questions'),
    path('test-builder-access/', TestBuilderAccessView.as_view(), name='test-builder-access'),
    path('themes/',             ThemeListView.as_view(),       name='theme-list'),
    path('topics-by-theme/',    TopicsByThemeView.as_view(),   name='topics-by-theme'),
    path('questions-by-topic/', QuestionsByTopicView.as_view(), name='questions-by-topic'),

]