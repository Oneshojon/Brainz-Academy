/**
 * Enum values mirrored 1:1 from the Django backend (schools/models.py).
 * Keep in sync manually — not fetched at runtime.
 */

export const SCHOOL_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

export const ACADEMIC_TERM_CHOICES = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
];

export const SCHOOL_STAFF_ROLES = ['ADMIN', 'TEACHER', 'STUDENT'];