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
