from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from catalog.models import LessonPlan
from .permissions import HasLessonPlanAccess
from .serializers import (
    LessonPlanCreateSerializer, LessonPlanDetailSerializer, LessonPlanListSerializer,
)


def _build_prompt(plan: LessonPlan) -> str:
    """Builds the user prompt from a LessonPlan's stored input fields."""
    ability_label = dict(LessonPlan.ABILITY_CHOICES).get(plan.student_ability, plan.student_ability)
    class_size_line = f"Class size: {plan.class_size} students\n" if plan.class_size else ""

    return (
        f"Subject: {plan.subject.name}\n"
        f"Class level: {plan.class_level}\n"
        f"Lesson duration: {plan.duration_minutes} minutes\n"
        f"{class_size_line}"
        f"Student ability level: {ability_label}\n"
        f"What this lesson covers: {plan.coverage}\n"
        + (f"Additional context: {plan.additional_notes}\n" if plan.additional_notes else "")
        + "\nProduce a complete, practical lesson plan for exactly this class and this "
          "scope — objectives that are specific and measurable, activities paced to "
          "the stated ability level and class size, a timing breakdown that sums to "
          "the stated duration, and an assessment method that checks the stated "
          "objectives."
    )


class LessonPlanListView(APIView):
    """
    GET  /api/lesson-plans/   → list the teacher's own lesson plans (lightweight)
    POST /api/lesson-plans/   → create a new draft plan (input fields only, ungated)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = (
            LessonPlan.objects
            .filter(teacher=request.user)
            .select_related('subject')
            .only(
                'id', 'subject__name', 'coverage', 'curriculum', 'class_level',
                'student_ability', 'duration_minutes', 'is_generated',
                'created_at', 'updated_at',
            )
        )
        return Response(LessonPlanListSerializer(plans, many=True).data)

    def post(self, request):
        serializer = LessonPlanCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save(teacher=request.user)
        return Response(LessonPlanDetailSerializer(plan).data, status=status.HTTP_201_CREATED)


class LessonPlanDetailView(APIView):
    """
    GET    /api/lesson-plans/<pk>/   → full plan
    DELETE /api/lesson-plans/<pk>/   → delete a plan the teacher owns
    """
    permission_classes = [IsAuthenticated]

    def _get_plan(self, pk, user):
        try:
            return LessonPlan.objects.select_related('subject').get(pk=pk, teacher=user)
        except LessonPlan.DoesNotExist:
            return None

    def get(self, request, pk):
        plan = self._get_plan(pk, request.user)
        if not plan:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(LessonPlanDetailSerializer(plan).data)

    def delete(self, request, pk):
        deleted, _ = LessonPlan.objects.filter(pk=pk, teacher=request.user).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LessonPlanGenerateView(APIView):
    """
    POST /api/lesson-plans/<pk>/generate/
    The AI-gated step. HasLessonPlanAccess enforces has_ai_feature_access().
    Cache-first: if already generated, returns stored content without calling the API again.
    """
    permission_classes = [IsAuthenticated, HasLessonPlanAccess]

    def post(self, request, pk):
        try:
            plan = LessonPlan.objects.select_related('subject', 'teacher').get(
                pk=pk, teacher=request.user,
            )
        except LessonPlan.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if plan.is_generated:
            return Response({**LessonPlanDetailSerializer(plan).data, 'cached': True})

        from services.ai_service import AIUnavailableError, generate_lesson_plan

        try:
            sections = generate_lesson_plan(
                subject_name=plan.subject.name,
                curriculum=plan.curriculum,
                prompt=_build_prompt(plan),
            )
        except AIUnavailableError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        plan.objectives = sections['objectives']
        plan.activities = sections['activities']
        plan.timing_breakdown = sections['timing_breakdown']
        plan.assessment = sections['assessment']
        plan.is_generated = True
        plan.save(update_fields=[
            'objectives', 'activities', 'timing_breakdown', 'assessment',
            'is_generated', 'updated_at',
        ])

        return Response({**LessonPlanDetailSerializer(plan).data, 'cached': False})