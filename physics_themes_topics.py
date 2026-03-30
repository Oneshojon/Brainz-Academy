# ══════════════════════════════════════════════════════════════════════════════
# Physics Themes and Topics extracted from WAEC syllabus
# Run in Django shell to seed the database:
#
# python manage.py shell -c "
# exec(open('physics_themes_topics.py').read())
# "
# ══════════════════════════════════════════════════════════════════════════════

from catalog.models import Subject, Theme, Topic

subject = Subject.objects.get(name__iexact='Physics')

data = {
    'Interaction of Matter, Space & Time': [
        'Concepts of Matter',
        'Fundamental and Derived Quantities and Units',
        'Position, Distance and Displacement',
        'Mass and Weight',
        'Time',
        'Fluid at Rest',
        'Motion',
        'Speed and Velocity',
        'Rectilinear Acceleration',
        'Scalars and Vectors',
        'Equilibrium of Forces',
        'Simple Harmonic Motion',
        "Newton's Laws of Motion",
    ],
    'Energy: Mechanical and Heat': [
        'Energy',
        'Work, Energy and Power',
        'Heat Energy',
    ],
    'Waves': [
        'Production and Propagation of Waves',
        'Types of Waves',
        'Properties of Waves',
        'Light Waves',
        'Electromagnetic Waves',
        'Sound Waves',
    ],
    'Fields': [
        'Description and Properties of Fields',
        'Gravitational Field',
        'Electric Field — Electrostatics',
        'Current Electricity',
        'Magnetic Field',
        'Electromagnetic Field',
        'Simple A.C. Circuits',
    ],
    'Atomic and Nuclear Physics': [
        'Structure of the Atom',
        'Structure of the Nucleus',
        'Radioactivity',
        'Nuclear Reactions — Fusion and Fission',
        'Wave-Particle Paradox',
    ],
    'Further Topics (Harmonised)': [
        'Derived Quantities and Dimensional Analysis',
        'Projectile Motion',
        'Satellites and Rockets',
        'Elastic Properties of Solids',
        'Thermal Conductivity and Solar Energy',
        'Fibre Optics',
        'Introduction to Laser',
        'Magnetic Materials',
        'Electrical Conduction Through Materials',
        'Structure of Matter',
    ],
}

created_themes = 0
created_topics = 0

for order, (theme_name, topic_names) in enumerate(data.items()):
    theme, t_created = Theme.objects.get_or_create(
        subject=subject,
        name=theme_name,
        defaults={'order': order + 1}
    )
    if t_created:
        created_themes += 1
        print(f'  ✅ Theme: {theme_name}')
    else:
        print(f'  ⏭  Theme exists: {theme_name}')

    for topic_name in topic_names:
        topic, tp_created = Topic.objects.get_or_create(
            subject=subject,
            name=topic_name,
            defaults={'theme': theme}
        )
        if tp_created:
            created_topics += 1
        else:
            # Update theme if topic exists but has no theme
            if not topic.theme:
                topic.theme = theme
                topic.save(update_fields=['theme'])

print(f'\n✅ Done — {created_themes} themes, {created_topics} new topics seeded.')