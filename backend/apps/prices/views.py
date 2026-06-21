from django.db import transaction
from django.db.models import Count
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.imports.exceptions import InvalidColumnMappingError
from apps.prices.models import PriceList, SupplierPriceItem
from apps.prices.serializers import (
    PriceListImportStartSerializer,
    PriceListSerializer,
    SupplierPriceItemSerializer,
)
from apps.prices.services.price_list_import import PriceListImportStarter
from apps.prices.tasks import parse_price_list_task


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
    
    @extend_schema(
        request=PriceListImportStartSerializer,
        responses={202: PriceListSerializer},
    )
    @action(detail=False, methods=["post"], url_path="import")
    def import_from_file(self, request):
        serializer = PriceListImportStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            price_list = PriceListImportStarter().create_import(
                supplier=serializer.validated_data["supplier"],
                import_file=serializer.validated_data["import_file"],
                name=serializer.validated_data.get("name", ""),
                column_mapping=serializer.validated_data["column_mapping"],
            )
        except InvalidColumnMappingError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        transaction.on_commit(
            lambda: parse_price_list_task.delay(price_list.import_job_id)
        )

        price_list = self.get_queryset().get(id=price_list.id)
        response_serializer = self.get_serializer(price_list)

        return Response(response_serializer.data, status=status.HTTP_202_ACCEPTED)


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
