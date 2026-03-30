from rest_framework.permissions import BasePermission


class IsTeacher(BasePermission):
    """Allows access only to users with role TEACHER."""
    message = "You must be a teacher to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'TEACHER'
        )