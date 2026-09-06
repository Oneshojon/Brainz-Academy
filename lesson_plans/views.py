from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
import re

from catalog.models import LessonPlan
from catalog.feature_flags import is_feature_enabled
from .permissions import HasLessonPlanAccess, IsLessonPlanEligibleTeacher
from .serializers import (
    LessonPlanCreateSerializer, LessonPlanDetailSerializer, LessonPlanListSerializer,
)
from .services import build_lesson_plan_markdown

AI_LESSON_PLANS_FLAG_KEY = 'ai_lesson_plans'


def _build_prompt(plan: LessonPlan) -> str:
    """Builds the user prompt from a LessonPlan's stored input fields."""
    ability_label = dict(LessonPlan.ABILITY_CHOICES).get(plan.student_ability, plan.student_ability)
    class_size_line = f"Class size: {plan.class_size} students\n" if plan.class_size else ""

    return (
        f"School: {plan.effective_school_name}\n"
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


def _default_school_name(user) -> str:
    """
    School Plan teachers -> their school's name (still editable afterwards).
    Individual teachers -> blank; LessonPlan.effective_school_name falls back
    to "Brainz Academy" for display without persisting that string on every row.
    """
    staff_profile = getattr(user, 'school_staff_profile', None)
    if staff_profile is not None and staff_profile.is_active:
        return staff_profile.school.name
    return ''


def _safe_filename(title: str) -> str:
    """
    Content-Disposition filenames must be ASCII-safe. LessonPlan.short_title
    includes an em dash ("Subject — Coverage"), which is valid UTF-8 but not
    Latin-1 -- Django silently RFC-2047-encodes the ENTIRE header value when
    it can't represent it as Latin-1, turning "attachment; filename=..." into
    an opaque "=?utf-8?b?...?=" blob browsers don't reliably parse as a
    normal attachment. Stripped to ASCII here only -- the em dash is fine
    inside the actual document text handed to pandoc; this only affects the
    filename in the HTTP header.
    """
    ascii_title = title.encode('ascii', 'ignore').decode('ascii')
    ascii_title = re.sub(r'\s+', '_', ascii_title).strip('_')
    ascii_title = re.sub(r'_+', '_', ascii_title)
    return ascii_title or 'Lesson_Plan'


class LessonPlanListView(APIView):
    """
    GET  /api/lesson-plans/   -> list the teacher's own lesson plans (lightweight)
    POST /api/lesson-plans/   -> create a new draft plan (input fields only, ungated)
    """
    permission_classes = [IsAuthenticated, IsLessonPlanEligibleTeacher]

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
        school_name = serializer.validated_data.get('school_name') or _default_school_name(request.user)
        plan = serializer.save(teacher=request.user, school_name=school_name)
        return Response(LessonPlanDetailSerializer(plan).data, status=status.HTTP_201_CREATED)


class LessonPlanDetailView(APIView):
    """
    GET    /api/lesson-plans/<pk>/   -> full plan
    DELETE /api/lesson-plans/<pk>/   -> delete a plan the teacher owns
    """
    permission_classes = [IsAuthenticated, IsLessonPlanEligibleTeacher]

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

    Gated two independent ways:
      - `IsLessonPlanEligibleTeacher` + `HasLessonPlanAccess` (permission_classes):
        role (must be a teacher, either individually or via School Plan) and
        entitlement (must hold TEACHER_PRO or a valid school grant) -> 403
        if either check fails.
      - `ai_lesson_plans` FeatureFlag (checked in the body): platform-wide
        kill switch, e.g. admin out of Anthropic credit -> 404 with
        {'error': ...}, same convention schools/views.py already uses for
        flag-off.

        Deliberately called WITHOUT `user=` here: is_feature_enabled()'s
        role-visibility check reads CustomUser.role, which School Plan
        teachers don't reliably have set to 'TEACHER' (SchoolStaff.school_role
        is a separate, unsynced field — see IsLessonPlanEligibleTeacher).
        Role eligibility is already fully handled by the permission classes
        above by the time this line runs, so re-checking it here via the
        wrong field would incorrectly 404 legitimate school teachers.

    Cache-first: if already generated, returns stored content without
    calling the API again.
    """
    permission_classes = [IsAuthenticated, IsLessonPlanEligibleTeacher, HasLessonPlanAccess]

    def post(self, request, pk):
        if not is_feature_enabled(AI_LESSON_PLANS_FLAG_KEY):
            return Response(
                {'error': 'The Lesson Plan Generator is currently disabled by the admin.'},
                status=status.HTTP_404_NOT_FOUND,
            )

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


class LessonPlanDownloadView(APIView):
    """
    GET /api/lesson-plans/<pk>/download/?format=pdf|docx

    Read-only export -- unlike Test Builder's download (which persists a
    SavedTest as a side effect), a LessonPlan is already fully persisted
    the moment it's generated, so this is a plain GET with no mutation.

    Re-checks HasLessonPlanAccess on every call (not just at generation
    time), matching Test Builder's own precedent of re-checking entitlement
    on every download rather than only once at creation -- a lapsed
    subscriber loses re-download access the same way they'd lose a fresh
    generate() call. This check is a no-op (always passes) whenever the
    platform-wide PlatformSettings.subscription_required is off, since
    has_ai_feature_access() -> has_subscription() already short-circuits
    to True in that mode -- no separate handling needed here for that case.
    """
    permission_classes = [IsAuthenticated, IsLessonPlanEligibleTeacher, HasLessonPlanAccess]

    CONTENT_TYPES = {
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'pdf': 'application/pdf',
    }

    def get(self, request, pk):
        fmt = request.query_params.get('file_type', 'pdf').lower()
        if fmt not in self.CONTENT_TYPES:
            return Response({'error': f'Invalid format "{fmt}". Must be "pdf" or "docx".'}, status=400)

        try:
            plan = LessonPlan.objects.select_related('subject', 'teacher').get(
                pk=pk, teacher=request.user,
            )
        except LessonPlan.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not plan.is_generated:
            return Response({'error': 'Generate this lesson plan before downloading it.'}, status=400)

        markdown_text = build_lesson_plan_markdown(plan)

        from services.pandoc_export import markdown_to_docx_bytes, markdown_to_pdf_bytes

        try:
            if fmt == 'docx':
                content = markdown_to_docx_bytes(markdown_text, plan.short_title)
            else:
                content = markdown_to_pdf_bytes(markdown_text, plan.short_title)
        except ValueError as exc:
            return Response({'error': f'File generation failed: {exc}'}, status=500)

        safe_title = _safe_filename(plan.short_title)
        response = HttpResponse(content, content_type=self.CONTENT_TYPES[fmt])
        response['Content-Disposition'] = f'attachment; filename="{safe_title}.{fmt}"'
        return response