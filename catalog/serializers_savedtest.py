from rest_framework import serializers
from .models import SavedTest, SavedTestQuestion, Question, Choice, TheoryAnswer
 
 
class SavedTestQuestionDetailSerializer(serializers.ModelSerializer):
    """
    Full question data for restoring builder state.
    Mirrors QuestionSerializer but reads custom_marks and order
    from the through model.
    """
    # Question fields
    id              = serializers.IntegerField(source='question.id')
    question_number = serializers.IntegerField(source='question.question_number')
    question_type   = serializers.CharField(source='question.question_type')
    content         = serializers.CharField(source='question.content')
    image           = serializers.SerializerMethodField()
    marks           = serializers.IntegerField(source='question.marks')
    difficulty      = serializers.CharField(source='question.difficulty', allow_null=True)
    exam_year       = serializers.SerializerMethodField()
    exam_board      = serializers.SerializerMethodField()
    sitting         = serializers.SerializerMethodField()
    subject_name    = serializers.SerializerMethodField()
    topic_names     = serializers.SerializerMethodField()
    choices         = serializers.SerializerMethodField()
    theory_answer   = serializers.SerializerMethodField()
 
    # Through-model fields
    custom_marks    = serializers.IntegerField()
    order           = serializers.IntegerField()
 
    class Meta:
        model  = SavedTestQuestion
        fields = [
            'id', 'question_number', 'question_type', 'content', 'image',
            'marks', 'difficulty',
            'exam_year', 'exam_board', 'sitting', 'subject_name', 'topic_names',
            'choices', 'theory_answer',
            'custom_marks', 'order',
        ]
 
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.question.image and request:
            return request.build_absolute_uri(obj.question.image.url)
        return None
 
    def get_exam_year(self, obj):
        return obj.question.exam_series.year if obj.question.exam_series else None
 
    def get_exam_board(self, obj):
        if obj.question.exam_series:
            return obj.question.exam_series.exam_board.abbreviation
        return None
 
    def get_sitting(self, obj):
        return obj.question.exam_series.sitting if obj.question.exam_series else None
 
    def get_subject_name(self, obj):
        return obj.question.subject.name
 
    def get_topic_names(self, obj):
        return [t.name for t in obj.question.topics.all()]
 
    def get_choices(self, obj):
        if obj.question.question_type != 'OBJ':
            return []
        return [
            {
                'id':          c.id,
                'label':       c.label,
                'choice_text': c.choice_text,
                'is_correct':  c.is_correct,
            }
            for c in obj.question.choices.all()
        ]
 
    def get_theory_answer(self, obj):
        ta = getattr(obj.question, 'theory_answer', None)
        if not ta:
            return None
        return {'id': ta.id, 'content': ta.content, 'marking_guide': ta.marking_guide}
 
 
class SavedTestListSerializer(serializers.ModelSerializer):
    """Lightweight — for My Tests list. No question detail."""
 
    class Meta:
        model  = SavedTest
        fields = [
            'id', 'title', 'builder_mode', 'format', 'copy_type',
            'question_count', 'total_marks',
            'created_at', 'updated_at',
        ]
 
 
class SavedTestDetailSerializer(serializers.ModelSerializer):
    """Full test with all question data — for reopening in builder."""
    test_questions = SavedTestQuestionDetailSerializer(many=True, read_only=True)
 
    class Meta:
        model  = SavedTest
        fields = [
            'id', 'title', 'builder_mode', 'format', 'copy_type',
            'question_count', 'total_marks',
            'cloned_from',
            'created_at', 'updated_at',
            'test_questions',
        ]
