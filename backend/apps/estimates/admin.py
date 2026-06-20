from django.contrib import admin

from apps.estimates.models import Estimate, EstimateItem


@admin.register(Estimate)
class EstimateAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "project", "created_at")
    search_fields = ("name", "project__name")


@admin.register(EstimateItem)
class EstimateItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "estimate",
        "raw_sku",
        "raw_name",
        "unit",
        "quantity",
        "product",
        "matching_status",
        "matching_confidence",
    )
    search_fields = ("raw_sku", "raw_name")
    list_filter = ("matching_status", "unit")
