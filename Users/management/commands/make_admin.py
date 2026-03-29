from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Make a user superuser/admin'

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            u = User.objects.get(email='deetitos@gmail.com')
            u.is_staff = True
            u.is_superuser = True
            u.is_admin = True
            u.set_password('Mautech2017')
            u.save()
            self.stdout.write('Successfully made admin')
        except User.DoesNotExist:
            self.stdout.write('User not found')