from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('pets', '0003_order_statuses'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='pet_name',
            field=models.CharField(
                default='Неизвестно',
                max_length=100,
                verbose_name='Кличка животного',
            ),
            preserve_default=False,
        ),
    ]
