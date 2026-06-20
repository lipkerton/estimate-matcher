from django.db import models


def import_file_upload_to(instance: "ImportFile", filename: str) -> str:
    return f"imports/{instance.created_at:%Y/%m/%d}/{filename}"


class ImportFile(models.Model):
    original_filename = models.CharField(max_length=255)
    file = models.FileField(upload_to=import_file_upload_to)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self) -> str:
        return self.original_filename


class ImportJob(models.Model):
    class ImportType(models.TextChoices):
        PRICE_LIST = "price_list", "Price list"
        ESTIMATE = "estimate", "Estimate"
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    import_type = models.CharField(max_length=32, choices=ImportType.choices)
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.PENDING,
    )

    import_file = models.ForeignKey(
        ImportFile,
        on_delete=models.PROTECT,
        related_name="jobs",
    )

    column_mapping = models.JSONField(default=dict, blank=True)

    total_rows = models.PositiveIntegerField(default=0)
    processed_rows = models.PositiveIntegerField(default=0)
    progress = models.PositiveSmallIntegerField(default=0)

    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["import_type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]
    
    def __str__(self) -> str:
        return f"{self.import_type} - {self.status} - {self.created_at:%Y-%m-%d %H:%M}"