from django.contrib import admin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_admin', 'is_staff')
    list_filter = ('role', 'is_admin', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')