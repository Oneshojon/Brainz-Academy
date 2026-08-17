"""
schools/tests/conftest.py

schools/tests/ sits outside the tests/ directory tree, so it does not
automatically inherit the autouse fixtures defined in tests/conftest.py —
pytest resolves conftest.py files by directory hierarchy, not repo-wide.

Re-importing them here (rather than redefining) keeps a single source of
truth: seed_feature_flags in particular is load-bearing for this app,
since is_feature_enabled() fails OPEN (returns True) for any flag key
that doesn't exist in the DB yet. Without this fixture, tests that expect
school_plan to be off by default would silently run against an *absent*
flag instead of a *disabled* one.
"""

from tests.conftest import disable_ssl_redirect, seed_feature_flags  # noqa: F401