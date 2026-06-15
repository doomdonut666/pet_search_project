from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('pets', '0004_order_pet_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='report_type',
            field=models.CharField(
                choices=[('lost', 'Пропало'), ('found', 'Найдено')],
                default='found',
                max_length=10,
                verbose_name='Тип объявления',
            ),
        ),
        migrations.AlterField(
            model_name='order',
            name='pet_name',
            field=models.CharField(
                blank=True,
                default='Неизвестно',
                max_length=100,
                verbose_name='Кличка животного',
            ),
        ),
    ]
