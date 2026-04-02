from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Agricultural Science themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Agricultural Science')

        data = {
            'Basic Concepts of Agriculture': [
                'Meaning, Definition and Branches of Agricultural Science',
                'Importance of Agriculture to Individual, Community and Nation',
                'Problems of Agricultural Development and Possible Solutions',
                'Subsistence vs Commercial Agriculture',
                'Roles of Government in Agricultural Development',
                'Role of Non-Governmental Organizations (NGOs) in Agriculture',
                'Agricultural Laws, Land Tenure Systems and Reforms',
            ],
            'Agricultural Ecology': [
                'Meaning and Importance of Agricultural Ecology',
                'Components of Farm Ecosystem (Biotic and Abiotic)',
                'Land: Meaning, Characteristics and Uses',
                'Factors Affecting Land Availability for Agriculture',
                'Agro-Allied Industries and Agriculture-Industry Relationship',
                'Environmental Factors Affecting Crop and Animal Production',
                'Rock Formation and Types (Igneous, Sedimentary, Metamorphic)',
                'Soil Formation and Profile Development',
                'Types, Composition and Properties of Soil',
                'Soil pH and Physical Properties (Texture, Structure)',
                'Plant Nutrients: Macro and Micro-Nutrients, Functions and Deficiency Symptoms',
                'Nutrient Cycles (Nitrogen, Carbon, Water, Phosphorus)',
                'Organic Agriculture: Meaning and Importance',
                'Irrigation: Meaning, Types, Advantages and Problems',
                'Drainage: Meaning, Types and Importance',
                'Agricultural Pollution: Causes, Effects and Prevention',
            ],
            'Agricultural Engineering and Mechanization': [
                'Simple Farm Tools: Types and Maintenance',
                'Farm Machinery and Implements (Tractor, Combine Harvester, etc.)',
                'Maintenance Practices for Farm Machinery',
                'Agricultural Mechanization: Meaning, Advantages and Limitations',
                'Sources of Farm Power',
                'Farm Surveying: Meaning and Equipment',
                'Farm Planning: Meaning, Factors and Importance',
                'Principles of Farmstead Planning',
            ],
            'Crop Production': [
                'Classification of Crops (by Use, Life Cycle and Morphology)',
                'Husbandry of Cereals (Maize, Rice, Sorghum, Millet)',
                'Husbandry of Legumes/Pulses (Cowpea, Groundnut, Soybean)',
                'Husbandry of Roots and Tubers (Cassava, Yam, Sweet Potato)',
                'Husbandry of Vegetables (Tomato, Okro, Pepper)',
                'Husbandry of Tree/Plantation Crops (Cocoa, Oil Palm, Rubber)',
                'Husbandry of Fibre Crops (Cotton)',
                'Land Preparation and Tillage',
                'Nursery Practices and Propagation Methods',
                'Weed: Meaning, Classification and Control Methods',
                'Pests: Types, Damage and Control',
                'Crop Diseases: Types, Symptoms and Control',
                'Harvesting, Processing and Storage of Crops',
                'Crop Improvement and Breeding',
            ],
            'Animal Production': [
                'Classification of Farm Animals',
                'Breeds of Cattle (Beef and Dairy)',
                'Breeds of Pigs',
                'Breeds of Sheep and Goats',
                'Poultry Production (Layers and Broilers)',
                'Rabbit Farming',
                'Fish Farming (Aquaculture)',
                'Animal Nutrition: Feed Types and Composition',
                'Digestive Systems of Ruminants and Non-Ruminants',
                'Animal Reproduction: Estrus, Mating, Gestation and Parturition',
                'Animal Genetics and Improvement',
                'Animal Diseases: Types, Symptoms and Control',
                'Animal Parasites: Internal and External Parasites',
                'Animal Housing and Farm Structures',
                'Animal Products and Processing (Milk, Eggs, Meat, Hides)',
            ],
            'Agricultural Economics and Extension': [
                'Farm Records and Accounts',
                'Farm Planning and Budgeting',
                'Agricultural Credit: Sources and Types',
                'Cooperative Societies in Agriculture',
                'Marketing of Agricultural Produce',
                'Agricultural Extension Services',
                'Agro-Processing and Value Addition',
            ],
        }

        ct, ctp = 0, 0
        for order, (theme_name, topics) in enumerate(data.items()):
            theme, created = Theme.objects.get_or_create(
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
        self.stdout.write(self.style.SUCCESS(f'Agricultural Science done — {ct} themes, {ctp} topics created.'))
