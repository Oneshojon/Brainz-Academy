from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic

class Command(BaseCommand):
    help = 'Seed Mathematics themes and topics'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Mathematics')


        data = {
            'NUMBER AND NUMERATION': [
                'Number bases',
                'Modular Arithmetic',
                'Fractions, Decimals and Approximations',
                'Indices',
                'Logarithms',
                'Sequence and Series',
                'Sets',
                'Logical Reasoning',
                'Positive and negative integers, rational numbers',
                'Surds (Radicals)',
                'Matrices and Determinants',
                'Ratio, Proportions and Rates',
                'Percentages',
                'Financial Arithmetic',
                'Variation'
            ],
            'ALGEBRAIC PROCESSES': [
                'Algebraic expressions',
                'Simple operations on algebraic expressions',
                'Solution of Linear Equations',
                'Change of Subject of Formula/Relation',
                'Quadratic Equations',
                'Graphs of Linear and Quadratic functions',
                'Linear Inequalities',
                'Algebraic Fractions',
                'Functions and Relations'
            ],
            'MENSURATION': [
                'Lengths and Perimeters',
                'Areas',
                'Volumes'
            ],
            'PLANE GEOMETRY': [
                'Angles',
                'Angles and intercepts on parallel lines',
                'Triangles and Polygons',
                'Circles',
                'Construction',
                'Loci'
            ],
            'COORDINATE GEOMETRY OF STRAIGHT LINES': [
                'Concept of the x-y plane',
                'Coordinates of points on the x-y plane',
                'Gradient and Equation of a straight line'
            ],
            'TRIGONOMETRY': [
                'Sine, Cosine and Tangent of an angle',
                'Angles of elevation and depression',
                'Bearings'
            ],
            'INTRODUCTORY CALCULUS': [
                'Differentiation of algebraic functions',
                'Integration of simple algebraic functions'
            ],
            'STATISTICS AND PROBABILITY': [
                'Frequency distribution and Data Representation',
                'Measures of Central Tendency (Mean, Median, Mode)',
                'Measures of Dispersion (Range, Variance, Standard Deviation)',
                'Probability (Experimental and Theoretical)'
            ],
            'VECTORS AND TRANSFORMATION': [
                'Vectors in a Plane',
                'Transformation in the Cartesian Plane'
            ]
        }

        ct, ctp = 0, 0
        for order, (theme_name, topics) in enumerate(data.items()):
            theme, created = Theme.objects.get_or_create(subject=subject, name=theme_name, defaults={'order': order+1})
            if created:
                ct += 1
            for name in topics:
                topic, ct = Topic.objects.get_or_create(subject=subject, name=name, defaults={'theme': theme})
                if ct: ctp +=1 
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])
        self.stdout.write(f'Done — {ct} themes, {ctp} topics created.')