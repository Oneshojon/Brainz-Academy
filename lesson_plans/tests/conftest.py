"""
lesson_plans/tests/conftest.py

lesson_plans/tests/ sits outside the tests/ directory tree, so it does not
automatically inherit the autouse fixtures defined in tests/conftest.py —
same reasoning as schools/tests/conftest.py. Re-imported rather than
redefined to keep a single source of truth.
"""

from tests.conftest import disable_ssl_redirect, seed_feature_flags  # noqa: F401