# ══════════════════════════════════════════════════════════════════════════════
# Full replacement for catalog/serializers.py
# ══════════════════════════════════════════════════════════════════════════════
from rest_framework import serializers
from .models import Subject, Topic, Theme, ExamBoard, ExamSeries, Question, Choice, TheoryAnswer


class SubjectSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model  = Subject
        fields = ['id', 'name', 'question_count']


class ThemeSerializer(serializers.ModelSerializer):
    topic_count = serializers.SerializerMethodField()

    class Meta:
        model  = Theme
        fields = ['id', 'name', 'order', 'topic_count']

    def get_topic_count(self, obj):
        # Use annotated value if available, fall back to query
        if hasattr(obj, 'topic_count'):
            return obj.topic_count
        return obj.topics.count()


class TopicSerializer(serializers.ModelSerializer):
    theme_id   = serializers.IntegerField(source='theme.id',   read_only=True, allow_null=True)
    theme_name = serializers.CharField(source='theme.name', read_only=True, allow_null=True)

    class Meta:
        model  = Topic
        fields = ['id', 'name', 'theme_id', 'theme_name']


class QuestionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the question list panel in the test builder.
    Does NOT include choices or theory_answer — those are expensive and
    only needed when previewing a single question.
    """
    exam_year    = serializers.IntegerField(source='exam_series.year',                read_only=True, allow_null=True)
    exam_board   = serializers.CharField(source='exam_series.exam_board.abbreviation', read_only=True, allow_null=True)
    sitting      = serializers.CharField(source='exam_series.sitting',                read_only=True, allow_null=True)
    subject_name = serializers.CharField(source='subject.name',                       read_only=True, allow_null=True)
    topic_names  = serializers.SerializerMethodField()
 
    class Meta:
        model  = Question
        fields = [
            'id', 'question_number', 'question_type',
            'marks', 'difficulty',
            'exam_year', 'exam_board', 'sitting', 'subject_name',
            'topic_names',
        ]
 
    def get_topic_names(self, obj):
        # topics already prefetched — no extra query
        return [t.name for t in obj.topics.all()]



class ExamBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ExamBoard
        fields = ['id', 'name', 'abbreviation']


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Choice
        fields = ['id', 'label', 'choice_text', 'is_correct', 'explanation', 'video_url']


class TheoryAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TheoryAnswer
        fields = ['id', 'content', 'marking_guide', 'video_url']


class QuestionSerializer(serializers.ModelSerializer):
    choices       = ChoiceSerializer(many=True, read_only=True)
    theory_answer = TheoryAnswerSerializer(read_only=True)
    topics        = TopicSerializer(many=True, read_only=True)
    exam_year     = serializers.IntegerField(source='exam_series.year',               read_only=True, allow_null=True)
    exam_board    = serializers.CharField(source='exam_series.exam_board.abbreviation', read_only=True, allow_null=True)
    sitting       = serializers.CharField(source='exam_series.sitting',               read_only=True, allow_null=True)
    subject_name  = serializers.CharField(source='subject.name',                      read_only=True, allow_null=True)

    class Meta:
        model  = Question
        fields = [
            'id', 'question_number', 'question_type', 'content', 'content_after_image',
            'image', 'marks', 'difficulty',
            'topics', 'choices', 'theory_answer',
            'exam_year', 'exam_board', 'sitting', 'subject_name',
        ]