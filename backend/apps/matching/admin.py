from django.contrib import admin

from apps.matching.models import MatchCandidate


@admin.register(MatchCandidate)
class MatchCandidateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "estimate_item",
        "product",
        "confidence",
        "source",
        "created_at",
    )
    search_fields = ("estimate_item__raw_name", "product__name", "product__sku")
    list_filter = ("source",)
