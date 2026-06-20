from rest_framework import serializers

from apps.estimates.models import Estimate, EstimateItem


class EstimateSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Estimate
        fields = (
            "id",
            "project",
            "project_name",
            "name",
            "import_job",
            "items_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "project_name",
            "items_count",
            "created_at",
            "updated_at",
        )


class EstimateItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        models = EstimateItem
        fields = (
            "id",
            "estimates",
            "raw_sku",
            "raw_name",
            "unit",
            "quantity",
            "material_price",
            "installation_price",
            "product",
            "product_name",
            "product_sku",
            "matching_status",
            "matching_confidence",
            "raw_row",
            "row_number",
            "created_at",
        )
        read_only_fields = (
            "id",
            "product_name",
            "product_sku",
            "created_at",
        )