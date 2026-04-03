from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Economics themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.get_or_create_safe(name='Economics')

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
        self.stdout.write(self.style.SUCCESS(f'Economics done — {ct} themes, {ctp} topics created.'))
