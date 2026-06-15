from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from pets.models import District, Kind


KINDS = ['Кошка', 'Собака']
DISTRICTS = [
    'Адмиралтейский',
    'Василеостровский',
    'Выборгский',
    'Калининский',
    'Кировский',
    'Колпинский',
    'Красногвардейский',
    'Красносельский',
    'Кронштадтский',
    'Курортный',
    'Московский',
    'Невский',
    'Петроградский',
    'Петродворцовый',
    'Приморский',
    'Пушкинский',
    'Фрунзенский',
    'Центральный',
]


class Command(BaseCommand):
    help = 'Создаёт справочники и администратора для локальной разработки.'

    def handle(self, *args, **options):
        Kind.objects.exclude(name__in=KINDS).delete()
        for name in KINDS:
            Kind.objects.get_or_create(name=name)
        for name in DISTRICTS:
            District.objects.get_or_create(name=name)

        User = get_user_model()
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@getpetback.local',
                'name': 'Администратор',
                'phone': '+70000000000',
                'confirm': True,
            },
        )
        admin.email = 'admin@getpetback.local'
        admin.name = 'Администратор'
        admin.phone = '+70000000000'
        admin.confirm = True
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password('AdminPass123!')
        admin.save()

        self.stdout.write(self.style.SUCCESS(
            'Справочники и администратор созданы.'
        ))
