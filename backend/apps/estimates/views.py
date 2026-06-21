from django.db import transaction
from django.db.models import Count
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.estimates.models import Estimate, EstimateItem
from apps.estimates.serializers import (
    EstimateImportStartSerializer,
    EstimateItemActionResponseSerializer,
    EstimateItemSerializer,
    EstimateItemSetProductSerializer,
    EstimateLLMRerankStartResponseSerializer,
    EstimateLLMRerankStartSerializer,
    EstimateMatchStartResponseSerializer,
    EstimateMatchStartSerializer,
    EstimateSerializer,
)
from apps.estimates.services.estimate_import import EstimateImportStarter
from apps.estimates.tasks import parse_estimate_task
from apps.imports.exceptions import InvalidColumnMappingError
from apps.matching.services.manual_matching import ManualEstimateItemMatchingService
from apps.matching.tasks import match_estimate_task, rerank_estimate_with_llm_task


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

    @extend_schema(
        request=EstimateImportStartSerializer,
        responses={202: EstimateSerializer},
    )
    @action(detail=False, methods=["post"], url_path="import")
    def import_from_file(self, request):
        serializer = EstimateImportStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            estimate = EstimateImportStarter().create_import(
                project=serializer.validated_data["project"],
                import_file=serializer.validated_data["import_file"],
                name=serializer.validated_data["name"],
                column_mapping=serializer.validated_data["column_mapping"],
            )
        except InvalidColumnMappingError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        transaction.on_commit(lambda: parse_estimate_task.delay(estimate.import_job_id))

        estimate = self.get_queryset().get(id=estimate.id)
        response_serializer = self.get_serializer(estimate)

        return Response(response_serializer.data, status=status.HTTP_202_ACCEPTED)

    @extend_schema(
        request=EstimateLLMRerankStartSerializer,
        responses={202: EstimateLLMRerankStartResponseSerializer},
    )
    @action(detail=True, methods=["post"], url_path="llm-rerank")
    def llm_rerank(self, request, pk=None):
        estimate = self.get_object()

        serializer = EstimateLLMRerankStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = rerank_estimate_with_llm_task.delay(
            estimate.id,
            str(serializer.validated_data["auto_match_threshold"]),
            serializer.validated_data["max_candidates"],
        )

        return Response(
            {
                "task_id": task.id,
                "estimate_id": estimate.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @extend_schema(
        request=EstimateMatchStartSerializer,
        responses={202: EstimateMatchStartResponseSerializer},
    )
    @action(detail=True, methods=["post"], url_path="match")
    def match(self, request, pk=None):
        estimate = self.get_object()

        serializer = EstimateMatchStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = match_estimate_task.delay(
            estimate.id,
            str(serializer.validated_data["min_confidence"]),
            str(serializer.validated_data["auto_match_threshold"]),
            serializer.validated_data["max_candidates"],
        )

        return Response(
            {
                "task_id": task.id,
                "estimate_id": estimate.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )


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

    @extend_schema(
        request=EstimateItemSetProductSerializer,
        responses={200: EstimateItemActionResponseSerializer},
    )
    @action(detail=True, methods=["post"], url_path="set-product")
    def set_product(self, request, pk=None):
        estimate_item = self.get_object()

        serializer = EstimateItemSetProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        estimate_item = ManualEstimateItemMatchingService().set_product(
            estimate_item=estimate_item,
            product=serializer.validated_data["product"],
        )

        return Response(
            self._build_action_response(estimate_item),
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=None,
        responses={200: EstimateItemActionResponseSerializer},
    )
    @action(detail=True, methods=["post"], url_path="mark-no-match")
    def mark_no_match(self, request, pk=None):
        estimate_item = self.get_object()

        estimate_item = ManualEstimateItemMatchingService().mark_no_match(
            estimate_item=estimate_item,
        )

        return Response(
            self._build_action_response(estimate_item),
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=None,
        responses={200: EstimateItemActionResponseSerializer},
    )
    @action(detail=True, methods=["post"], url_path="reset-match")
    def reset_match(self, request, pk=None):
        estimate_item = self.get_object()

        estimate_item = ManualEstimateItemMatchingService().reset_match(
            estimate_item=estimate_item,
        )

        return Response(
            self._build_action_response(estimate_item),
            status=status.HTTP_200_OK,
        )

    def _build_action_response(self, estimate_item):
        product = estimate_item.product

        return {
            "id": estimate_item.id,
            "product": product.id if product else None,
            "product_name": product.name if product else None,
            "product_sku": product.sku if product else None,
            "matching_status": estimate_item.matching_status,
            "matching_confidence": estimate_item.matching_confidence,
        }
