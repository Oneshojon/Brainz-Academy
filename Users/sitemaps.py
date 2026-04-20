from django.contrib.sitemaps import Sitemap
from django.urls import reverse


class StaticViewSitemap(Sitemap):
    changefreq = 'weekly'
    protocol   = 'https'

    def items(self):
        return [
            ('Users:index',                    1.0),
            ('Users:pricing',                  0.8),
            ('past_papers:past_papers_boards', 0.7),
            ('Users:waec_landing',             0.9),
            ('Users:neco_landing',             0.9),
            ('Users:jamb_landing',             0.9),
            ('Users:waec_practice_landing',    0.9),
            ('Users:jamb_practice_landing',    0.9),
            ('Users:test_builder_landing',     0.8),
        ]

    def location(self, item):
        return reverse(item[0])

    def priority(self, item):
        return item[1]