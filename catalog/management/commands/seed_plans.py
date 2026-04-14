from django.core.management.base import BaseCommand
from catalog.models import SubscriptionPlan, INITIAL_PLANS


class Command(BaseCommand):
    help = 'Seed or update subscription plans from INITIAL_PLANS in catalog/models.py'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be created/updated without writing to the DB.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes will be saved.\n'))

        created_count = 0
        updated_count = 0

        for p in INITIAL_PLANS:
            if dry_run:
                exists = SubscriptionPlan.objects.filter(
                    plan_type=p['plan_type'], duration=p['duration']
                ).exists()
                action = 'Would update' if exists else 'Would create'
                self.stdout.write(f"  {action}: {p['name']}")
                continue

            obj, created = SubscriptionPlan.objects.update_or_create(
                plan_type=p['plan_type'],
                duration=p['duration'],
                defaults=p,
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  Created: {obj.name}"))
            else:
                updated_count += 1
                self.stdout.write(f"  Updated: {obj.name}")

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Done — {created_count} created, {updated_count} updated.'
                )
            )