import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'examproject.settings')
django.setup()
from django.core.mail import send_mail
try:
    result = send_mail('Test', 'Test email from Brainz Academy', 'noreply@brainzacademy.com', ['deetitos@gmail.com'])
    print(f'Email sent successfully: {result}')
except Exception as e:
    print(f'Error: {e}')
