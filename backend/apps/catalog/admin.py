from django.contrib import admin

from apps.catalog.models import Product, ProductGroup


@admin.register(ProductGroup)
class ProductGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "parent", "created_at")
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "sku", "name", "unit", "group", "created_at")
    search_fields = ("sku", "name", "normalized_name")
    list_filter = ("unit", "group")
