from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser
from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'phone_number', 'nfc_card_id', 'profile_image',
            'date_joined', 'last_login', 'created_at'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')

    def validate(self, attrs):
        # If user_type is passenger, require nfc_card_id
        if attrs.get("user_type") == "passenger" and not attrs.get("nfc_card_id"):
            raise serializers.ValidationError({"nfc_card_id": "Passenger must have an NFC card assigned."})
        
        # Prevent drivers/admins from being assigned NFC
        if attrs.get("user_type") in ["driver", "admin"] and attrs.get("nfc_card_id"):
            raise serializers.ValidationError({"nfc_card_id": "Only passengers can have NFC cards."})
        
        return attrs

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password_confirm', 
                 'first_name', 'last_name', 'user_type', 'phone_number')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()
from apps.payments.models import Wallet
class PassengerSerializer(serializers.ModelSerializer):
    wallet_balance = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "wallet_balance",
        ]  # ✅ make sure wallet_balance is listed here

    def get_wallet_balance(self, obj):
        # get or create ensures wallet exists
        wallet, _ = Wallet.objects.get_or_create(user=obj)
        return wallet.balance