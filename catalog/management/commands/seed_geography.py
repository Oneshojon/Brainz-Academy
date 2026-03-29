from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Geography themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Geography')

        data = {
            'Map Work': [
                'Map Reading and Interpretation (Scale, Distance, Direction and Bearing)',
                'Identification of Physical Features (Spurs, Valleys, Ridges)',
                'Cultural Features (Settlements, Communication Routes)',
                'Measurement of Gradients and Drawing of Cross Profiles',
                'Inter-Visibility and Drainage Characteristics',
                'Patterns of Communication, Settlement and Land Use',
                'Statistical Maps and Diagrams (Bar Graphs, Dot Maps, Isopleth Maps)',
                'Geographic Information System (GIS)',
            ],
            'Elements of Physical Geography': [
                'The Earth as a Planet (Latitude, Longitude, Rotation and Revolution)',
                'Structure of the Earth (Internal and External)',
                'Types, Characteristics and Formation of Rocks',
                'Tectonic Processes (Vulcanicity and Earthquakes)',
                'Landforms (Mountains, Plains, Karsts and Coastal Landforms)',
                'Denudational Processes (Weathering, Mass Movement, Running Water)',
                'Hydrosphere (Ocean Basins, Salinity, Ocean Currents, Lakes)',
            ],
            'Weather and Climate': [
                'Simple Weather Study and Weather Instruments',
                'Climate Elements (Rainfall, Temperature, Humidity, Wind, Air Pressure)',
                'Factors Affecting Climatic Elements',
                'Interpretation of Climatic Charts and Data',
                'Climate Classification (Greek and Koppen)',
                'Major Types of Climate (Equatorial, Tropical, Desert, Temperate)',
                'Climate Change: Meaning, Causes, Effects and Remedies',
            ],
            'Vegetation and Soils': [
                'Major Types of Vegetation (Tropical Rainforest, Savanna, Temperate)',
                'Characteristics and Distribution of Vegetation',
                'Factors Affecting Vegetation Distribution',
                'Vegetation as an Environmental Resource and Conservation',
                'Soil: Definition, Local Types and Characteristics',
                'Factors and Processes of Soil Formation',
                'Soil Profile and Importance to Man',
                'Soil Erosion and Conservation',
            ],
            'Environmental Resources and Hazards': [
                'Meaning and Classification of Environmental Resources',
                'Types of Environmental Resources (Vegetation, Water, Mineral)',
                'Environmental Problems (Soil Erosion, Drought, Desert Encroachment, Flooding)',
                'Environmental Pollution (Air, Water, Soil, Noise)',
                'Environmental Conservation: Meaning, Methods and Problems',
            ],
            'Economic and Human Geography': [
                'World Population: Growth, Distribution and Movement',
                'Population Problems (Overpopulation, Underpopulation, Migration)',
                'Settlement: Types, Patterns and Functions (Rural and Urban)',
                'Urban-Rural Interaction and Migration',
                'Modes of Transportation (Road, Rail, Water, Air, Pipeline)',
                'Transportation and Economic Development',
                'Classification of Industries (Primary, Secondary, Tertiary)',
                'Factors of Industrial Location',
                'National and International Trade',
                'Tourism: Meaning, Importance, Problems and Solutions',
            ],
            'Regional Geography of Nigeria': [
                'Location, Position, Size and Political Divisions of Nigeria',
                'Physical Setting of Nigeria (Relief, Drainage, Climate, Vegetation)',
                'Population of Nigeria (Size, Distribution, Structure, Movement)',
                'Mineral Resources of Nigeria (Petroleum, Coal, Tin, Iron Ore)',
                'Power Resources (Petroleum, Gas, Coal, HEP, Solar)',
                'Water Resources of Nigeria',
                'Agriculture in Nigeria (Types, Crops, Importance and Problems)',
                'Transportation in Nigeria',
                'Communication Networks in Nigeria',
                'Industry in Nigeria (Types, Location, Importance and Problems)',
                'Trade in Nigeria (National and International)',
                'Tourism in Nigeria',
                'Rural and Regional Development in Nigeria',
                'Environmental Conservation Issues in Nigeria',
                'ECOWAS: Meaning, Members, Purposes and Benefits',
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
                topic, tc = Topic.objects.get_or_create(
                    subject=subject, name=name, defaults={'theme': theme}
                )
                if tc:
                    ctp += 1
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])
        self.stdout.write(self.style.SUCCESS(f'Geography done — {ct} themes, {ctp} topics created.'))
