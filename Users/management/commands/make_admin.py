from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Make a user superuser/admin'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str)
        parser.add_argument('password', type=str)

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            u = User.objects.get(email=options['email'])
            u.is_staff = True
            u.is_superuser = True
            u.is_admin = True
            u.set_password(options['password'])
            u.save()
            self.stdout.write(f"Successfully made {options['email']} admin")
        except User.DoesNotExist:
            self.stdout.write(f"User {options['email']} not found")
```

Then set pre-deploy command to:
```
python manage.py migrate --noinput && python manage.py make_admin deetitos@gmail.com your-strong-password