from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def index(request, subpath=None):
    """
    Single entry point for the /tools/ SPA. `subpath` is accepted but
    unused — React Router owns client-side routing from here; this view's
    only job is serving the same shell for every /tools/* path so a
    browser refresh doesn't 404.
    """
    return render(request, 'frontend/index.html')