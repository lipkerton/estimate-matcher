from django.db.models import Count
from rest_framework import filters, viewsets

from apps.prices.models import PriceList, SupplierPriceItem
from apps.prices.serializers import PriceListSerializer, SupplierPriceItemSerializer


class PriceListViewSet(viewsets.ModelViewSet):
    serializer_class = PriceListSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("name", "supplier__name")
    ordering_fields = ("id", "uploaded_at")
    ordering = ("-uploaded_at",)

    def get_queryset(self):
        queryset = PriceList.objects.select_related(
            "supplier",
            "import_job",
        ).annotate(
            items_count=Count("items"),
        )

        supplier_id = self.request.query_params.get("supplier")
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)

        return queryset


class SupplierPriceItemViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierPriceItemSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("suppliers_sku", "suppliers_name", "product__sku", "product__name")
    ordering_fields = ("id", "supplier_sku", "supplier_name", "price", "created_at")
    ordering = ("id",)

    def get_queryset(self):
        queryset = SupplierPriceItem.objects.select_related(
            "price_list",
            "product",
        )

        price_list_id = self.request.query_params.get("price_list")
        if price_list_id:
            queryset = queryset.filter(price_list_id=price_list_id)

        return queryset
