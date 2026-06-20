from rest_framework import serializers

from apps.catalog.models import Product, ProductGroup


class ProductGroupSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.name", read_only=True)

    class Meta:
        model = ProductGroup
        fields = (
            "id",
            "name",
            "parent",
            "parent_name",
            "created_at",
        )
        read_only_fields = ("id", "created_at", "parent_name")


class ProductSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "sku",
            "name",
            "unit",
            "group",
            "group_name",
            "normalized_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "group_name")
