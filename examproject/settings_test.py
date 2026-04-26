"""
Test-specific Django settings.
Inherits from base settings and overrides for speed and isolation.
"""

from examproject.settings import *   # noqa: F401, F403

# ── Database ──────────────────────────────────────────────────────────────────
import os
import dj_database_url

TEST_DATABASE_URL = os.environ.get('TEST_DATABASE_URL')

if TEST_DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(TEST_DATABASE_URL, conn_max_age=60)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }

# ── Cache ─────────────────────────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ── Storage ───────────────────────────────────────────────────────────────────
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
MEDIA_ROOT = '/tmp/examprep_test_media/'

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY = 'test-secret-key-not-for-production'
DEBUG = True
ALLOWED_HOSTS = ['*']

# ── CRITICAL: Kill all 301 redirects in tests ─────────────────────────────────
# Production enables HTTPS redirect + HSTS — both cause 301s that break assertions
SECURE_SSL_REDIRECT      = False
SECURE_HSTS_SECONDS      = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SESSION_COOKIE_SECURE    = False
CSRF_COOKIE_SECURE       = False

# ── Passwords ─────────────────────────────────────────────────────────────────
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# ── Celery ────────────────────────────────────────────────────────────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ── External APIs ─────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = 'test-dummy-key'
BREVO_API_KEY     = 'test-dummy-key'

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {},
    'root': {'handlers': [], 'level': 'CRITICAL'},
}