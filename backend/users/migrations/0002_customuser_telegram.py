from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='telegram',
            field=models.CharField(
                blank=True,
                default='',
                max_length=33,
                verbose_name='Telegram',
            ),
        ),
    ]
