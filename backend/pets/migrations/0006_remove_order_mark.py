from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('pets', '0005_order_report_type_and_optional_pet_name'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='order',
            name='mark',
        ),
    ]
