from django.urls import path
from . import past_paper_views

app_name = 'past_papers'

urlpatterns = [
    path('', past_paper_views.past_papers_boards, name='past_papers_boards'),
    path('papers/', past_paper_views.past_papers, name='past_papers'),

]