from rest_framework import filters, viewsets

from apps.imports.models import ImportFile, ImportJob
from apps.imports.serializers import ImportFileSerializer, ImportJobSerializer


class ImportFileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ImportFile.objects.all()
    serializer_class = ImportFileSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("original_filename",)
    ordering_fields = ("id", "created_at")
    ordering = ("-created_at",)


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
