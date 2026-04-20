from django.contrib.sitemaps import Sitemap
from django.urls import reverse


class StaticViewSitemap(Sitemap):
    changefreq = 'weekly'
    protocol = 'https'

    def items(self):
        return [
            # Public pages only — no login-required pages
            ('Users:index',             1.0),
            ('Users:pricing',           0.8),
            ('past_papers:past_papers_boards', 0.7),
        ]

    def location(self, item):
        return reverse(item[0])

    def priority(self, item):
        return item[1]