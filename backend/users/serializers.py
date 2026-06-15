import re

from rest_framework import serializers

from .models import CustomUser


NAME_PATTERN = r'^[А-Яа-яЁё -]+$'
PHONE_PATTERN = r'^\+?\d{10,15}$'
PASSWORD_PATTERN = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$'
TELEGRAM_PATTERN = r'^@?[A-Za-z0-9_]{5,32}$'


def normalize_phone(value):
    return ''.join(
        character
        for character in value.strip()
        if character not in ' ()-'
    )


def normalize_telegram(value):
    telegram = value.strip()
    if not telegram:
        return ''
    telegram = telegram.replace('https://t.me/', '').replace('http://t.me/', '')
    telegram = telegram.replace('t.me/', '')
    if not re.fullmatch(TELEGRAM_PATTERN, telegram):
        raise serializers.ValidationError(
            'Введите Telegram в формате @username.'
        )
    return telegram if telegram.startswith('@') else f'@{telegram}'


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.RegexField(
        NAME_PATTERN,
        error_messages={
            'invalid': 'Допустимы только кириллица, пробел и дефис.'
        },
    )
    phone = serializers.CharField()
    password = serializers.RegexField(
        PASSWORD_PATTERN,
        write_only=True,
        error_messages={
            'invalid': (
                'Пароль должен содержать не менее 7 латинских символов, '
                'одну строчную, одну заглавную букву и одну цифру. '
                'Специальные символы разрешены.'
            )
        },
    )
    telegram = serializers.CharField(required=False, allow_blank=True)
    password_confirmation = serializers.CharField(write_only=True)
    confirm = serializers.BooleanField(required=True)

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'name',
            'email',
            'phone',
            'telegram',
            'password',
            'password_confirmation',
            'confirm',
        )

    def validate_email(self, value):
        email = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                'Пользователь с таким email уже существует.'
            )
        return email

    def validate_name(self, value):
        return value.strip()

    def validate_phone(self, value):
        phone = normalize_phone(value)
        if not re.fullmatch(PHONE_PATTERN, phone):
            raise serializers.ValidationError(
                'Введите телефон из 10–15 цифр.'
            )
        return phone

    def validate_telegram(self, value):
        return normalize_telegram(value)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError({
                'password_confirmation': 'Пароли не совпадают.'
            })
        if not attrs['confirm']:
            raise serializers.ValidationError({
                'confirm': 'Необходимо согласие на обработку персональных данных.'
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirmation')
        email = validated_data['email']
        return CustomUser.objects.create_user(
            username=email,
            **validated_data,
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField()

    def validate_email(self, value):
        return value.strip().lower()


class PhoneSerializer(serializers.Serializer):
    phone = serializers.CharField()

    def validate_phone(self, value):
        phone = normalize_phone(value)
        if not re.fullmatch(PHONE_PATTERN, phone):
            raise serializers.ValidationError(
                'Введите телефон из 10–15 цифр.'
            )
        return phone


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = value.strip().lower()
        user = self.context['request'].user
        if CustomUser.objects.exclude(pk=user.pk).filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                'Пользователь с таким email уже существует.'
            )
        return email


class TelegramSerializer(serializers.Serializer):
    telegram = serializers.CharField(required=False, allow_blank=True)

    def validate_telegram(self, value):
        return normalize_telegram(value)
