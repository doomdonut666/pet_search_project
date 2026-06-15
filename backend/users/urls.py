from django.urls import path

from .views import (
    LoginView,
    RegisterView,
    UserEmailView,
    UserPhoneView,
    UserProfileView,
    UserTelegramView,
)


# Оставлены оба варианта адресов для совместимости с примерами из ТЗ.
urlpatterns = [
    path('register', RegisterView.as_view(), name='register-no-slash'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login-no-slash'),
    path('login/', LoginView.as_view(), name='login'),
    path('users', UserProfileView.as_view(), name='user-profile-no-slash'),
    path('users/', UserProfileView.as_view(), name='user-profile'),
    path('users/phone', UserPhoneView.as_view(), name='user-phone-no-slash'),
    path('users/phone/', UserPhoneView.as_view(), name='user-phone'),
    path('users/email', UserEmailView.as_view(), name='user-email-no-slash'),
    path('users/email/', UserEmailView.as_view(), name='user-email'),
    path('users/telegram', UserTelegramView.as_view(), name='user-telegram-no-slash'),
    path('users/telegram/', UserTelegramView.as_view(), name='user-telegram'),
]
