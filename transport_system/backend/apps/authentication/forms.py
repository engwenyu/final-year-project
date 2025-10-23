from django import forms
from .models import User

class AdminCreateUserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "role"]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password("defaultpassword123")  # default password
        if commit:
            user.save()
        return user
