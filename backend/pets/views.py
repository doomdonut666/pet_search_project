from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import District, Kind, Order, Subscription
from .serializers import (
    AdminOrderSerializer,
    DistrictSerializer,
    KindSerializer,
    OrderCreateSerializer,
    OrderEditSerializer,
    PetCardSerializer,
    PetSerializer,
    SearchPetSerializer,
    SliderSerializer,
    SubscriptionSerializer,
    UserOrderSerializer,
)


EDITABLE_STATUSES = ('active', 'onModeration')
ORDER_STATUSES = ('active', 'wasFound', 'onModeration', 'archive')


def save_photos(files):
    paths = []
    for file in files:
        if file:
            paths.append(default_storage.save(f'pets/{file.name}', file))
    return paths


class KindListView(APIView):
    def get(self, request):
        serializer = KindSerializer(Kind.objects.all(), many=True)
        return Response({'data': {'kinds': serializer.data}})


class DistrictListView(APIView):
    def get(self, request):
        serializer = DistrictSerializer(District.objects.all(), many=True)
        return Response({'data': {'districts': serializer.data}})


class SliderView(APIView):
    def get(self, request):
        queryset = Order.objects.filter(status='wasFound').order_by('-created_at')
        if not queryset.exists():
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = SliderSerializer(
            queryset,
            many=True,
            context={'request': request},
        )
        return Response({'data': {'pets': serializer.data}})


class PetListView(APIView):
    def get(self, request):
        queryset = Order.objects.filter(status='active').order_by('-created_at')[:6]
        if not queryset.exists():
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = PetCardSerializer(
            queryset,
            many=True,
            context={'request': request},
        )
        return Response({'data': {'orders': serializer.data}})


class QuickSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            raise ValidationError({'query': ['Поле query обязательно.']})

        queryset = Order.objects.filter(
            status='active',
            description__icontains=query,
        ).order_by('-created_at')
        if not queryset.exists():
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = SearchPetSerializer(
            queryset,
            many=True,
            context={'request': request},
        )
        return Response({'data': {'orders': serializer.data}})


class SearchPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 10


class SearchView(APIView):
    def get(self, request):
        query = request.query_params.get('query', '').strip()
        district = request.query_params.get('district', '').strip()
        kind = request.query_params.get('kind', '').strip()

        if not any((query, district, kind)):
            raise ValidationError({
                'search': [
                    'Введите описание или выберите район или вид животного.'
                ]
            })

        queryset = Order.objects.filter(status='active').order_by('-created_at')
        if district:
            queryset = queryset.filter(district__name=district)
        if kind:
            queryset = queryset.filter(kind__name__icontains=kind)
        if query:
            queryset = queryset.filter(description__icontains=query)
        if not queryset.exists():
            return Response(status=status.HTTP_204_NO_CONTENT)

        paginator = SearchPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = SearchPetSerializer(
            page,
            many=True,
            context={'request': request},
        )
        return Response({
            'data': {
                'orders': serializer.data,
                'pagination': {
                    'count': paginator.page.paginator.count,
                    'page': paginator.page.number,
                    'pages': paginator.page.paginator.num_pages,
                    'next': paginator.get_next_link(),
                    'previous': paginator.get_previous_link(),
                },
            }
        })


class PetDetailEditView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, pk):
        pet = get_object_or_404(Order, pk=pk)
        can_view_private = (
            request.user.is_authenticated
            and (request.user.is_staff or pet.user_id == request.user.id)
        )
        if pet.status not in ('active', 'wasFound') and not can_view_private:
            raise PermissionDenied()
        serializer = PetSerializer(pet, context={'request': request})
        return Response({'data': {'pet': [serializer.data]}})

    @transaction.atomic
    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        if order.user_id != request.user.id:
            raise PermissionDenied()
        if order.status not in EDITABLE_STATUSES:
            raise PermissionDenied()

        serializer = OrderEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        report_type = data.get('report_type', order.report_type)
        if report_type == 'found':
            order.pet_name = 'Неизвестно'
        else:
            pet_name = data.get('pet_name', order.pet_name).strip()
            if not pet_name or pet_name == 'Неизвестно':
                raise ValidationError({
                    'pet_name': ['Укажите кличку пропавшего животного.']
                })
            order.pet_name = pet_name
        order.report_type = report_type
        if 'mark' in data:
            order.mark = data['mark'].strip()
        if 'description' in data:
            order.description = data['description']
        if 'photo1' in data:
            order.photos = save_photos([
                data.get('photo1'),
                data.get('photo2'),
                data.get('photo3'),
            ])

        order.status = 'onModeration'
        order.save()
        return Response({'data': {'status': 'ok'}})


class OrderFoundView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        if not (request.user.is_staff or order.user_id == request.user.id):
            raise PermissionDenied()
        if order.status == 'archive':
            raise PermissionDenied()
        order.status = 'wasFound'
        order.save(update_fields=['status'])
        return Response({'data': {'status': 'ok'}})


class OrderCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = OrderCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        user = request.user if request.user.is_authenticated else None
        if user is None and validated.get('register'):
            User = get_user_model()
            user = User.objects.create_user(
                username=validated['email'],
                email=validated['email'],
                name=validated['name'],
                phone=validated['phone'],
                telegram=validated.get('telegram', ''),
                confirm=True,
                password=validated['password'],
            )

        photos = save_photos([
            validated.get('photo1'),
            validated.get('photo2'),
            validated.get('photo3'),
        ])
        contact_data = {}
        if user is not None:
            contact_data = {
                'name': user.name,
                'phone': user.phone,
                'email': user.email,
                'telegram': user.telegram,
            }

        order = serializer.save(
            user=user,
            photos=photos,
            status='onModeration',
            **contact_data,
        )
        return Response({
            'data': {
                'status': 'ok',
                'id': order.id,
            }
        }, status=status.HTTP_200_OK)


class UserOrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = request.user.orders.all().order_by('-created_at')
        if not queryset.exists():
            return Response(status=status.HTTP_204_NO_CONTENT)

        grouped = []
        for order_status in ORDER_STATUSES:
            serializer = UserOrderSerializer(
                queryset.filter(status=order_status),
                many=True,
                context={'request': request},
            )
            grouped.append({order_status: serializer.data})

        return Response({'data': {'orders': grouped}})


class UserOrderDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        if order.user_id != request.user.id:
            raise PermissionDenied()
        if order.status not in EDITABLE_STATUSES:
            raise PermissionDenied()
        order.delete()
        return Response({'data': {'status': 'ok'}})


class SubscriptionView(APIView):
    def post(self, request):
        serializer = SubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Subscription.objects.get_or_create(
            email=serializer.validated_data['email']
        )
        return Response({'data': {'status': 'ok'}}, status=status.HTTP_200_OK)


class AdminOrderListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        queryset = Order.objects.all().order_by('-created_at')
        selected_status = request.query_params.get('status', '').strip()
        if selected_status:
            if selected_status not in ORDER_STATUSES:
                raise ValidationError({'status': ['Неизвестный статус.']})
            queryset = queryset.filter(status=selected_status)

        serializer = AdminOrderSerializer(
            queryset,
            many=True,
            context={'request': request},
        )
        counts = {
            order_status: Order.objects.filter(status=order_status).count()
            for order_status in ORDER_STATUSES
        }
        return Response({
            'data': {
                'orders': serializer.data,
                'counts': counts,
            }
        })


class AdminOrderManageView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')
        if new_status not in ORDER_STATUSES:
            raise ValidationError({'status': ['Неизвестный статус.']})
        order.status = new_status
        order.save(update_fields=['status'])
        return Response({'data': {'status': 'ok'}})

    def delete(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        order.delete()
        return Response({'data': {'status': 'ok'}})
