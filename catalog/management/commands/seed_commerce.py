from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Commerce themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.get_or_create_safe(name='Commerce')

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
        self.stdout.write(self.style.SUCCESS(f'Commerce done — {ct} themes, {ctp} topics created.'))
