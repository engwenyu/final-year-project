from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('id', 'username', 'email', 'user_type', 'phone_number', 'nfc_card_id', 'is_active', 'created_at')
    list_filter = ('user_type', 'is_active', 'created_at')
    search_fields = ('username', 'email', 'phone_number', 'nfc_card_id')
    ordering = ('id',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'phone_number', 'nfc_card_id', 'profile_image')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
        ('User Type', {'fields': ('user_type',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'user_type', 'phone_number', 'nfc_card_id', 'password1', 'password2'),
        }),
    )
