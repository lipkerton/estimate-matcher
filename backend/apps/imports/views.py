from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.imports.models import ImportFile, ImportJob
from apps.imports.serializers import (
    ExcelPreviewQuerySerializer,
    ExcelPreviewResponseSerializer,
    ImportFileSerializer,
    ImportFileUploadSerializer,
    ImportJobSerializer,
)
from apps.imports.services.excel_preview import ExcelPreviewError, ExcelPreviewService


class ImportFileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ImportFile.objects.all()
    serializer_class = ImportFileSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("original_filename",)
    ordering_fields = ("id", "created_at")
    ordering = ("-created_at",)

    @extend_schema(
        request=ImportFileUploadSerializer,
        responses={201: ImportFileSerializer},
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="upload",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload(self, request):
        serializer = ImportFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]

        import_file = ImportFile.objects.create(
            original_filename=uploaded_file.name,
            file=uploaded_file,
        )

        response_serializer = ImportFileSerializer(
            import_file,
            context={"request": request},
        )

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        parameters=[ExcelPreviewQuerySerializer],
        responses={
            200: ExcelPreviewResponseSerializer,
            400: OpenApiResponse(description="Cannot read Excel preview."),
        },
    )
    @action(detail=True, methods=["get"], url_path="preview")
    def preview(self, request, pk=None):
        import_file = self.get_object()

        query_serializer = ExcelPreviewQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        sheet_name = query_serializer.validated_data.get("sheet_name") or None
        limit = query_serializer.validated_data.get("limit", 20)

        service = ExcelPreviewService()

        try:
            preview = service.get_preview(
                file_path=import_file.file.path,
                sheet_name=sheet_name,
                limit=limit,
            )
        except ExcelPreviewError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {
            "import_file_id": import_file.id,
            "original_filename": import_file.original_filename,
            "sheet_name": preview.sheet_name,
            "sheet_names": preview.sheet_names,
            "rows": preview.rows,
        }

        response_serializer = ExcelPreviewResponseSerializer(data)
        return Response(response_serializer.data)


class ImportJobViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ImportJob.objects.select_related("import_file")
    serializer_class = ImportJobSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("import_file__original_filename",)
    ordering_fields = ("id", "created_at", "started_at", "finished_at", "progress")
    ordering = ("-created_at",)

    def get_queryset(self):
        queryset = super().get_queryset()

        import_type = self.request.query_params.get("import_type")
        if import_type:
            queryset = queryset.filter(import_type=import_type)

        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        return queryset
