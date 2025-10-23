
from rest_framework import serializers
from .models import Wallet, PaymentMethod, Transaction
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'completed_at')


class AdminCreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'user_type']

    def create(self, validated_data):
        # Generate default password
        default_password = User.objects.make_random_password()
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            user_type=validated_data['user_type'],
            password=default_password,
            must_change_password=True
        )
        # Create wallet automatically
        Wallet.objects.create(user=user)
        # Attach default password for admin to see
        user.default_password = default_password
        return user