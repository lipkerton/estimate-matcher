from django.contrib import admin

from apps.imports.models import ImportFile, ImportJob


@admin.register(ImportFile)
class ImportFileAdmin(admin.ModelAdmin):
    list_display = ("id", "original_filename", "file", "created_at")
    search_fields = ("original_filename",)


@admin.register(ImportJob)
class ImportJobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "import_type",
        "status",
        "progress",
        "processed_rows",
        "total_rows",
        "created_at",
        "started_at",
        "finished_at",
    )
    search_fields = ("import_file__original_filename",)
    list_filter = ("import_type", "status")
