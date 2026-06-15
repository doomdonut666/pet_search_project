from django.db import migrations, models


def update_old_statuses(apps, schema_editor):
    Order = apps.get_model('pets', 'Order')
    Order.objects.filter(status='found').update(status='wasFound')
    Order.objects.filter(status='on_moderation').update(status='onModeration')


class Migration(migrations.Migration):
    dependencies = [
        ('pets', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(update_old_statuses, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[
                    ('active', 'Ищет хозяина'),
                    ('wasFound', 'Хозяин найден'),
                    ('onModeration', 'На модерации'),
                    ('archive', 'В архиве'),
                ],
                default='onModeration',
                max_length=30,
                verbose_name='Статус',
            ),
        ),
    ]
