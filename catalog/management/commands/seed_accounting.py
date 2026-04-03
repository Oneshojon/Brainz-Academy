from django.core.management.base import BaseCommand
from catalog.models import Subject, Theme, Topic


class Command(BaseCommand):
    help = 'Seed Financial Accounting themes and topics from WAEC syllabus'

    def handle(self, *args, **kwargs):
        subject, _ = Subject.get_or_create_safe(name='Financial Accounting')

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
        self.stdout.write(self.style.SUCCESS(f'Financial Accounting done — {ct} themes, {ctp} topics created.'))
