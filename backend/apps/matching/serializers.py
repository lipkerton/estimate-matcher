from rest_framework import serializers

from apps.matching.models import MatchCandidate


class MatchCandidateSerializer(serializers.ModelSerializer):
    estimate_item_name = serializers.CharField(
        source="estimate_item.raw_name",
        read_only=True,
    )
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )
    product_sku = serializers.CharField(
        source="product.sku",
        read_only=True,
    )

    class Meta:
        model = MatchCandidate
        fields = (
            "id",
            "estimate_item",
            "estimate_item_name",
            "product",
            "product_name",
            "product_sku",
            "confidence",
            "source",
            "reason",
            "created_at",
        )
        read_only_fields = (
            "id",
            "estimate_item_name",
            "product_name",
            "product_sku",
            "created_at",
        )