from rest_framework import serializers

from apps.catalog.models import Product
from apps.estimates.models import Estimate, EstimateItem
from apps.imports.models import ImportFile
from apps.projects.models import Project


class EstimateItemSetProductSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())


class EstimateItemActionResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    product = serializers.IntegerField(allow_null=True)
    product_name = serializers.CharField(allow_null=True)
    product_sku = serializers.CharField(allow_null=True)
    matching_status = serializers.CharField()
    matching_confidence = serializers.DecimalField(
        max_digits=5,
        decimal_places=4,
        allow_null=True,
    )


class EstimateMatchStartSerializer(serializers.Serializer):
    min_confidence = serializers.DecimalField(
        max_digits=5,
        decimal_places=4,
        required=False,
        min_value=0,
        max_value=1,
        default="0.6000",
    )
    auto_match_threshold = serializers.DecimalField(
        max_digits=5,
        decimal_places=4,
        required=False,
        min_value=0,
        max_value=1,
        default="0.8500",
    )
    max_candidates = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=10,
        default=3,
    )


class EstimateMatchStartResponseSerializer(serializers.Serializer):
    task_id = serializers.CharField()
    estimate_id = serializers.IntegerField()


class EstimateColumnMappingSerializer(serializers.Serializer):
    sku = serializers.IntegerField(required=False, min_value=0)
    name = serializers.IntegerField(min_value=0)
    unit = serializers.IntegerField(required=False, min_value=0)
    quantity = serializers.IntegerField(min_value=0)
    material_price = serializers.IntegerField(required=False, min_value=0)
    installation_price = serializers.IntegerField(required=False, min_value=0)
    start_row = serializers.IntegerField(required=False, min_value=0, default=1)
    sheet_name = serializers.CharField(required=False, allow_blank=True)


class EstimateImportStartSerializer(serializers.Serializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    import_file = serializers.PrimaryKeyRelatedField(queryset=ImportFile.objects.all())
    name = serializers.CharField(max_length=255)


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
        model = EstimateItem
        fields = (
            "id",
            "estimate",
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
