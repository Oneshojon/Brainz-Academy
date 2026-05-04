from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView, TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.sitemaps.views import sitemap
from Users.sitemaps import StaticViewSitemap


sitemaps = {
    'static': StaticViewSitemap,
}


def redirect_with_rest(new_prefix):
    def view(request, rest=''):
        return RedirectView.as_view(
            url=f'/{new_prefix}/{rest}', permanent=True
        )(request)
    return view


urlpatterns = [
    path('admin/', admin.site.urls),

    path('admin/health/', include('teacher.health_urls')),

    # ── Auth & public pages ───────────────────────────────────────
    path('', include('Users.urls')),

    # ── Teacher portal ────────────────────────────────────────────
    path('teacher/', include('teacher.urls')),

    # ── Clean URLs ────────────────────────────────────────────────
    path('test-builder/', include('frontend.urls')),
    path('cbt-practice/', include('practice.urls')),
    path('lesson-notes/', include('teacher.lesson_note_urls')),
    path('past-papers/', include('practice.past_paper_urls')),

    # ── API ───────────────────────────────────────────────────────
    path('api/catalog/', include('catalog.urls')),

    # ── Payments ──────────────────────────────────────────────────
    path('payments/', include('payments.urls')),

    # ── SEO ───────────────────────────────────────────────────────
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps},
         name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', TemplateView.as_view(
         template_name='robots.txt', content_type='text/plain')),

    # ── 301 Redirects ─────────────────────────────────────────────
    re_path(r'^app/(?P<rest>.*)$',                          redirect_with_rest('test-builder')),
    re_path(r'^student/(?P<rest>.*)$',                      redirect_with_rest('cbt-practice')),
    re_path(r'^teacher/lesson-notes/(?P<rest>.*)$',         redirect_with_rest('lesson-notes')),
    re_path(r'^practice/past-papers/(?P<rest>.*)$',         redirect_with_rest('past-papers')),
    re_path(r'^student/past-papers/(?P<rest>.*)$',          redirect_with_rest('past-papers')),
    re_path(r'^cbt-practice/past-papers/(?P<rest>.*)$',     redirect_with_rest('past-papers')),
]

if settings.DEBUG:
    from debug_toolbar.toolbar import debug_toolbar_urls
    urlpatterns += debug_toolbar_urls()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)