from rest_framework import serializers
from .models import Subject, Topic, ExamBoard, ExamSeries, Question, Choice, TheoryAnswer


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name']


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name']


class ExamBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamBoard
        fields = ['id', 'name', 'abbreviation']


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'label', 'choice_text', 'is_correct', 'explanation', 'video_url']


class TheoryAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TheoryAnswer
        fields = ['id', 'content', 'marking_guide', 'video_url']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    theory_answer = TheoryAnswerSerializer(read_only=True)
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'question_number', 'question_type', 'content',
            'image', 'marks', 'difficulty', 'topics', 'choices', 'theory_answer'
        ]