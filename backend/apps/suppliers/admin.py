from django.contrib import admin

from apps.suppliers import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "inn", "currency", "created_at")
    search_fields = ("name", "inn")
    list_filter = ("currency",)
