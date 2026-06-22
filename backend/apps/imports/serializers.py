from pathlib import Path
from rest_framework import serializers

from apps.imports.models import ImportFile, ImportJob




class ImportFileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, file):
        extension = Path(file.name).suffix.lower()
        allowed_extensions = {".xlsx", ".xlsm", ".xls"}

        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                "Only .xlsx, .xlsm and .xls files are supported."
            )

        max_size_mb = 20
        max_size_bytes = max_size_mb * 1024 * 1024

        if file.size > max_size_bytes:
            raise serializers.ValidationError(
                f"File is too large. Maximum size is {max_size_mb} MB."
            )

        return file


class ExcelPreviewQuerySerializer(serializers.Serializer):
    sheet_name = serializers.CharField(required=False, allow_blank=True)
    limit = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=100,
        default=20,
    )


class ExcelPreviewResponseSerializer(serializers.Serializer):
    import_file_id = serializers.IntegerField()
    original_filename = serializers.CharField()
    sheet_name = serializers.CharField()
    sheet_names = serializers.ListField(child=serializers.CharField())
    rows = serializers.ListField(
        child=serializers.ListField(
            child=serializers.JSONField(),
        )
    )


class ImportFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportFile
        fields = (
            "id",
            "original_filename",
            "file",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class ImportJobSerializer(serializers.ModelSerializer):
    original_filename = serializers.CharField(
        source="import_file.original_filename",
        read_only=True,
    )

    class Meta:
        model = ImportJob
        fields = (
            "id",
            "import_type",
            "status",
            "import_file",
            "original_filename",
            "column_mapping",
            "total_rows",
            "processed_rows",
            "progress",
            "error_message",
            "created_at",
            "started_at",
            "finished_at",
        )
        read_only_fields = (
            "id",
            "original_filename",
            "created_at",
            "started_at",
            "finished_at",
        )
