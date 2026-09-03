from rest_framework.permissions import BasePermission

LESSON_PLAN_FEATURE_KEY = 'lesson_plan_generator'


class HasLessonPlanAccess(BasePermission):
    """
    Allows access to teachers who either:
      - hold an individual TEACHER_PRO subscription, OR
      - are active SchoolStaff at a School with a currently-valid
        SchoolFeatureAccess grant for 'lesson_plan_generator'
    """
    message = (
        "Lesson Plan Generator requires an active Teacher Pro subscription, "
        "or your school must have been granted access to this feature."
    )

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        from catalog.subscription_access import has_ai_feature_access
        return has_ai_feature_access(request.user, LESSON_PLAN_FEATURE_KEY)