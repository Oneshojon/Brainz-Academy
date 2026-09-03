from django.apps import AppConfig


class LessonPlansConfig(AppConfig):
    """
    Dedicated app for the Lesson Plan Generator feature. The LessonPlan
    model itself still lives in catalog (next to LessonNote/Worksheet),
    but the endpoint layer gets its own app for isolated debugging.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'lesson_plans'
    verbose_name = 'Lesson Plan Generator'