from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Chemistry themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.get_or_create_safe(name='Chemistry')

        data = {
            'Introduction to Chemistry': [
                'Measurement of Physical Quantities',
                'Scientific Methods',
                'Laboratory Safety',
            ],
            'Structure of the Atom': [
                'Gross Features of the Atom',
                'Atomic Number, Mass Number and Isotopes',
                'Electronic Configuration',
            ],
            'Standard Separation Techniques for Mixtures': [
                'Classification of Mixtures',
                'Separation Techniques (Filtration, Distillation, Chromatography)',
                'Criteria for Purity',
            ],
            'Periodic Chemistry': [
                'Periodicity of the Elements',
                'Categories of Elements in the Periodic Table',
                'Periodic Law and Trends',
                'Periodic Gradation of Elements in the Third Period (Na - Ar)',
            ],
            'Chemical Bonds': [
                'Ionic Bonds and Compounds',
                'Covalent Bonds and Compounds',
                'Coordinate (Dative) Covalent Bonding',
                'Properties of Transition Metals',
                'Metallic Bonding',
            ],
            'Stoichiometry and Chemical Reactions': [
                'Chemical Symbols, Formulae and Equations',
                'Empirical and Molecular Formulae',
                'IUPAC Names of Chemical Compounds',
                'Laws of Chemical Combination',
                'Amount of Substance (Mole Concept)',
            ],
            'States of Matter': [
                'Kinetic Theory of Matter',
                'Changes of State of Matter',
                'Diffusion',
                'Gas Laws',
            ],
            'Energy and Energy Changes': [
                'Energy and Enthalpy',
                'Exothermic and Endothermic Reactions',
                "Hess's Law",
                'Bond Energy',
            ],
            'Acids, Bases and Salts': [
                'Definitions of Acids and Bases',
                'Physical and Chemical Properties of Acids and Bases',
                'Classification of Acids and Bases',
                'Concept of pH',
                'Preparation and Properties of Salts',
                'Qualitative Analysis of Salts',
            ],
            'Solubility of Substances': [
                'General Principles of Solubility',
                'Practical Application of Solubility',
                'Solubility Curves',
            ],
            'Chemical Kinetics and Equilibrium': [
                'Rate of Reactions',
                'Factors Affecting Rates of Reaction',
                "Equilibrium and Le Chatelier's Principle",
            ],
            'Redox Reactions': [
                'Oxidation and Reduction Process',
                'Oxidizing and Reducing Agents',
                'Redox Equations',
                'Electrochemical Cells and Standard Electrode Potential',
                "Electrolysis and Faraday's Laws",
            ],
            'Chemistry of Carbon Compounds': [
                'Classification of Organic Compounds',
                'Functional Groups',
                'Hydrocarbons (Alkanes, Alkenes, Alkynes)',
                'Alcohols',
                'Carboxylic Acids and Esters',
                'Separation and Purification of Organic Compounds',
                'Petroleum and Crude Oil',
                'Polymers',
            ],
            'Chemistry, Industry and the Environment': [
                'Industrial Processes (Haber, Contact, Solvay)',
                'Environmental Pollution from Chemical Processes',
                'Water Treatment',
            ],
            'Basic Biochemistry and Synthetic Polymers': [
                'Proteins: Sources, Properties and Uses',
                'Amino Acids',
                'Carbohydrates',
                'Fats and Oils',
                'Synthetic Polymers (Plastics, Rubber)',
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
        self.stdout.write(self.style.SUCCESS(f'Chemistry done — {ct} themes, {ctp} topics created.'))
