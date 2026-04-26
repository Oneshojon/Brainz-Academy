"""
Unit tests: catalog/cache_utils.py
Verified against actual implementation — get_feature_flags() returns
{key: {'enabled': bool, 'visible_to': str}}, not flat booleans.
"""

import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestGetFeatureFlags:

    def test_returns_dict(self):
        from catalog.cache_utils import get_feature_flags
        assert isinstance(get_feature_flags(), dict)

    def test_each_value_has_enabled_and_visible_to(self):
        from catalog.cache_utils import get_feature_flags
        flags = get_feature_flags()
        for key, val in flags.items():
            assert 'enabled' in val,    f"'{key}' missing 'enabled'"
            assert 'visible_to' in val, f"'{key}' missing 'visible_to'"

    def test_lesson_notes_enabled_by_default(self):
        from catalog.cache_utils import get_feature_flags
        flags = get_feature_flags()
        assert flags['lesson_notes']['enabled'] is True

    def test_practice_flag_enabled_by_default(self):
        from catalog.cache_utils import get_feature_flags
        flags = get_feature_flags()
        assert flags['practice']['enabled'] is True

    def test_cache_hit_on_second_call(self, django_assert_num_queries):
        from catalog.cache_utils import get_feature_flags
        get_feature_flags()              # cold call — hits DB
        with django_assert_num_queries(0):
            get_feature_flags()          # warm call — must not hit DB

    def test_cache_miss_on_first_call_hits_db(self, django_assert_num_queries):
        from catalog.cache_utils import get_feature_flags
        with django_assert_num_queries(1):
            get_feature_flags()

    def test_invalidate_clears_cache(self):
        from catalog.cache_utils import get_feature_flags, invalidate_feature_flags
        get_feature_flags()
        invalidate_feature_flags()
        # After invalidation, cache key should be gone
        from catalog.cache_utils import KEY_FEATURE_FLAGS
        assert cache.get(KEY_FEATURE_FLAGS) is None


@pytest.mark.django_db
class TestGetSubjectsWithQuestionCounts:

    def test_returns_list(self, subject):
        from catalog.cache_utils import get_subjects_with_question_counts
        result = get_subjects_with_question_counts()
        assert isinstance(result, list)

    def test_subject_with_no_questions_excluded(self, subject):
        """Subject with no questions should not appear."""
        from catalog.cache_utils import get_subjects_with_question_counts
        result = get_subjects_with_question_counts()
        # subject fixture has no questions attached
        ids = [s.id for s in result]
        assert subject.id not in ids

    def test_cache_hit_on_second_call(self, django_assert_num_queries, subject):
        from catalog.cache_utils import get_subjects_with_question_counts
        get_subjects_with_question_counts()
        with django_assert_num_queries(0):
            get_subjects_with_question_counts()


@pytest.mark.django_db
class TestGetBoardsWithQuestionCounts:

    def test_returns_list(self):
        from catalog.cache_utils import get_boards_with_question_counts
        result = get_boards_with_question_counts()
        assert isinstance(result, list)

    def test_cache_hit_on_second_call(self, django_assert_num_queries):
        from catalog.cache_utils import get_boards_with_question_counts
        get_boards_with_question_counts()
        with django_assert_num_queries(0):
            get_boards_with_question_counts()


@pytest.mark.django_db
class TestInvalidateLeaderboard:

    def test_invalidation_clears_leaderboard_cache(self):
        from catalog.cache_utils import invalidate_leaderboard, KEY_LEADERBOARD
        cache.set(KEY_LEADERBOARD, [{'data': 'test'}], 300)
        invalidate_leaderboard()
        assert cache.get(KEY_LEADERBOARD) is None


@pytest.mark.django_db
class TestInvalidateStudentStats:

    def test_invalidation_clears_stats_cache(self):
        from catalog.cache_utils import invalidate_student_stats, KEY_STUDENT_STATS_ALL
        cache.set(KEY_STUDENT_STATS_ALL, ['key1', 'key2'], 300)
        invalidate_student_stats()
        assert cache.get(KEY_STUDENT_STATS_ALL) is None


@pytest.mark.django_db
class TestGetPlatformSettings:

    def test_returns_platform_settings_instance(self):
        from catalog.cache_utils import get_platform_settings
        from catalog.models import PlatformSettings
        result = get_platform_settings()
        assert isinstance(result, PlatformSettings)

    def test_subscription_required_is_bool(self):
        from catalog.cache_utils import get_platform_settings
        ps = get_platform_settings()
        assert isinstance(ps.subscription_required, bool)

    def test_free_question_limit_is_positive(self):
        from catalog.cache_utils import get_platform_settings
        ps = get_platform_settings()
        assert ps.free_question_limit > 0


@pytest.mark.django_db
class TestGetTopicsForSubject:

    def test_returns_topics_for_subject(self, subject, topic):
        from catalog.cache_utils import get_topics_for_subject
        result = get_topics_for_subject(subject.id)
        ids = [t.id for t in result]
        assert topic.id in ids

    def test_cache_hit_on_second_call(self, subject, topic, django_assert_num_queries):
        from catalog.cache_utils import get_topics_for_subject
        get_topics_for_subject(subject.id)
        with django_assert_num_queries(0):
            get_topics_for_subject(subject.id)