from rest_framework.permissions import BasePermission

LESSON_PLAN_FEATURE_KEY = 'lesson_plan_generator'


class IsLessonPlanEligibleTeacher(BasePermission):
    """
    Lesson Plan Generator is teacher-only, but "teacher" spans two separate,
    unsynced role systems in this codebase:
      - individually-subscribed users: Users.CustomUser.role == 'TEACHER'
      - School Plan staff: schools.SchoolStaff.school_role == 'TEACHER'
        (SchoolInviteRedeemView never syncs this onto CustomUser.role — an
        invited school teacher can have base role='STUDENT' and still be a
        legitimate class teacher at their school)

    Accepts either. This is checked ahead of HasLessonPlanAccess (which
    governs paid/trial entitlement, not role) on every lesson_plans view —
    catalog.permissions.IsTeacher is NOT used here for that reason.
    """
    message = "Lesson Plan Generator is only available to teachers."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if getattr(user, 'role', None) == 'TEACHER':
            return True
        staff = getattr(user, 'school_staff_profile', None)
        return bool(staff and staff.is_active and staff.school_role == 'TEACHER')


class HasLessonPlanAccess(BasePermission):
    """
    Allows access to teachers who either:
      - hold an individual TEACHER_PRO subscription, OR
      - are active SchoolStaff at a School with a currently-valid
        SchoolFeatureAccess grant for 'lesson_plan_generator'

    Role is NOT this permission's job — IsLessonPlanEligibleTeacher handles
    that. This is entitlement only, and deliberately doesn't re-check
    school_role, so a school ADMIN with a grant isn't blocked here — they're
    blocked upstream by IsLessonPlanEligibleTeacher instead, keeping each
    permission class responsible for exactly one thing.
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