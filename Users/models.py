from django.db import models
from django.contrib.auth.models import AbstractUser,  BaseUserManager

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
    