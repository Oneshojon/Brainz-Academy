from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Further Mathematics themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.get_or_create_safe(name='Further Mathematics')

        data = {
            'Sets, Logic and Binary Operations': [
                'Set Notations and Meanings',
                'Disjoint Sets, Universal Sets and Complement',
                'Venn Diagrams and Problem Solving',
                'Commutative, Associative and Distributive Laws',
                'Logical Reasoning: True/False Statements and Truth Tables',
                'Implications and Deductions',
                'Binary Operations: Closure, Commutativity, Associativity',
                'Identity Elements and Inverses',
            ],
            'Algebra': [
                'Surds',
                'Functions: Domain, Co-domain, One-to-One, Onto, Inverse and Composite',
                'Linear Functions, Equations and Inequalities',
                'Quadratic Functions, Equations and Inequalities',
                'Cubic Functions and Equations',
                'Rational Functions and Partial Fractions',
                'Indices and Logarithmic Functions',
                'Permutations and Combinations',
                'Binomial Theorem and Expansion',
                'Arithmetic Progression (AP) and Geometric Progression (GP)',
                'Finite and Infinite Series',
                'Matrices: Operations, Determinants and Inverse of 2x2 Matrices',
                'Linear Transformation',
            ],
            'Trigonometry': [
                'Trigonometric Ratios (Sine, Cosine, Tangent) and Rules',
                'Compound Angles and Multiple Angles',
                'Trigonometric Identities',
                'Trigonometric Functions and Their Graphs',
                'Solution of Trigonometric Equations',
            ],
            'Coordinate Geometry': [
                'Straight Lines (Gradient, Equation, Distance, Midpoint)',
                'Conic Sections: Circle',
                'Conic Sections: Parabola',
                'Conic Sections: Ellipse and Hyperbola',
            ],
            'Calculus': [
                'The Concept of a Limit',
                'The Derivative of a Function (First Principles)',
                'Differentiation of Polynomials',
                'Differentiation of Trigonometric Functions',
                'Product Rule and Quotient Rule',
                'Differentiation of Implicit Functions',
                'Second-Order Derivatives',
                'Rates of Change and Small Changes',
                'Concept of Maxima and Minima',
                'Indefinite Integrals',
                'Definite Integrals',
                'Applications of Definite Integrals (Area, Volume)',
            ],
            'Statistics and Probability': [
                'Tabulation and Graphical Representation of Data',
                'Measures of Location (Mean, Median, Mode)',
                'Measures of Dispersion (Range, Variance, Standard Deviation)',
                'Correlation and Regression',
                'Meaning of Probability and Relative Frequency',
                'Calculation of Probability Using Sample Spaces',
                'Addition and Multiplication of Probabilities',
                'Probability Distributions (Binomial, Normal)',
            ],
            'Vectors and Mechanics': [
                'Definitions of Scalar and Vector Quantities',
                'Representation and Algebra of Vectors',
                'Unit Vectors and Position Vectors',
                'Resolution and Composition of Vectors',
                'Scalar (Dot) Product and Its Applications',
                'Vector (Cross) Product and Its Applications',
                'Definition and Representation of Forces',
                'Composition and Resolution of Coplanar Forces',
                'Equilibrium of Bodies',
                'Moments of Force and Friction',
                'Concepts of Motion and Equations of Motion',
                'Impulse and Momentum',
                'Projectiles',
            ],
        }

        ct, ctp = 0, 0
        for order, (theme_name, topics) in enumerate(data.items()):
            theme, created = Theme.get_or_create_safe(
                subject=subject, name=theme_name, defaults={'order': order + 1}
            )
            if created:
                ct += 1
            for name in topics:
                topic, tc = Topic.get_or_create_normalized(
                    subject=subject, name=name, defaults={'theme': theme}
                )
                if tc:
                    ctp += 1
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])
        self.stdout.write(self.style.SUCCESS(f'Further Mathematics done — {ct} themes, {ctp} topics created.'))
