"""
tests/unit/test_ai_service.py

Unit tests for services/ai_service.generate_lesson_plan() — sibling to
generate_lesson_note(), same circuit breaker / AIUnavailableError contract,
different (structured JSON) output shape.

_call_claude is patched directly rather than exercising the real circuit
breaker/Anthropic SDK — the circuit breaker itself already has its own
dedicated test coverage in tests/unit/test_circuit_breaker.py.
"""

import json
from unittest.mock import patch

import anthropic
import pytest

from services.ai_service import AIUnavailableError, generate_lesson_plan
from utils.circuit_breaker import CircuitOpenError


VALID_JSON_RESPONSE = json.dumps({
    'objectives': "Students will state and apply Hooke's Law.",
    'activities': "1. Warm-up recap. 2. Spring demo. 3. Guided practice.",
    'timing_breakdown': "5 min warm-up, 15 min demo, 15 min practice, 5 min wrap-up.",
    'assessment': "Exit ticket: 3 short-answer questions on Hooke's Law.",
})


@pytest.mark.django_db
class TestGenerateLessonPlan:

    def test_returns_all_four_sections_on_success(self):
        with patch('services.ai_service._call_claude', return_value=VALID_JSON_RESPONSE):
            result = generate_lesson_plan(
                subject_name='Physics', curriculum='NIGERIAN', prompt='Plan a lesson.',
            )
        assert set(result.keys()) == {'objectives', 'activities', 'timing_breakdown', 'assessment'}
        assert "Hooke's Law" in result['objectives']

    def test_strips_json_code_fence_if_present(self):
        fenced = f"```json\n{VALID_JSON_RESPONSE}\n```"
        with patch('services.ai_service._call_claude', return_value=fenced):
            result = generate_lesson_plan(
                subject_name='Physics', curriculum='NIGERIAN', prompt='Plan a lesson.',
            )
        assert result['assessment']

    def test_circuit_open_raises_ai_unavailable(self):
        with patch('services.ai_service._call_claude', side_effect=CircuitOpenError('anthropic')):
            with pytest.raises(AIUnavailableError):
                generate_lesson_plan(subject_name='Physics', curriculum='NIGERIAN', prompt='x')

    def test_api_timeout_raises_ai_unavailable(self):
        timeout_exc = anthropic.APITimeoutError(request=None)
        with patch('services.ai_service._call_claude', side_effect=timeout_exc):
            with pytest.raises(AIUnavailableError):
                generate_lesson_plan(subject_name='Physics', curriculum='NIGERIAN', prompt='x')

    def test_malformed_json_raises_ai_unavailable(self):
        with patch('services.ai_service._call_claude', return_value='not valid json at all'):
            with pytest.raises(AIUnavailableError):
                generate_lesson_plan(subject_name='Physics', curriculum='NIGERIAN', prompt='x')

    def test_missing_keys_raises_ai_unavailable(self):
        incomplete = json.dumps({'objectives': 'Only this key present.'})
        with patch('services.ai_service._call_claude', return_value=incomplete):
            with pytest.raises(AIUnavailableError):
                generate_lesson_plan(subject_name='Physics', curriculum='NIGERIAN', prompt='x')

    def test_igcse_curriculum_does_not_error(self):
        """Curriculum only changes prompt framing — must not affect parsing."""
        with patch('services.ai_service._call_claude', return_value=VALID_JSON_RESPONSE) as mock_call:
            generate_lesson_plan(subject_name='Physics', curriculum='IGCSE', prompt='Plan a lesson.')
        system_prompt_used = mock_call.call_args.kwargs['system_prompt']
        assert 'IGCSE' in system_prompt_used or 'Cambridge' in system_prompt_used