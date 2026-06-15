from django.contrib import admin

from .models import District, Kind, Order, Subscription


admin.site.register(Kind)
admin.site.register(District)
admin.site.register(Order)
admin.site.register(Subscription)
