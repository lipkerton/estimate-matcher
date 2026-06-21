from rest_framework import serializers

from apps.imports.models import ImportFile
from apps.prices.models import PriceList, SupplierPriceItem
from apps.suppliers.models import Supplier


class PriceListColumnMappingSerializer(serializers.Serializer):
    sku = serializers.IntegerField(required=False, min_value=0)
    name = serializers.IntegerField(min_value=0)
    unit = serializers.IntegerField(required=False, min_value=0)
    price = serializers.IntegerField(min_value=0)
    start_row = serializers.IntegerField(required=False, min_value=0, default=1)
    sheet_name = serializers.CharField(required=False, allow_blank=True)


class PriceListImportStartSerializer(serializers.Serializer):
    supplier = serializers.PrimaryKeyRelatedField(queryset=Supplier.objects.all())
    import_file = serializers.PrimaryKeyRelatedField(queryset=ImportFile.objects.all())
    name = serializers.CharField(required=False, allow_blank=True)
    column_mapping = PriceListColumnMappingSerializer()


class PriceListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PriceList
        field = (
            "id",
            "supplier",
            "supplier_name",
            "import_job",
            "name",
            "items_count",
            "uploaded_at",
        )
        read_only_fields = (
            "id",
            "supplier_name",
            "items_count",
            "uploaded_at",
        )


class SupplierPriceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = SupplierPriceItem
        fields = (
            "id",
            "price_list",
            "supplier_sku",
            "supplier_name",
            "unit",
            "price",
            "product",
            "product_name",
            "product_sku",
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
