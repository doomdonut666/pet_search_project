import re

from django.core.files.storage import default_storage
from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from users.models import CustomUser
from users.serializers import (
    NAME_PATTERN,
    PASSWORD_PATTERN,
    PHONE_PATTERN,
    normalize_phone,
    normalize_telegram,
)

from .models import District, Kind, Order, Subscription


PHOTO_VALIDATORS = [FileExtensionValidator(['png', 'jpg', 'jpeg'])]


def build_photo_url(serializer, path):
    if not path:
        return None
    if path.startswith(('http://', 'https://')):
        return path

    url = default_storage.url(path)
    request = serializer.context.get('request')
    return request.build_absolute_uri(url) if request else url


class SliderSerializer(serializers.ModelSerializer):
    kind = serializers.CharField(source='kind.name')
    image = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id',
            'report_type',
            'pet_name',
            'kind',
            'description',
            'image',
        )

    def get_image(self, obj):
        return build_photo_url(self, obj.photos[0]) if obj.photos else None


class PetCardSerializer(serializers.ModelSerializer):
    kind = serializers.CharField(source='kind.name')
    district = serializers.CharField(source='district.name')
    photo = serializers.SerializerMethodField()
    date = serializers.DateField(format='%d-%m-%Y')
    # Название поля сохранено в том виде, в котором оно указано в API ТЗ.
    registred = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id',
            'phone',
            'name',
            'email',
            'report_type',
            'pet_name',
            'mark',
            'kind',
            'photo',
            'description',
            'district',
            'date',
            'registred',
        )

    def get_photo(self, obj):
        return build_photo_url(self, obj.photos[0]) if obj.photos else None

    def get_registred(self, obj):
        return obj.user is not None


class PetSerializer(serializers.ModelSerializer):
    kind = serializers.CharField(source='kind.name')
    district = serializers.CharField(source='district.name')
    photos = serializers.SerializerMethodField()
    can_mark_found = serializers.SerializerMethodField()
    date = serializers.DateField(format='%d-%m-%Y')

    class Meta:
        model = Order
        fields = (
            'id',
            'phone',
            'email',
            'telegram',
            'name',
            'status',
            'can_mark_found',
            'report_type',
            'pet_name',
            'mark',
            'kind',
            'photos',
            'description',
            'district',
            'date',
        )

    def get_photos(self, obj):
        return [build_photo_url(self, path) for path in obj.photos]

    def get_can_mark_found(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if obj.status == 'wasFound':
            return False
        return request.user.is_staff or obj.user_id == request.user.id


class SearchPetSerializer(serializers.ModelSerializer):
    kind = serializers.CharField(source='kind.name')
    district = serializers.CharField(source='district.name')
    photos = serializers.SerializerMethodField()
    date = serializers.DateField(format='%d-%m-%Y')

    class Meta:
        model = Order
        fields = (
            'id',
            'phone',
            'email',
            'telegram',
            'name',
            'report_type',
            'pet_name',
            'mark',
            'kind',
            'photos',
            'description',
            'district',
            'date',
        )

    def get_photos(self, obj):
        return build_photo_url(self, obj.photos[0]) if obj.photos else None


class UserOrderSerializer(serializers.ModelSerializer):
    kind = serializers.CharField(source='kind.name')
    district = serializers.CharField(source='district.name')
    photos = serializers.SerializerMethodField()
    date = serializers.DateField(format='%d-%m-%Y')

    class Meta:
        model = Order
        fields = (
            'id',
            'report_type',
            'pet_name',
            'mark',
            'kind',
            'photos',
            'description',
            'district',
            'date',
        )

    def get_photos(self, obj):
        return build_photo_url(self, obj.photos[0]) if obj.photos else None


class KindSerializer(serializers.ModelSerializer):
    kind = serializers.CharField(source='name')

    class Meta:
        model = Kind
        fields = ('id', 'kind')


class DistrictSerializer(serializers.ModelSerializer):
    district = serializers.CharField(source='name')

    class Meta:
        model = District
        fields = ('id', 'district')


class OrderCreateSerializer(serializers.ModelSerializer):
    name = serializers.RegexField(
        NAME_PATTERN,
        required=False,
        error_messages={
            'invalid': 'Допустимы только кириллица, пробел и дефис.'
        },
    )
    phone = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    telegram = serializers.CharField(required=False, allow_blank=True)
    register = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
    )
    password = serializers.RegexField(
        PASSWORD_PATTERN,
        write_only=True,
        required=False,
        error_messages={
            'invalid': (
                'Пароль должен содержать не менее 7 символов, '
                'одну строчную, одну заглавную букву и одну цифру.'
            )
        },
    )
    password_confirmation = serializers.CharField(
        write_only=True,
        required=False,
    )
    kind = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Kind.objects.all(),
    )
    district = serializers.SlugRelatedField(
        slug_field='name',
        queryset=District.objects.all(),
    )
    confirm = serializers.BooleanField(write_only=True, required=True)
    report_type = serializers.ChoiceField(
        choices=Order.REPORT_TYPE_CHOICES,
        required=True,
    )
    photo1 = serializers.FileField(write_only=True, validators=PHOTO_VALIDATORS)
    photo2 = serializers.FileField(
        write_only=True,
        required=False,
        validators=PHOTO_VALIDATORS,
    )
    photo3 = serializers.FileField(
        write_only=True,
        required=False,
        validators=PHOTO_VALIDATORS,
    )

    class Meta:
        model = Order
        fields = (
            'name',
            'phone',
            'email',
            'telegram',
            'register',
            'password',
            'password_confirmation',
            'report_type',
            'pet_name',
            'mark',
            'confirm',
            'kind',
            'photo1',
            'photo2',
            'photo3',
            'district',
            'description',
        )

    def validate_name(self, value):
        return value.strip()

    def validate_phone(self, value):
        phone = normalize_phone(value)
        if not re.fullmatch(PHONE_PATTERN, phone):
            raise serializers.ValidationError(
                'Введите телефон из 10–15 цифр.'
            )
        return phone

    def validate_email(self, value):
        return value.strip().lower()

    def validate_telegram(self, value):
        return normalize_telegram(value)

    def validate(self, attrs):
        if not attrs['confirm']:
            raise serializers.ValidationError({
                'confirm': 'Необходимо согласие на обработку персональных данных.'
            })

        request = self.context.get('request')
        is_authenticated = request and request.user.is_authenticated
        if not is_authenticated:
            required_fields = ('name', 'phone', 'email')
            errors = {
                field: 'Обязательное поле.'
                for field in required_fields
                if not attrs.get(field)
            }
            if errors:
                raise serializers.ValidationError(errors)

            if attrs.get('register'):
                password = attrs.get('password')
                password_confirmation = attrs.get('password_confirmation')
                if not password:
                    errors['password'] = 'Обязательное поле.'
                if not password_confirmation:
                    errors['password_confirmation'] = 'Обязательное поле.'
                elif password != password_confirmation:
                    errors['password_confirmation'] = 'Пароли не совпадают.'
                if CustomUser.objects.filter(
                    email__iexact=attrs['email']
                ).exists():
                    errors['email'] = (
                        'Пользователь с таким email уже существует.'
                    )
                if errors:
                    raise serializers.ValidationError(errors)

        pet_name = attrs.get('pet_name', '').strip()
        if attrs['report_type'] == 'lost' and not pet_name:
            raise serializers.ValidationError({
                'pet_name': 'Укажите кличку пропавшего животного.'
            })
        attrs['pet_name'] = pet_name if attrs['report_type'] == 'lost' else 'Неизвестно'
        return attrs

    def create(self, validated_data):
        for field in (
            'confirm',
            'photo1',
            'photo2',
            'photo3',
            'register',
            'password',
            'password_confirmation',
        ):
            validated_data.pop(field, None)
        return super().create(validated_data)


class OrderEditSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(
        choices=Order.REPORT_TYPE_CHOICES,
        required=False,
    )
    pet_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
    )
    mark = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
    )
    photo1 = serializers.FileField(
        required=False,
        validators=PHOTO_VALIDATORS,
    )
    photo2 = serializers.FileField(
        required=False,
        validators=PHOTO_VALIDATORS,
    )
    photo3 = serializers.FileField(
        required=False,
        validators=PHOTO_VALIDATORS,
    )
    description = serializers.CharField(required=False)

    def validate(self, attrs):
        if ('photo2' in attrs or 'photo3' in attrs) and 'photo1' not in attrs:
            raise serializers.ValidationError({
                'photo1': 'Первое изображение обязательно.'
            })
        if not attrs:
            raise serializers.ValidationError({
                'form': 'Передайте хотя бы одно поле для изменения.'
            })
        return attrs


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ('email',)
        extra_kwargs = {
            'email': {'validators': []},
        }

    def validate_email(self, value):
        return value.strip().lower()


class AdminOrderSerializer(serializers.ModelSerializer):
    kind = serializers.CharField(source='kind.name')
    district = serializers.CharField(source='district.name')
    photos = serializers.SerializerMethodField()
    date = serializers.DateField(format='%d-%m-%Y')
    created_at = serializers.DateTimeField(format='%d-%m-%Y %H:%M')

    class Meta:
        model = Order
        fields = (
            'id',
            'report_type',
            'pet_name',
            'mark',
            'kind',
            'district',
            'description',
            'photos',
            'status',
            'name',
            'phone',
            'email',
            'telegram',
            'date',
            'created_at',
        )

    def get_photos(self, obj):
        return [build_photo_url(self, path) for path in obj.photos]
