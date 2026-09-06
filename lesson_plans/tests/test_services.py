"""Tests for lesson_plans/services.py's markdown assembly."""

import pytest
from lesson_plans.services import build_lesson_plan_markdown
from tests.conftest import LessonPlanFactory


@pytest.mark.django_db
class TestBuildLessonPlanMarkdown:

    def test_includes_header_fields(self):
        plan = LessonPlanFactory(
            school_name='Greenfield College', duration_minutes=45, class_size=30,
            objectives='Obj text', activities='Act text',
            timing_breakdown='Time text', assessment='Assess text',
        )
        md = build_lesson_plan_markdown(plan)
        assert 'Greenfield College' in md
        assert '45 minutes' in md
        assert '30 students' in md

    def test_falls_back_to_brainz_academy_when_school_name_blank(self):
        plan = LessonPlanFactory(school_name='')
        md = build_lesson_plan_markdown(plan)
        assert 'Brainz Academy' in md

    def test_includes_all_four_sections_in_order(self):
        plan = LessonPlanFactory(
            objectives='OBJECTIVES_MARKER', activities='ACTIVITIES_MARKER',
            timing_breakdown='TIMING_MARKER', assessment='ASSESSMENT_MARKER',
        )
        md = build_lesson_plan_markdown(plan)
        for marker in ['OBJECTIVES_MARKER', 'ACTIVITIES_MARKER', 'TIMING_MARKER', 'ASSESSMENT_MARKER']:
            assert marker in md
        # order preserved
        assert md.index('OBJECTIVES_MARKER') < md.index('ACTIVITIES_MARKER') < md.index('TIMING_MARKER') < md.index('ASSESSMENT_MARKER')