from rest_framework import filters, viewsets

from apps.catalog.models import Product, ProductGroup
from apps.catalog.serializers import ProductGroupSerializer, ProductSerializer


class ProductGroupViewSet(viewsets.ModelViewSet):
    queryset = ProductGroup.objects.select_related("parent")
    serializer_class = ProductGroupSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("name",)
    ordering_fields = ("id", "name", "created_at")
    ordering = ("name",)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("group")
    serializer_class = ProductSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("sku", "name", "normalized_name")
    ordering_fields = ("id", "sku", "name", "created_at", "updated_at")
    ordering = ("name",)
