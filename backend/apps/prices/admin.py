from django.contrib import admin

from apps.prices.models import PriceList, SupplierPriceItem


@admin.register(PriceList)
class PriceListAdmin(admin.ModelAdmin):
    list_display = ("id", "supplier", "name", "uploaded_at", "import_job")
    search_fields = ("name", "supplier__name")
    list_filter = ("supplier",)


@admin.register(SupplierPriceItem)
class SupplierPriceItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "price_list",
        "supplier_sku",
        "supplier_name",
        "unit",
        "price",
        "product",
    )
    search_fields = ("supplier_sku", "supplier_name", "product__name", "product__sku")
    list_filter = ("unit",)
