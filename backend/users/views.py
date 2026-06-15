from django.contrib.auth import authenticate
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomUser
from .serializers import (
    EmailSerializer,
    LoginSerializer,
    PhoneSerializer,
    RegisterSerializer,
    TelegramSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'data': {
                'status': 'ok',
                'id': user.id,
            }
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login = serializer.validated_data['email']
        account = CustomUser.objects.filter(username__iexact=login).first()
        if account is None:
            account = CustomUser.objects.filter(email__iexact=login).first()

        user = authenticate(
            request,
            email=account.email if account else login,
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response({
                'error': {
                    'code': 401,
                    'message': 'Unauthorized',
                    'errors': {
                        'email': 'Логин или пароль неверно введены',
                    },
                }
            }, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'data': {
                'token': token.key,
            }
        }, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'id': user.id,
            'phone': user.phone,
            'email': user.email,
            'telegram': user.telegram,
            'name': user.name,
            'registrationDate': user.date_joined.strftime('%d-%m-%Y'),
            'ordersCount': user.orders.count(),
            'petsCount': user.orders.filter(status='wasFound').count(),
            'isAdmin': user.is_staff or user.is_superuser,
        }
        return Response({'data': {'user': [data]}})


class UserPhoneView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        if not request.data.get('phone'):
            return Response({
                'error': {
                    'code': 422,
                    'message': 'Validation error',
                    'error': 'The phone should not be empty.',
                }
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        serializer = PhoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.phone = serializer.validated_data['phone']
        request.user.save(update_fields=['phone'])
        return Response({'data': {'status': 'ok'}})


class UserEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        if not request.data.get('email'):
            return Response({
                'error': {
                    'code': 422,
                    'message': 'Validation error',
                    'error': 'The email should not be empty.',
                }
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        serializer = EmailSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        request.user.email = email
        request.user.username = email
        request.user.save(update_fields=['email', 'username'])
        return Response({'data': {'status': 'ok'}})


class UserTelegramView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = TelegramSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.telegram = serializer.validated_data.get('telegram', '')
        request.user.save(update_fields=['telegram'])
        return Response({'data': {'status': 'ok'}})
