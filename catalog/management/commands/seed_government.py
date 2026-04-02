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
                topic, tc = Topic.get_or_create_normalized(
                    subject=subject, name=name, defaults={'theme': theme}
                )
                if tc:
                    ctp += 1
                elif not topic.theme:
                    topic.theme = theme
                    topic.save(update_fields=['theme'])
        self.stdout.write(self.style.SUCCESS(f'Government done — {ct} themes, {ctp} topics created.'))
