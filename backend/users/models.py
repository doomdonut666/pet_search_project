from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True, verbose_name="Электронная почта")
    name = models.CharField(max_length=150, verbose_name="Имя пользователя")
    phone = models.CharField(max_length=20, verbose_name="Номер телефона")
    telegram = models.CharField(max_length=33, blank=True, default='', verbose_name="Telegram")
    confirm = models.BooleanField(default=False, verbose_name="Согласие на обработку персональных данных")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата регистрации")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name', 'phone']

    def __str__(self):
        return self.email
