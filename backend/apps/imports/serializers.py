from rest_framework import serializers

from apps.imports.models import ImportFile, ImportJob


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
