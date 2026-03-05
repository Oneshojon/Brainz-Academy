"""
Add to settings.py TEMPLATES[0]['OPTIONS']['context_processors']:
    'catalog.context_processors.feature_flags',

This injects a `flags` dict into every template so you can do:
    {% if flags.lesson_notes %}...{% endif %}
"""


from catalog.models import FeatureFlag


def feature_flags(request):
    """Inject all feature flags into every template context."""
    try:
        all_flags = FeatureFlag.objects.all()
        flags = {}
        for f in all_flags:
            # Check role scoping
            if f.visible_to == 'ALL':
                flags[f.key] = f.is_enabled
            else:
                user = getattr(request, 'user', None)
                role = getattr(user, 'role', None) if user else None
                if role == f.visible_to:
                    flags[f.key] = f.is_enabled
                else:
                    flags[f.key] = False
        return {'flags': flags}
    except Exception:
        return {'flags': {}}
