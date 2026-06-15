from django.conf import settings
from django.db import models


class Kind(models.Model):
    """Вид животного: кошка или собака."""

    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class District(models.Model):
    """Район Санкт-Петербурга."""

    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    """Объявление о пропавшем или найденном животном."""

    REPORT_TYPE_CHOICES = [
        ('lost', 'Пропало'),
        ('found', 'Найдено'),
    ]
    STATUS_CHOICES = [
        ('active', 'Ищет хозяина'),
        ('wasFound', 'Хозяин найден'),
        ('onModeration', 'На модерации'),
        ('archive', 'В архиве'),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='orders',
    )
    kind = models.ForeignKey(Kind, on_delete=models.PROTECT, verbose_name="Вид животного")
    district = models.ForeignKey(District, on_delete=models.PROTECT, verbose_name="Район")
    name = models.CharField(max_length=150, verbose_name="Имя")
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    email = models.EmailField(verbose_name="Email")
    telegram = models.CharField(max_length=33, blank=True, default='', verbose_name="Telegram")
    report_type = models.CharField(
        max_length=10,
        choices=REPORT_TYPE_CHOICES,
        default='found',
        verbose_name="Тип объявления",
    )
    pet_name = models.CharField(
        max_length=100,
        blank=True,
        default='Неизвестно',
        verbose_name="Кличка животного",
    )
    mark = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name="Особая примета",
    )
    description = models.TextField(verbose_name="Описание")
    date = models.DateField(auto_now_add=True, verbose_name="Дата находки")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="onModeration", verbose_name="Статус")
    photos = models.JSONField(verbose_name="Список путей к фото", default=list)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата")

    def __str__(self):
        return (
            f"{self.get_report_type_display()}: "
            f"{self.kind.name} - {self.district.name} ({self.date})"
        )


class Subscription(models.Model):
    """Адрес электронной почты для новостной рассылки."""

    email = models.EmailField(unique=True, verbose_name="Эмейл")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="дата создания")

    def __str__(self):
        return self.email
    
