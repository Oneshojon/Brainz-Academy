from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('Users.urls')),
    path('teacher/', include('teacher.urls')),
    path('student/', include('practice.urls')),
    path('app/', include('frontend.urls')),
    path('api/catalog/', include('catalog.urls')),
    path('payments/', include('payments.urls')),
]

if settings.DEBUG:
    from debug_toolbar.toolbar import debug_toolbar_urls
    urlpatterns += debug_toolbar_urls()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

#