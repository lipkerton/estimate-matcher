from django.db.models import Count
from rest_framework import filters, viewsets

from apps.estimates.models import Estimate, EstimateItem
from apps.estimates.serializers import EstimateItemSerializer, EstimateSerializer


class EstimateViewSet(viewsets.ModelViewSet):
    serializer_class = EstimateSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("name", "project__name")
    ordering_fields = ("id", "name", "created_at", "updated_at")
    ordering = ("-created_at",)

    def get_queryset(self):
        queryset = Estimate.objects.select_related(
            "project",
            "import_job",
        ).annotate(
            items_count=Count("items"),
        )

        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset


class EstimateItemViewSet(viewsets.ModelViewSet):
    serializer_class = EstimateItemSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("raw_sku", "raw_name", "product__sku", "product__name")
    ordering_fields = (
        "id",
        "raw_sku",
        "raw_name",
        "quantity",
        "material_price",
        "installation_price",
        "matching_confidence",
        "created_at",
    )
    ordering = ("id",)

    def get_queryset(self):
        queryset = EstimateItem.objects.select_related(
            "estimate",
            "product",
        )

        estimate_id = self.request.query_params.get("estimate")
        if estimate_id:
            queryset = queryset.filter(estimate_id=estimate_id)
        
        matching_status = self.request.query_params.get("matching_status")
        if matching_status:
            queryset = queryset.filter(matching_status=matching_status)
    
        return queryset