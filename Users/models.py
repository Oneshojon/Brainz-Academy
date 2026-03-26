from django.db import models
from django.contrib.auth.models import AbstractUser,  BaseUserManager
from django.utils import timezone


# Create your models here.


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()  # important for OTP-only login

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)
    
    


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('STUDENT', 'Student'),
        ('TEACHER', 'Teacher'),
    ]

    username = None
    email = models.EmailField('Email address', unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    # On the User model, add these fields:
    streak = models.PositiveIntegerField(default=0)
    last_practice_date = models.DateField(null=True, blank=True)
    referral_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    referred_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals')
    is_admin = models.BooleanField(default=False)
    
    GENDER_CHOICES = [
    ('M', 'Male'),
    ('F', 'Female'),
    ('O', 'Other'),
    ('N', 'Prefer not to say'),
]
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)

    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def is_teacher(self):
        return self.role == 'TEACHER'

    @property
    def is_student(self):
        return self.role == 'STUDENT'
    
    @property
    def active_subscription(self):
        """Returns the user's current active subscription or None."""
        if not hasattr(self, '_active_subscription_cache'):
            self._active_subscription_cache = self.subscriptions.filter(
                status='ACTIVE',
                expires_at__gt=timezone.now()
            ).select_related('plan').first()
        return self._active_subscription_cache
 
    def has_subscription(self, plan_type=None):
        """
        Check if user has an active subscription.
        Optionally check for a specific plan type.

        Usage:
            user.has_subscription()                    # any active sub
            user.has_subscription('STUDENT_BASIC')     # specific plan
            user.has_subscription('TEACHER_PRO')
        """
        sub = self.active_subscription
        if not sub:
            return False
        if plan_type:
            return sub.plan.plan_type == plan_type
        return True
 
    @property
    def subscription_status(self):
         """Returns a display string for the user's subscription status. """
         sub = self.active_subscription
         if sub:
               return f"{sub.plan.name} ({sub.days_remaining}d left)"
         return 'Free'
    
class Referral(models.Model):
    referrer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='referrals_made')
    referred = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='referral_record')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.referrer} referred {self.referred}"