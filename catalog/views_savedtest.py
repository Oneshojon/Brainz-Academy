from django.db import transaction
from django.db.models import Prefetch
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
 
from catalog.models import (
    SavedTest, SavedTestQuestion, Question,
    FreeUsageTracker, UserSubscription,
)
from .serializers_savedtest import SavedTestListSerializer, SavedTestDetailSerializer
 
 
# ── Shared helpers ────────────────────────────────────────────────────────────
 
def _is_teacher_pro(user):
    """True if the user has full access — admin or active Teacher Pro subscription."""
    if getattr(user, 'is_admin', False) or getattr(user, 'is_staff', False):
        return True
    return UserSubscription.objects.filter(
        user=user,
        plan__plan_type='TEACHER_PRO',
        status='ACTIVE',
    ).exists()
 
 
def _get_or_create_tracker(user):
    tracker, _ = FreeUsageTracker.objects.get_or_create(user=user)
    return tracker
 
 
def _prefetch_questions_qs():
    """
    Reusable Prefetch for SavedTestQuestion → Question with all
    related data needed to restore builder state. One query per relation.
    """
    question_prefetch = Prefetch(
        'question__topics',
        to_attr='_topics_cache',
    )
    choices_prefetch = Prefetch(
        'question__choices',
        to_attr='_choices_cache',
    )
    return Prefetch(
        'test_questions',
        queryset=SavedTestQuestion.objects.select_related(
            'question',
            'question__exam_series',
            'question__exam_series__exam_board',
            'question__subject',
            'question__theory_answer',
        ).prefetch_related(
            question_prefetch,
            choices_prefetch,
        ).order_by('order'),
        to_attr='_test_questions_cache',
    )
 
 
# ── Views ─────────────────────────────────────────────────────────────────────
 
class SavedTestListView(APIView):
    """
    GET  /api/saved-tests/        → list teacher's saved tests (lightweight)
    POST /api/saved-tests/        → create a new saved test on first download
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        tests = (
            SavedTest.objects
            .filter(teacher=request.user)
            .only(
                'id', 'title', 'builder_mode', 'format', 'copy_type',
                'question_count', 'total_marks', 'created_at', 'updated_at',
            )
            .order_by('-updated_at')
        )
        return Response(SavedTestListSerializer(tests, many=True).data)
 
    def post(self, request):
        """
        Called on first download of a brand-new test.
        Checks free-tier trial limit before creating.
 
        Payload:
            title          str
            question_ids   list[int]         ordered
            custom_marks   dict[str, int]    {"<question_id>": marks}
            format         'pdf' | 'docx'
            copy_type      'student' | 'teacher'
            builder_mode   'manual' | 'random'
            total_marks    int
        """
        is_pro = _is_teacher_pro(request.user)
 
        if not is_pro:
            tracker = _get_or_create_tracker(request.user)
            if not tracker.can_use_test_builder():
                return Response(
                    {
                        'allowed': False,
                        'error': (
                            f"You've used all {FreeUsageTracker.FREE_TEST_BUILDER_TRIALS} "
                            f"free test builder trials. Upgrade to Teacher Pro to continue."
                        ),
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
 
        data         = request.data
        title        = (data.get('title') or 'Untitled Test').strip()[:255]
        question_ids = data.get('question_ids', [])
        custom_marks = data.get('custom_marks', {})   # {"<id>": marks}
        fmt          = data.get('format', 'pdf')
        copy_type    = data.get('copy_type', 'student')
        builder_mode = data.get('builder_mode', 'manual')
        total_marks  = data.get('total_marks', 0)
 
        if not question_ids:
            return Response({'error': 'No questions provided.'}, status=status.HTTP_400_BAD_REQUEST)
 
        with transaction.atomic():
            saved_test = SavedTest.objects.create(
                teacher       = request.user,
                title         = title,
                format        = fmt,
                copy_type     = copy_type,
                builder_mode  = builder_mode,
                question_count= len(question_ids),
                total_marks   = total_marks,
            )
 
            # Bulk-create through records preserving order and custom marks
            through_objs = [
                SavedTestQuestion(
                    saved_test   = saved_test,
                    question_id  = qid,
                    custom_marks = int(custom_marks.get(str(qid), 1)),
                    order        = idx,
                )
                for idx, qid in enumerate(question_ids)
            ]
            SavedTestQuestion.objects.bulk_create(through_objs, ignore_conflicts=True)
 
            # Consume a trial for free-tier teachers
            if not is_pro:
                tracker.increment_test_builder_trial()
 
        return Response(
            {'id': saved_test.id, 'trials_remaining': tracker.trials_remaining() if not is_pro else None},
            status=status.HTTP_201_CREATED,
        )
 
 
class SavedTestDetailView(APIView):
    """
    GET    /api/saved-tests/<pk>/   → full test with questions (reopen in builder)
    PATCH  /api/saved-tests/<pk>/   → update title, questions, marks, order
    DELETE /api/saved-tests/<pk>/   → delete
    """
    permission_classes = [IsAuthenticated]
 
    def _get_test(self, pk, user):
        try:
            return (
                SavedTest.objects
                .prefetch_related(_prefetch_questions_qs())
                .get(pk=pk, teacher=user)
            )
        except SavedTest.DoesNotExist:
            return None
 
    def get(self, request, pk):
        test = self._get_test(pk, request.user)
        if not test:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(
            SavedTestDetailSerializer(test, context={'request': request}).data
        )
 
    def patch(self, request, pk):
        """
        Update an existing test in place (re-download after edits).
        Does NOT consume a new trial — test already exists.
 
        Payload (all optional):
            title          str
            question_ids   list[int]
            custom_marks   dict[str, int]
            format         str
            copy_type      str
            total_marks    int
        """
        try:
            test = SavedTest.objects.get(pk=pk, teacher=request.user)
        except SavedTest.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
 
        data         = request.data
        question_ids = data.get('question_ids')
        custom_marks = data.get('custom_marks', {})
 
        update_fields = ['updated_at']
 
        if 'title' in data:
            test.title = (data['title'] or 'Untitled Test').strip()[:255]
            update_fields.append('title')
        if 'format' in data:
            test.format = data['format']
            update_fields.append('format')
        if 'copy_type' in data:
            test.copy_type = data['copy_type']
            update_fields.append('copy_type')
        if 'total_marks' in data:
            test.total_marks = data['total_marks']
            update_fields.append('total_marks')
 
        with transaction.atomic():
            if question_ids is not None:
                # Replace all through records atomically
                SavedTestQuestion.objects.filter(saved_test=test).delete()
                through_objs = [
                    SavedTestQuestion(
                        saved_test   = test,
                        question_id  = qid,
                        custom_marks = int(custom_marks.get(str(qid), 1)),
                        order        = idx,
                    )
                    for idx, qid in enumerate(question_ids)
                ]
                SavedTestQuestion.objects.bulk_create(through_objs)
                test.question_count = len(question_ids)
                update_fields.append('question_count')
 
            test.save(update_fields=update_fields)
 
        return Response({'id': test.id})
 
    def delete(self, request, pk):
        deleted, _ = SavedTest.objects.filter(pk=pk, teacher=request.user).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
 
 
class SavedTestCloneView(APIView):
    """
    POST /api/saved-tests/<pk>/clone/
    Clones an existing test as a new record (uses a trial for free tier).
    """
    permission_classes = [IsAuthenticated]
 
    def post(self, request, pk):
        is_pro = _is_teacher_pro(request.user)
 
        if not is_pro:
            tracker = _get_or_create_tracker(request.user)
            if not tracker.can_use_test_builder():
                return Response(
                    {'allowed': False, 'error': 'No free trials remaining.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
 
        try:
            source = (
                SavedTest.objects
                .prefetch_related(
                    Prefetch(
                        'test_questions',
                        queryset=SavedTestQuestion.objects.order_by('order'),
                    )
                )
                .get(pk=pk, teacher=request.user)
            )
        except SavedTest.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
 
        with transaction.atomic():
            clone = SavedTest.objects.create(
                teacher       = request.user,
                title         = f"{source.title} (Copy)",
                format        = source.format,
                copy_type     = source.copy_type,
                builder_mode  = source.builder_mode,
                question_count= source.question_count,
                total_marks   = source.total_marks,
                cloned_from   = source,
            )
            SavedTestQuestion.objects.bulk_create([
                SavedTestQuestion(
                    saved_test   = clone,
                    question_id  = stq.question_id,
                    custom_marks = stq.custom_marks,
                    order        = stq.order,
                )
                for stq in source.test_questions.all()
            ])
 
            if not is_pro:
                tracker.increment_test_builder_trial()
 
        return Response({'id': clone.id}, status=status.HTTP_201_CREATED)
 
 
class TestBuilderAccessView(APIView):
    """
    GET /api/test-builder-access/
    Returns access metadata used by both random and manual builder.
 
    Response shape (matches what QuestionGeneratorForm already consumes):
        {
            allowed:           bool,
            is_free:           bool,
            pdf_only:          bool,
            max_questions:     int,
            trials_remaining:  int,
            reason:            str   (only when not allowed)
        }
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        is_pro = _is_teacher_pro(request.user)
 
        if is_pro:
            return Response({
                'allowed':          True,
                'is_free':          False,
                'pdf_only':         False,
                'max_questions':    200,
                'trials_remaining': None,
            })
 
        tracker = _get_or_create_tracker(request.user)
        remaining = tracker.trials_remaining()
        allowed   = tracker.can_use_test_builder()
 
        return Response({
            'allowed':          allowed,
            'is_free':          True,
            'pdf_only':         True,
            'max_questions':    FreeUsageTracker.FREE_QUESTION_LIMIT,
            'trials_remaining': remaining,
            'reason': (
                None if allowed else
                f"You've used all {FreeUsageTracker.FREE_TEST_BUILDER_TRIALS} free trials. "
                f"Upgrade to Teacher Pro to continue."
            ),
        })
