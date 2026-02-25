from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from .models import Subject, Topic, ExamBoard, ExamSeries, Question
from .serializers import SubjectSerializer, TopicSerializer, ExamBoardSerializer, QuestionSerializer
from .permissions import IsTeacher


class SubjectListView(generics.ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class ExamBoardListView(generics.ListAPIView):
    queryset = ExamBoard.objects.all()
    serializer_class = ExamBoardSerializer


class TopicListView(generics.ListAPIView):
    """Returns topics filtered by subject."""
    serializer_class = TopicSerializer

    def get_queryset(self):
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            return Topic.objects.filter(subject_id=subject_id)
        return Topic.objects.none()


class AvailableYearsView(APIView):
    """Returns distinct years available for a given exam board and subject."""

    def get(self, request):
        exam_board_id = request.query_params.get('exam_board')
        subject_id = request.query_params.get('subject')

        qs = ExamSeries.objects.all()
        if exam_board_id:
            qs = qs.filter(exam_board_id=exam_board_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        years = sorted(qs.values_list('year', flat=True).distinct())
        return Response({'years': years})


class GenerateQuestionsView(APIView):
    """Teacher-only endpoint to fetch questions based on filters."""
    permission_classes = [IsTeacher]

    def post(self, request):
        data = request.data

        exam_board_id = data.get('exam_board')
        subject_id = data.get('subject')
        years = data.get('years', [])           # list of years
        sitting = data.get('sitting')
        question_type = data.get('question_type')
        topics = data.get('topics', [])          # list of topic ids
        difficulty = data.get('difficulty')
        num_questions = data.get('num_questions')

        qs = Question.objects.all()

        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if question_type:
            qs = qs.filter(question_type=question_type)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if topics:
            qs = qs.filter(topics__id__in=topics).distinct()

        # Filter through exam series
        series_qs = ExamSeries.objects.all()
        if exam_board_id:
            series_qs = series_qs.filter(exam_board_id=exam_board_id)
        if years:
            series_qs = series_qs.filter(year__in=years)
        if sitting:
            series_qs = series_qs.filter(sitting=sitting)
        if subject_id:
            series_qs = series_qs.filter(subject_id=subject_id)

        if any([exam_board_id, years, sitting]):
            qs = qs.filter(exam_series__in=series_qs)

        if num_questions:
            qs = qs[:int(num_questions)]

        serializer = QuestionSerializer(qs, many=True, context={'request': request})
        return Response({'count': len(serializer.data), 'questions': serializer.data})