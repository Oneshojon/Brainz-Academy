from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic

class Command(BaseCommand):
    help = 'Seed Physics themes and topics'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.get_or_create_safe(name='Physics')

        data = {
            'Interaction of Matter, Space and Time': ['Concepts of Matter','Fundamental and Derived Quantities and Units','Position, Distance and Displacement','Mass and Weight','Time','Fluid at Rest','Motion','Speed and Velocity','Rectilinear Acceleration','Scalars and Vectors','Equilibrium of Forces','Simple Harmonic Motion','Newtons Laws of Motion'],
            'Energy: Mechanical and Heat': ['Energy','Work, Energy and Power','Heat Energy'],
            'Waves': ['Production and Propagation of Waves','Types of Waves','Properties of Waves','Light Waves','Electromagnetic Waves','Sound Waves'],
            'Fields': ['Description and Properties of Fields','Gravitational Field','Electric Field','Current Electricity','Magnetic Field','Electromagnetic Field','Simple A.C. Circuits'],
            'Atomic and Nuclear Physics': ['Structure of the Atom','Structure of the Nucleus','Radioactivity','Nuclear Reactions','Wave-Particle Paradox'],
            'Further Topics': ['Derived Quantities and Dimensional Analysis','Projectile Motion','Satellites and Rockets','Elastic Properties of Solids','Thermal Conductivity and Solar Energy','Fibre Optics','Introduction to Laser','Magnetic Materials','Electrical Conduction Through Materials','Structure of Matter'],
        }

        ct, ctp = 0, 0
        for order, (theme_name, topics) in enumerate(data.items()):
            theme, created = Theme.get_or_create_safe(subject=subject, name=theme_name, order=order + 1)
            if created: ct += 1
            for name in topics:
                topic, tc = Topic.get_or_create_normalized(subject=subject, name=name, defaults={'theme': theme})
                if tc: ctp += 1
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])

        self.stdout.write(f'Done — {ct} themes, {ctp} topics created.')