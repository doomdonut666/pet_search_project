from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('pets', '0006_remove_order_mark'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='telegram',
            field=models.CharField(
                blank=True,
                default='',
                max_length=33,
                verbose_name='Telegram',
            ),
        ),
    ]
