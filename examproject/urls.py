from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static


def redirect_with_rest(new_prefix):
    """Factory for regex redirects that preserve sub-paths."""
    def view(request, rest=''):
        return RedirectView.as_view(
            url=f'/{new_prefix}/{rest}', permanent=True
        )(request)
    return view


urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth & public pages ───────────────────────────────────────
    path('', include('Users.urls')),

    # ── Teacher portal ────────────────────────────────────────────
    path('teacher/', include('teacher.urls')),

    # ── Clean URLs (new) ──────────────────────────────────────────
    path('test-builder/', include('frontend.urls')),
    path('cbt-practice/', include('practice.urls')),
    path('lesson-notes/', include('teacher.lesson_note_urls')),  # see step 3
    path('past-papers/', include('practice.past_paper_urls')),

    # ── API (internal, never changes) ─────────────────────────────
    path('api/catalog/', include('catalog.urls')),

    # ── Payments ──────────────────────────────────────────────────
    path('payments/', include('payments.urls')),

    # ── 301 Permanent redirects (old → new) ───────────────────────
    re_path(r'^app/(?P<rest>.*)$',            redirect_with_rest('test-builder')),
    re_path(r'^student/(?P<rest>.*)$',        redirect_with_rest('cbt-practice')),
    re_path(r'^teacher/lesson-notes/(?P<rest>.*)$', redirect_with_rest('lesson-notes')),
    re_path(r'^practice/past-papers/(?P<rest>.*)$',   redirect_with_rest('past-papers')),
    re_path(r'^student/past-papers/(?P<rest>.*)$', redirect_with_rest('past-papers')),
    re_path(r'^cbt-practice/past-papers/(?P<rest>.*)$', redirect_with_rest('past-papers')),
]

if settings.DEBUG:
    from debug_toolbar.toolbar import debug_toolbar_urls
    urlpatterns += debug_toolbar_urls()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)