"""
schools/permissions.py

Every admin-management endpoint in this app scopes to "the caller's own
school" — a school admin must never see or touch another school's data.
IsSchoolAdmin is the gate all of them share; each view's get_queryset()
then filters by request.user.school_staff_profile.school on top of this.
"""

from rest_framework.permissions import BasePermission


class IsSchoolAdmin(BasePermission):
    """Allows access only to an ADMIN-role SchoolStaff member."""

    message = "You must be a school admin to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        staff = getattr(request.user, 'school_staff_profile', None)
        return bool(staff and staff.is_active and staff.school_role == 'ADMIN')


class IsSchoolStaffMember(BasePermission):
    """Allows access to any active staff member (ADMIN or TEACHER) of a school."""

    message = "You must be an active member of a school's staff to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        staff = getattr(request.user, 'school_staff_profile', None)
        return bool(staff and staff.is_active)