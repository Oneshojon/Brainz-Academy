"""
lesson_plans/services.py

Assembles a LessonPlan's stored content into one markdown document for
export. Kept separate from services/pandoc_export.py (which knows nothing
about LessonPlan) and from views.py (which shouldn't own document
assembly logic) -- this is the one place that knows the export's shape.
"""

from catalog.models import LessonPlan


CURRICULUM_LABELS = {
    'NIGERIAN': 'Nigerian (WAEC / NECO / JAMB)',
    'IGCSE': 'British (IGCSE)',
}


def build_lesson_plan_markdown(plan: LessonPlan) -> str:
    """
    Builds the full exportable markdown document for a generated plan.
    Each stored section (objectives/activities/timing_breakdown/assessment)
    is already valid markdown from the AI response -- this just adds a
    header and joins them with dividers, in the same order shown on screen.
    """
    curriculum_label = CURRICULUM_LABELS.get(plan.curriculum, plan.curriculum)
    class_size_line = f" · **Class size:** {plan.class_size} students" if plan.class_size else ""

    header = (
        f"# {plan.short_title}\n\n"
        f"**School:** {plan.effective_school_name}  \n"
        f"**Subject:** {plan.subject.name} · **Curriculum:** {curriculum_label} · "
        f"**Class:** {plan.class_level}  \n"
        f"**Duration:** {plan.duration_minutes} minutes{class_size_line}\n"
    )

    sections = [plan.objectives, plan.activities, plan.timing_breakdown, plan.assessment]
    body = "\n\n---\n\n".join(section for section in sections if section)

    return f"{header}\n---\n\n{body}\n"