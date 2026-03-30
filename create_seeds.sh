#!/bin/bash
# Run from your project root (where manage.py is)
# Creates all subject seed files in catalog/management/commands/

mkdir -p catalog/management/commands
touch catalog/management/__init__.py
touch catalog/management/commands/__init__.py

# ── seed_biology.py ────────────────────────────────────────────────────────
cat > catalog/management/commands/seed_biology.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Biology themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Biology')

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
        self.stdout.write(self.style.SUCCESS(f'Biology done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_chemistry.py ──────────────────────────────────────────────────────
cat > catalog/management/commands/seed_chemistry.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Chemistry themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Chemistry')

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
        self.stdout.write(self.style.SUCCESS(f'Chemistry done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_economics.py ──────────────────────────────────────────────────────
cat > catalog/management/commands/seed_economics.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Economics themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Economics')

        data = {
            'Definition and Scope of Economics': [
                'Scarcity, Choice and Scale of Preference',
                'Opportunity Cost and Production Possibility Curve',
                'Economic Activities (Production, Distribution, Consumption)',
                'Classification of Economic Activities (Primary, Secondary, Tertiary)',
            ],
            'Factors of Production': [
                'Land: Meaning, Characteristics and Importance',
                'Labour: Meaning, Characteristics and Importance',
                'Capital: Meaning, Characteristics and Importance',
                'Entrepreneurship: Meaning, Characteristics and Importance',
            ],
            'Types and Basic Features of Economic Systems': [
                'Capitalism: Features, Advantages and Disadvantages',
                'Socialism: Features, Advantages and Disadvantages',
                'Mixed Economy: Features, Advantages and Disadvantages',
                'Economic Problems of Society',
            ],
            'Basic Tools of Economic Analysis': [
                'Tables, Graphs and Charts',
                'Arithmetic Mean, Median and Mode',
            ],
            'Demand': [
                'Concept of Demand and Law of Demand',
                'Demand Schedules and Demand Curve',
                'Types of Demand (Derived, Composite, Joint, Competitive)',
                'Factors Determining Demand',
                'Shift of vs Movement Along the Demand Curve',
                'Elasticity of Demand (Price, Income and Cross)',
                'Importance of Elasticity of Demand',
            ],
            'Supply': [
                'Concept of Supply and Law of Supply',
                'Supply Schedules and Supply Curve',
                'Types of Supply (Composite, Complementary, Competitive)',
                'Factors Determining Supply',
                'Elasticity of Supply and Its Importance',
            ],
            'Theory of Consumer Behaviour': [
                'Utility Concepts (Total, Average and Marginal Utility)',
                'Law of Diminishing Marginal Utility',
                'Consumer Equilibrium',
                'Relationship Between Marginal Utility and Demand Curve',
            ],
            'Theory of Price Determination': [
                'The Market and Interaction of Demand and Supply',
                'Price Determination Under Free and Regulated Markets',
                'Equilibrium Price and Quantity',
                'Effects of Changes in Supply and Demand',
                'Price Controls (Maximum and Minimum Price)',
                'Rationing and Black Market',
            ],
            'Theory of Production': [
                'Division of Labour and Specialization',
                'Scale of Production (Internal and External Economies)',
                'Total, Average and Marginal Productivity',
                'Law of Variable Proportions (Diminishing Returns)',
            ],
            'Theory of Cost and Revenue': [
                'Cost Concepts (Fixed, Variable, Total, Average, Marginal)',
                'Short-Run and Long-Run Costs',
                'Opportunity Cost vs Money Cost',
                'Revenue Concepts (Total, Average and Marginal Revenue)',
            ],
            'Market Structure': [
                'Perfect Competition',
                'Monopoly',
                'Monopolistic Competition',
                'Oligopoly',
                'Price Discrimination',
            ],
            'Business Organizations': [
                'Sole Proprietorship',
                'Partnership',
                'Joint-Stock Companies (Private and Public)',
                'Cooperatives and Statutory Corporations',
                'Sources of Funds',
                'Privatization and Commercialization',
                'Indigenization and Nationalization',
            ],
            'Distributive Trade': [
                'Process of Distribution',
                'Role of Wholesalers, Retailers and Cooperatives',
                'Role of Government Agencies in Distribution',
                'Problems of Distribution and Solutions',
            ],
            'Population and Labour Market': [
                'Population: Size, Growth and Distribution',
                'Rural-Urban Migration',
                'Malthusian Theory of Population',
                'Optimum Population, Underpopulation and Overpopulation',
                'Labour Force and Human Capital',
                'Efficiency and Mobility of Labour',
                'Wage Determination',
                'Unemployment and Underemployment',
                'Trade Unions and Employers Associations',
            ],
            'Agriculture': [
                'Structure of Agriculture (Food Crops, Export Crops, Livestock, Fisheries)',
                'Systems of Agriculture (Peasant, Commercial, Cooperative, State Farming)',
                'Importance of Agriculture to the National Economy',
                'Marketing of Agricultural Products',
            ],
            'Industrialization': [
                'Meaning and Types of Industries',
                'Location of Industry and Localization',
                'Role of Industrialization in Economic Development',
                'Strategies and Problems of Industrialization',
                'Link Between Agricultural and Industrial Development',
            ],
            'National Income': [
                'Major National Income Concepts (GDP, GNP, NNP)',
                'Methods of Measuring National Income',
                'Problems of National Income Measurement',
                'Uses and Limitations of National Income Data',
            ],
            'Money and Inflation': [
                'Definition, Historical Development and Functions of Money',
                'Barter and Its Problems',
                'Types and Characteristics of Money',
                'Supply of and Demand for Money',
                'Inflation: Meaning, Types, Causes, Effects and Control',
            ],
            'Financial Institutions': [
                'Central Bank and Its Functions',
                'Commercial Banks and Credit Creation',
                'Development Banks and Merchant Banks',
                'Insurance Companies and Building Societies',
                'Money Market and Capital Market',
                'Stock Exchange',
            ],
            'Public Finance': [
                'Fiscal Policy and Objectives of Public Finance',
                'Sources of Government Revenue',
                'Taxation: Types, Objectives, Merits and Demerits',
                'Principles and Rates of Taxation',
                'Government Expenditure (Recurrent and Capital)',
                'Government Budget and National Debt',
            ],
            'Economic Development and Planning': [
                'Meaning of Economic Development vs Economic Growth',
                'Characteristics and Problems of Developing Countries',
                'Elements of Development Planning',
                'Types of Plans (Short-term, Medium-term, Long-term)',
            ],
            'International Trade and Balance of Payments': [
                'Basis of International Trade (Absolute and Comparative Advantage)',
                'Terms of Trade',
                'Commercial Policy: Tariffs and Direct Control',
                'Balance of Payments: Meaning and Components',
                'Balance of Payments Disequilibrium and Adjustments',
                'Exchange Rate Policy and Exchange Control',
            ],
            'Economic Integration': [
                'Meaning, Objectives and Levels of Economic Integration',
                'ECOWAS: Development and Problems',
            ],
            'International Economic Organizations': [
                'United Nations Conference on Trade and Development (UNCTAD)',
                'International Monetary Fund (IMF)',
                'World Bank (IBRD)',
                'African Development Bank (AfDB)',
                'Organization of Petroleum Exporting Countries (OPEC)',
                'Economic Commission for Africa (ECA)',
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
        self.stdout.write(self.style.SUCCESS(f'Economics done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_government.py ─────────────────────────────────────────────────────
cat > catalog/management/commands/seed_government.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Government themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Government')

        data = {
            'Meaning and Scope of Government': [
                'Government as an Institution of the State',
                'Government as a Process or Art of Governing',
                'Government as an Academic Field of Study',
            ],
            'Basic Concepts and Principles of Government': [
                'Power, Authority and Legitimacy',
                'Sovereignty, Democracy and Political Culture',
                'Political Socialization',
                'Communalism, Socialism, Communism and Capitalism',
                'Fascism, Nazism and Totalitarianism',
                'Society, State and Nation',
                'Colonialism and Nationalism',
                'Rule of Law',
                'Fundamental Human Rights',
                'Separation of Powers and Checks and Balances',
                'Constitutionalism',
                'Political Participation and Representative Government',
                'Centralization and Decentralization',
            ],
            'Constitutions': [
                'Definition and Sources of a Constitution',
                'Types of Constitution (Written/Unwritten, Rigid/Flexible)',
                'Functions of a Constitution',
            ],
            'Types and Forms of Government': [
                'Unitary System of Government',
                'Federal System of Government',
                'Confederal System of Government',
                'Presidential (Non-Parliamentary) System',
                'Parliamentary (Cabinet) System',
                'Monarchical and Republican Government',
            ],
            'Organs of Government': [
                'The Executive: Types, Structure, Functions and Limitations',
                'The Legislature: Types, Structure, Functions and Limitations',
                'The Judiciary: Types, Structure, Functions and Limitations',
            ],
            'Citizenship': [
                'Status, Rights, Duties and Obligations of Citizens',
            ],
            'Political Parties and Party Systems': [
                'Political Parties: Definition, Organization, Types and Functions',
                'Party Systems: Definition, Types and Characteristics',
            ],
            'The Electoral Process': [
                'Meaning, Types and Suffrage',
                'Purposes of Elections',
                'Organization and Features of Free and Fair Elections',
                'Types and Characteristics of Electoral Systems',
                'Electoral Commission: Roles, Problems and Organization',
            ],
            'Pressure Groups and Public Opinion': [
                'Pressure Groups: Definition, Types and Functions',
                'Public Opinion: Definition, Formation and Functions',
            ],
            'Public Administration': [
                'Definition of Public Administration',
                'Civil Service: Meaning, Structure, Characteristics and Functions',
                'Public Service Commission: Composition and Functions',
                'Public Corporations: Definition, Functions and Problems',
                'Local Government: Meaning, Types, Functions and Revenue Sources',
            ],
            'Pre-Colonial Political Administration': [
                'Hausa/Fulani Political System',
                'Yoruba Political System',
                'Igbo Political System',
                'Other West African Traditional Political Systems',
            ],
            'Colonial Administration in West Africa': [
                'Reasons for Colonialism',
                'British Colonial Administration (Crown Colony, Protectorate, Indirect Rule)',
                'French Colonial Administration (Assimilation and Association)',
                'Chieftaincy During the Colonial Period',
            ],
            'Nationalism in West Africa': [
                'Nationalism Before the Second World War (Proto-Nationalism)',
                'Nationalism After the Second World War: Factors, Growth and Effects',
            ],
            'Constitutional Development in Nigeria': [
                'Clifford Constitution 1922',
                'Richards Constitution 1946',
                'Macpherson Constitution 1951',
                'Lyttleton Constitution 1954',
                'Independence Constitution 1960',
                'Republican Constitution 1963',
                'The 1979 Constitution',
                'The 1989 Constitution',
                'The 1999 Constitution',
            ],
            'Development of Political Parties in Nigeria': [
                'Formation, Objectives, Achievements and Failures of Major Parties',
            ],
            'Military Rule in Nigeria': [
                'Causes of Military Intervention in Politics',
                'Military Regimes in Nigeria',
                'Effects of Military Rule',
                'Transition to Civilian Rule',
            ],
            'Federal and Unitary Systems in West Africa': [
                'Factors, Structures, Features and Problems of Federalism',
                'Federalism in Nigeria',
            ],
            'Foreign Policy and International Relations': [
                'Foreign Policy: Definition, Factors, Advantages and Disadvantages',
                'Diplomacy and Its Functions',
                "Nigeria's Foreign Policy",
            ],
            'International Organizations': [
                'United Nations Organization (UNO): Origin, Aims, Structure and Functions',
                'Organization of African Unity (OAU) / African Union (AU)',
                'The Commonwealth: Origin, Aims and Functions',
                'ECOWAS: Origin, Aims, Structure and Achievements',
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
        self.stdout.write(self.style.SUCCESS(f'Government done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_geography.py ──────────────────────────────────────────────────────
cat > catalog/management/commands/seed_geography.py << 'ENDOFFILE'
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
ENDOFFILE

# ── seed_english.py ────────────────────────────────────────────────────────
cat > catalog/management/commands/seed_english.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed English Language themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='English Language')

        data = {
            'Essay Writing': [
                'Letter Writing (Formal and Informal)',
                'Speech Writing',
                'Narrative Essays',
                'Descriptive Essays',
                'Debate and Argumentative Essays',
                'Report Writing',
                'Article Writing',
                'Expository Writing',
                'Creative Writing',
                'Content, Organization, Expression and Mechanical Accuracy',
            ],
            'Comprehension': [
                'Understanding Factual Content of Passages',
                'Making Inferences from Passages',
                'Finding Appropriate Equivalents for Words and Phrases',
                'Identifying Sentiments, Emotions and Attitudes',
                'Identifying and Labelling Grammatical Structures',
                'Identifying and Explaining Literary Terms',
                'Recasting Phrases or Sentences into Grammatical Alternatives',
            ],
            'Summary Writing': [
                'Extracting Relevant Information',
                'Summarizing Points in Clear, Concise English',
                'Presenting Summaries of Specific Aspects of a Passage',
                'Avoiding Repetition, Redundancy and Extraneous Material',
            ],
            'Lexis and Vocabulary': [
                'Vocabulary of Everyday Usage',
                'Vocabulary of Finance, Commerce and Banking',
                'Vocabulary of Science and Technology',
                'Vocabulary of Government and Politics',
                'Vocabulary of Transport and Communication',
                'Vocabulary of Sports and Entertainment',
                'Idioms and Idiomatic Expressions',
                'Collocations',
                'Figurative Language and Usage',
            ],
            'Structure and Grammar': [
                'Parts of Speech (Nouns, Pronouns, Verbs, Adjectives, Adverbs)',
                'Sentence Types and Sentence Structure',
                'Sequence of Tenses',
                'Subject-Verb Agreement (Concord)',
                'Matching of Pronouns with Noun Referents',
                'Use of Correct Prepositions',
                'Active and Passive Voice',
                'Direct and Indirect Speech',
                'Conditional Sentences',
                'Conjunctions, Articles, Determiners and Structural Words',
                'Punctuation',
                'Spelling',
            ],
            'Oral English': [
                'Vowel Sounds (Pure Vowels and Diphthongs)',
                'Consonant Sounds (Single Consonants and Clusters)',
                'Word Stress and Sentence Stress',
                'Intonation',
                'Rhymes and Sound Contrasts',
                'Listening Comprehension (Dialogues and Narratives)',
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
        self.stdout.write(self.style.SUCCESS(f'English Language done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_literature.py ─────────────────────────────────────────────────────
cat > catalog/management/commands/seed_literature.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Literature in English themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Literature in English')

        data = {
            'General Knowledge of Literature': [
                'Definition and Branches of Literature (Prose, Drama, Poetry)',
                'Literary Terms and Devices (Simile, Metaphor, Alliteration, Irony, etc.)',
                'Elements of Fiction (Plot, Setting, Theme, Character, Style)',
                'Elements of Drama (Conflict, Acts, Scenes, Stage Directions)',
                'Elements of Poetry (Rhyme, Rhythm, Tone, Mood, Imagery)',
                'Figures of Speech',
                'Unseen Prose Passages',
                'Unseen Poetry Analysis',
            ],
            'African Prose': [
                'Plot and Setting in African Prose',
                'Character and Characterisation in African Prose',
                'Theme and Subject Matter in African Prose',
                'Style and Language in African Prose',
                'Social and Cultural Context of African Prose',
            ],
            'Non-African Prose': [
                'Plot and Setting in Non-African Prose',
                'Character and Characterisation in Non-African Prose',
                'Theme and Subject Matter in Non-African Prose',
                'Style and Language in Non-African Prose',
            ],
            'Shakespearean Text': [
                'Plot Summary and Structure in Shakespeare',
                'Character Analysis in Shakespeare',
                'Themes in Shakespearean Drama',
                'Setting and Context in Shakespeare',
                'Language and Style in Shakespeare',
                'Context Questions on Prescribed Shakespearean Text',
            ],
            'African Drama': [
                'Plot and Conflict in African Drama',
                'Character and Characterisation in African Drama',
                'Themes in African Drama',
                'Dramatic Techniques in African Drama',
                'Cultural Context of African Drama',
            ],
            'Non-African Drama': [
                'Plot and Conflict in Non-African Drama',
                'Character and Characterisation in Non-African Drama',
                'Themes in Non-African Drama',
                'Dramatic Techniques in Non-African Drama',
            ],
            'African Poetry': [
                'Poetic Devices in African Poetry',
                'Themes and Subject Matter in African Poetry',
                'Tone, Mood and Attitude in African Poetry',
                'Analysis of Prescribed African Poems',
                '"Once Upon a Time" by Gabriel Okara',
                '"Not My Business" by Niyi Osundare',
                '"Night" by Wole Soyinka',
                '"New Tongue" by Elizabeth L.A. Kamara',
            ],
            'Non-African Poetry': [
                'Poetic Devices in Non-African Poetry',
                'Themes and Subject Matter in Non-African Poetry',
                'Tone, Mood and Attitude in Non-African Poetry',
                'Analysis of Prescribed Non-African Poems',
                '"She Walks in Beauty" by Lord Byron',
                '"Still I Rise" by Maya Angelou',
                '"Digging" by Seamus Heaney',
                '"The Stone" by Wilfrid Wilson Gibson',
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
        self.stdout.write(self.style.SUCCESS(f'Literature in English done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_agric.py ──────────────────────────────────────────────────────────
cat > catalog/management/commands/seed_agric.py << 'ENDOFFILE'
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
                topic, tc = Topic.objects.get_or_create(
                    subject=subject, name=name, defaults={'theme': theme}
                )
                if tc:
                    ctp += 1
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])
        self.stdout.write(self.style.SUCCESS(f'Agricultural Science done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_further_maths.py ──────────────────────────────────────────────────
cat > catalog/management/commands/seed_further_maths.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Further Mathematics themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Further Mathematics')

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
        self.stdout.write(self.style.SUCCESS(f'Further Mathematics done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_commerce.py ───────────────────────────────────────────────────────
cat > catalog/management/commands/seed_commerce.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Commerce themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Commerce')

        data = {
            'Introduction to Commerce': [
                'Meaning, Scope and Functions of Commerce',
                'History of Commerce',
                'Types of Occupations (Industry, Commerce, Direct and Indirect Services)',
                'Primary, Secondary and Tertiary Production',
                'Inter-relationship Between Production and Exchange',
            ],
            'Business Units': [
                'Sole Proprietorship: Formation, Characteristics, Advantages and Disadvantages',
                'Partnership: Formation, Characteristics, Advantages and Disadvantages',
                'Private Limited Liability Companies',
                'Public Limited Liability Companies',
                'Public Enterprises and Cooperative Societies',
                'Dissolution and Liquidation of Business Units',
            ],
            'Business Capital and Profits': [
                'Types of Capital (Authorized, Issued, Called-up, Paid-up, Working Capital)',
                'Calculation of Working Capital',
                'Profit: Meaning, Types and Calculation',
                'Turnover: Meaning and Calculation',
                "Trade Associations: Chamber of Commerce, Employers' and Consumer Associations",
            ],
            'Home Trade': [
                'Purpose and Branches of Trade',
                'Functions of the Retailer',
                'Types of Retail Outlets (Department Stores, Supermarkets, etc.)',
                'Trends in Retailing (Branding, Self-Service, E-Commerce)',
                'Functions of the Wholesaler',
                'Types of Wholesalers (Merchant and Agent)',
                'Warehousing: Importance, Functions and Types',
                'Channels of Distribution and Factors for Choice',
                'Forces for Elimination and Survival of the Middleman',
            ],
            'Foreign Trade': [
                'Basic Concepts (Terms of Trade, Balance of Trade, Balance of Payment)',
                'Export, Import and Entrepot Trade',
                'Procedures and Documents Used in Foreign Trade',
                'Visible and Invisible Trade',
                'Barriers to International Trade',
                'Functions of Ports Authority, Customs and Excise',
                'Export Promotion Council',
            ],
            'Purchase and Sale of Goods': [
                'Procedures and Documents in Buying and Selling',
                'Trade Discount, Cash Discount and Quantity Discount',
                'Terms of Trade (C.O.D., C.I.F., F.O.B.)',
                'Terms and Means of Payment (Cash, Hire Purchase, Cheques, Bank Drafts)',
                'Bills of Exchange and Promissory Notes',
            ],
            'Finance and Financial Institutions': [
                'Money: Meaning, Forms, Qualities and Functions',
                'Central Bank: Features and Functions',
                'Commercial Banks: Features, Types of Accounts and Functions',
                'Principles of Insurance (Utmost Good Faith, Insurable Interest, Indemnity)',
                'Types of Insurance (Fire, Marine, Life, Motor, Burglary)',
                'Stock Exchange: Meaning, Functions and Types of Securities',
                'Credit: Meaning, Types and Functions',
                'Credit Unions and Thrift Societies',
            ],
            'Transport and Communications': [
                'Meaning and Importance of Transport',
                'Forms of Transport (Land, Water, Air, Pipeline): Advantages and Disadvantages',
                'Functions of Seaports and Airports',
                'Communication: Meaning, Importance and Services',
                'Post Office, Courier Agencies and ICT in Commerce',
            ],
            'Introduction to Marketing': [
                'Marketing: Meaning, Importance, Functions and Marketing Mix (4Ps)',
                'Market Segmentation and Consumer Sovereignty',
                'Advertising: Meaning, Role, Types, Media, Advantages and Disadvantages',
                'Public Relations and Customer Services',
                'Sales Promotion (Trade Fairs, Gifts, Exhibitions)',
                'Personal Selling: Meaning and Uses',
            ],
            'Legal Aspects of Business': [
                'Contract Law in Business',
                'Agency Law',
                'Sale of Goods Act and Hire Purchase Act',
                'Trade Description Act and Copyright',
                'Rights and Obligations of Employer and Employee',
                'Government Regulation of Business (Registration, Patents, Trademarks)',
                'Consumer Protection: Need, Means and Government Legislation',
            ],
            'Economic Groupings': [
                'ECOWAS: Objectives and Obstacles',
                'International Bank for Reconstruction and Development (IBRD)',
                'International Monetary Fund (IMF)',
                'UNCTAD and Other Economic Groupings',
                'Nationalization and Indigenization/Divestiture',
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
        self.stdout.write(self.style.SUCCESS(f'Commerce done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_accounting.py ─────────────────────────────────────────────────────
cat > catalog/management/commands/seed_accounting.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Financial Accounting themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Financial Accounting')

        data = {
            'Introduction to Financial Accounting': [
                'History, Nature and Functions of Accounting',
                'Users of Accounting Information',
                'Stages in the Accounting Process',
                'Characteristics of Accounting Information',
            ],
            'Accounting Equation and Double Entry': [
                'The Accounting Equation',
                'Source Documents and Their Functions',
                'Subsidiary Books (Daybooks)',
                'The Ledger and Classification of Accounts',
                'Cash Book (Analytical and Petty Cash Book)',
                'Preparation of Trial Balance',
                'Bank Reconciliation Statements',
                'Correction of Errors and Suspense Account',
            ],
            'Accounting Concepts': [
                'Meaning and Types of Accounting Concepts',
                'Significance and Limitations of Accounting Concepts',
            ],
            'Final Accounts of a Sole Trader': [
                'Trading Account',
                'Profit and Loss Account / Income Statement',
                'Balance Sheet / Statement of Financial Position',
                'Adjustments to Final Accounts (Accruals, Prepayments, etc.)',
            ],
            'Provisions and Reserves': [
                'Provision for Doubtful Debts',
                'Provision for Discounts',
                'Depreciation: Concepts, Reasons and Methods',
                'Straight Line Method of Depreciation',
                'Reducing Balance Method of Depreciation',
                'Accounting for Depreciation',
                'Revenue and Capital Reserves',
            ],
            'Manufacturing Accounts': [
                'Purpose of Manufacturing Accounts',
                'Cost Classification in Manufacturing Accounts',
                'Preparation of Final Accounts of Manufacturing Concern',
            ],
            'Control Accounts and Self-Balancing Ledgers': [
                'Meaning and Uses of Control Accounts',
                'Sales Ledger Control Account',
                'Purchases Ledger Control Account',
                'Reconciliation of Control Accounts',
            ],
            'Single Entry and Incomplete Records': [
                'Meaning and Limitations of Single Entry',
                'Computation of Profit or Loss from Opening and Closing Balance Sheets',
                'Conversion of Single Entry to Double Entry',
                'Preparation of Final Accounts from Incomplete Records',
                'Mark-Up and Margin',
            ],
            'Accounts of Not-for-Profit Organizations': [
                'Meaning and Terminologies',
                'Receipts and Payments Accounts',
                'Subscriptions Account',
                'Income and Expenditure Accounts',
                'Accumulated Fund and Balance Sheet',
            ],
            'Partnership Accounts': [
                'Nature and Formation of Partnership',
                'Partnership Agreements and Deed',
                'Profit and Loss Appropriation Accounts',
                "Partners' Capital Accounts and Balance Sheet",
                'Admission of a New Partner',
                'Treatment of Goodwill and Revaluation of Assets',
                'Dissolution of Partnership',
            ],
            'Company Accounts': [
                'Nature and Formation of a Company',
                'Types of Companies and Shares',
                'Issue of Shares',
                'Loan Capital, Debentures and Mortgages',
                'Final Accounts of a Company',
                'Interpretation of Accounts Using Simple Ratios',
                'Purchase of Business Account',
                'Statement of Cash Flow',
            ],
            'Departmental and Branch Accounts': [
                'Meaning and Importance of Departmental Accounts',
                'Differences Between a Department and Branch',
                'Preparation of Departmental Account',
                'Preparation of Branch Account',
                'Inter-Branch Transactions',
            ],
            'Public Sector Accounting': [
                'Meaning and Differences Between Public and Private Sector Accounts',
                'Sources of Public Revenue',
                'Capital and Recurrent Expenditures',
                'Preparation of Simple Government Accounts',
            ],
            'Miscellaneous Accounts': [
                'Joint Venture Accounts',
                'Consignment Accounts',
                'Contract Accounts',
                'Hire Purchase Accounts',
                'Value Added Tax (VAT): Purpose, Computation and Returns',
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
        self.stdout.write(self.style.SUCCESS(f'Financial Accounting done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_crs.py ────────────────────────────────────────────────────────────
cat > catalog/management/commands/seed_crs.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Christian Religious Studies themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Christian Religious Studies')

        data = {
            'Themes from the Old Testament': [
                'God the Creator and Controller of the Universe (Sovereignty of God)',
                'Leadership Roles: Joseph',
                'Leadership Roles: Moses',
                'Leadership Roles: Joshua',
                'Leadership Roles: Deborah',
                'Parental Responsibility: Eli and Samuel',
                "Consequences of Saul's Disobedience",
                "David's Submission to the Will of God",
                "David's Sin, Repentance and Forgiveness",
                "Solomon's Wisdom and Making Decisions",
                'The Unwise Decision of Solomon and Rehoboam',
                "Religious Tensions During Ahab's Reign (Supremacy of God)",
                'Elijah at Mount Carmel',
                'Greed and Its Effects: Ahab and Gehazi',
                'Religious Reforms: Reign of King Josiah',
                "Concern for One's Nation (Nehemiah)",
                'Faith and Courage: Daniel',
                'True Religion and Social Justice: Amos',
                "God's Divine Love: Hosea",
            ],
            'Themes from the Synoptic Gospels and Acts': [
                'The Baptism of Jesus',
                'The Temptation of Jesus',
                'The Call and Demands of Discipleship',
                "Jesus' Teaching on Forgiveness",
                'Jesus at Gethsemane',
                "Peter's Denials",
                'The Trial and Condemnation of Jesus',
                'The Crucifixion and Burial of Jesus',
                'The Resurrection of Jesus',
                'Fellowship in the Early Church',
                'The Holy Spirit at Pentecost',
                'Mission to the Gentiles',
                'Opposition to the Gospel Message',
            ],
            'Themes from Selected Epistles': [
                'Faith and Works (Epistle of James)',
                'Impartiality (Epistle of James)',
                'Effective Prayers (Epistle of James)',
                'Good Citizenship (1 Peter)',
                'Christians Living Among Non-Christians (1 Peter)',
                'Interpersonal Relationships Among Christians (1 Peter)',
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
        self.stdout.write(self.style.SUCCESS(f'Christian Religious Studies done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_irs.py ────────────────────────────────────────────────────────────
cat > catalog/management/commands/seed_irs.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Islamic Religious Studies themes and topics'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Islamic Religious Studies')

        data = {
            'Tawhid (Belief in Allah)': [
                'The Oneness of Allah (Tawhid)',
                'Attributes of Allah (Asmaul Husna)',
                'Belief in Angels and Their Functions',
                'Belief in the Books of Allah',
                'Belief in the Prophets and Messengers',
                'Belief in the Last Day (Yawm al-Qiyamah)',
                'Al-Qadar: Belief in Divine Decree',
            ],
            'Ibadah (Acts of Worship)': [
                'Shahada: The Declaration of Faith',
                'Salat: Obligatory Prayers (Times, Conditions, Procedure)',
                'Zakat: Almsgiving (Conditions, Nisab, Recipients)',
                'Sawm: Fasting in Ramadan (Rules, Benefits, Exemptions)',
                'Hajj: Pilgrimage to Makkah (Conditions, Rites, Significance)',
                "Voluntary Acts of Worship (Nafl, Dhikr, Du'a)",
            ],
            'The Quran': [
                'Introduction to the Quran: Meaning and Significance',
                'Revelation and Compilation of the Quran',
                'Selected Surahs and Their Meanings',
                'Tafsir: Interpretation of the Quran',
                'Tajweed: Rules of Quranic Recitation',
                'Virtues of Reciting the Quran',
            ],
            'Hadith and Sunnah': [
                'Importance and Authority of Hadith',
                "Classification of Hadith (Sahih, Hasan, Da'if)",
                'Selected Hadiths and Their Teachings',
                'The Sunnah of the Prophet (SAW)',
            ],
            'History of Islam': [
                'Arabia Before Islam (Pre-Islamic Period)',
                'Birth and Early Life of Prophet Muhammad (SAW)',
                'Prophethood and the First Revelation',
                'Persecution in Makkah and Hijra to Madinah',
                'The Islamic State in Madinah',
                'Conquest of Makkah and Spread of Islam in Arabia',
                'The Rightly Guided Caliphs (Abu Bakr, Umar, Uthman, Ali)',
                'Spread of Islam in West Africa',
                'Islam in Nigeria: History and Development',
            ],
            'Islamic Ethics and Values': [
                'Honesty and Truthfulness (Sidq and Amanah)',
                'Respect for Parents and Elders',
                'Brotherhood and Unity in Islam (Ukhuwwah)',
                'Justice and Equity (Adl)',
                'Islamic Family Law: Marriage (Nikah) and Conditions',
                "Islamic Family Law: Divorce (Talaq) and Khul')",
                'Islamic Law of Inheritance (Mirath)',
                'Halal and Haram: Permissible and Forbidden Things',
                'Islamic Social Ethics (Community Life, Good Character)',
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
        self.stdout.write(self.style.SUCCESS(f'Islamic Religious Studies done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

# ── seed_computer.py ───────────────────────────────────────────────────────
cat > catalog/management/commands/seed_computer.py << 'ENDOFFILE'
from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Computer Science themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.objects.get_or_create(name='Computer Science')

        data = {
            'Computer Evolution': [
                "Early Computing Devices (Abacus, Pascal's Calculator, Babbage's Engine, Hollerith Machine)",
                'Generations of Computers (ENIAC, EDVAC, UNIVAC, Personal Computers)',
                'Development Trends from Early to Modern Computers',
                'Types of Computers (Desktop, Laptop, Tablet, Palmtop)',
            ],
            'Fundamentals of Computing': [
                'Definition and Two Main Constituents of a Computer',
                'Computer Hardware: Definition, Classification and Examples',
                'Computer Software: Definition, Classification and Examples',
                'Functional Parts of a Computer',
                'Characteristics of Computers (Speed, Accuracy, Storage, Electronic)',
                'Differences Between Hardware and Software',
                'Data and Information: Definition and Examples',
            ],
            'Computer Ethics and Human Issues': [
                'Computer Security and Ethics',
                'Sources of Security Breaches (Viruses, Worms, Trojans, Hackers)',
                'Preventive Measures (Antivirus, Firewall, Encryption)',
                'Copyright and Intellectual Property Rights',
                'Privacy and Cyber Crimes (Identity Theft, Internet Fraud, Hacking)',
                'Legal Issues in Computing',
            ],
            'Computer Hardware': [
                'Input Devices: Definition, Examples and Functions (Keyboard, Mouse, Scanner)',
                'Output Devices: Definition, Examples and Functions (Monitor, Printer, Plotter)',
                'Central Processing Unit (ALU and Control Unit)',
                'Memory Unit: Primary Memory (ROM and RAM)',
                'Secondary Memory Devices (Hard Disk, Flash Drive, CD, DVD)',
                'Units of Storage (Bits, Bytes, KB, MB, GB, TB) and Conversions',
                'Logic Gates (AND, OR, NOT, NAND, NOR, XOR)',
                'Truth Tables for Logic Gates',
                'Simple Comparator Circuits',
            ],
            'Computer Software': [
                'System Software: Operating Systems (Windows, Linux, UNIX, Android)',
                'Translators: Assemblers, Compilers and Interpreters',
                'Utility Programs (Editors, Antivirus)',
                'Graphical User Interface (GUI) vs Command Line Interface',
                'Application Software: Definition, Types and Examples',
                'Common Application Packages (Word Processor, Spreadsheet, Database)',
            ],
            'Computer Applications': [
                'Word Processing: Features and Operations in MS Word',
                'Creating, Editing, Formatting, Saving and Printing Documents',
                'Spreadsheet: Features and Operations in MS Excel',
                'Data Entry, Formulas, Built-in Functions and Charts in Excel',
                'Database: Meaning, Basic Terms (File, Record, Field, Key)',
                'Types of Database Organization (Hierarchical, Network, Relational)',
                'Features of Database Management Systems',
                'Graphics and Presentation Software',
            ],
            'The Internet and Networking': [
                'Meaning and Types of Computer Networks (LAN, WAN, MAN)',
                'Network Topologies (Bus, Star, Ring)',
                'The Internet: Meaning, History and Uses',
                'World Wide Web (WWW) and Web Browsers',
                'Email: Meaning, Features and Uses',
                'Social Media and Online Communication',
                'E-Commerce and Online Transactions',
                'Internet Security and Safe Online Practices',
            ],
            'Programming and Problem Solving': [
                'Problem Solving and Algorithm Development',
                'Flowcharts: Symbols and Construction',
                'Pseudocode',
                'Introduction to Programming Languages',
                'Types of Programming Languages (Low-level and High-level)',
                'Basic Programming Concepts (Variables, Data Types, Operators)',
                'Control Structures (Sequence, Selection, Iteration)',
                'Introduction to a Programming Language (e.g., BASIC, Python)',
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
        self.stdout.write(self.style.SUCCESS(f'Computer Science done — {ct} themes, {ctp} topics created.'))
ENDOFFILE

echo ""
echo "✅ All seed files created successfully in catalog/management/commands/"
echo ""
echo "Files created:"
ls catalog/management/commands/seed_*.py