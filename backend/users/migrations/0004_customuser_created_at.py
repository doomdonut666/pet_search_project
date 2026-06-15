import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_remove_customuser_created_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='created_at',
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
                verbose_name='Дата регистрации',
            ),
            preserve_default=False,
        ),
    ]
