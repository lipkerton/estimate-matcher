from rest_framework import serializers

from apps.prices.models import PriceList, SupplierPriceItem


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
