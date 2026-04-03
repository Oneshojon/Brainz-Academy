from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Biology themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.get_or_create_safe(name='Biology')

        data = {
            'Concept of Living': [
                'Classification of Living Things',
                'Organization of Life',
                'Forms in Which Living Cells Exist',
                'Cell Structure and Functions',
                'The Cell and Its Environment (Diffusion, Osmosis, Active Transport)',
                'Properties and Functions of the Living Cell',
                'Tissues and Supporting Systems',
                'Transport System',
                'Respiratory System',
                'Excretory Systems and Mechanisms',
                'Regulation of Internal Environment (Homeostasis)',
                'Hormonal Coordination',
                'Nervous Coordination',
                'Sense Organs',
                'Reproductive System',
            ],
            'Plant and Animal Nutrition': [
                'Photosynthesis',
                'Mineral Requirement of Plants',
                'Food Substances: Classes and Sources',
                'Balanced Diet and Its Importance',
                'Food Tests',
                'Digestive Enzymes',
                'Modes of Nutrition',
                'Alimentary System',
                'Dental Formula',
                'Feeding in Protozoa and Mammals',
            ],
            'Basic Ecological Concepts': [
                'Components of the Ecosystem',
                'Ecological Factors in Aquatic and Terrestrial Ecosystems',
                'Simple Measurement of Ecological Factors',
                'Food Webs and Trophic Levels',
                'Energy Flow',
                'Decomposition in Nature',
                'Biological Associations (Parasitism, Symbiosis, Commensalism)',
                'Adaptation of Organisms to Habitats',
                'Pollution of the Atmosphere',
                'Water and Soil Pollution',
                'Ecological Succession',
                'Factors that Affect Population Size',
                'Preservation and Storage of Foods',
                'Life of Selected Insects (Weevils, Cotton Strainers)',
                'Microorganisms: Beneficial and Harmful Effects',
                'Public Health (Refuse, Sewage Disposal, Immunization)',
            ],
            'Conservation of Natural Resources': [
                'Resources to be Conserved (Soil, Water, Wildlife, Forest, Minerals)',
                'Ways of Ensuring Conservation',
            ],
            'Variation in Population': [
                'Morphological Variations (Size, Height, Colour, Fingerprints)',
                'Physiological Variations (Blood Groups, Tongue Rolling, PTC Tasting)',
            ],
            'Biology of Heredity (Genetics)': [
                'Genetic Terminologies',
                'Transmission and Expression of Characteristics',
                "Mendel's Laws and Experiments",
                'Chromosomes: The Basis of Heredity',
                'Probability in Genetics (Hybrid Formation)',
                'Linkage, Sex Determination and Sex-Linked Characters',
                'Application of Heredity in Agriculture and Medicine',
            ],
            'Adaptation for Survival and Evolution': [
                'Behavioural Adaptations in Social Animals (Termites, Bees)',
                'Evidence of Evolution',
                'Theories of Evolution',
            ],
        }

        ct, ctp = 0, 0
        for order, (theme_name, topics) in enumerate(data.items()):
            theme, created = Theme.get_or_create_safe(
                 subject=subject, name=theme_name, order=order + 1
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
        self.stdout.write(self.style.SUCCESS(f'Biology done — {ct} themes, {ctp} topics created.'))
