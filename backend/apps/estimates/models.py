from decimal import Decimal

from django.db import models

from apps.catalog.models import Product
from apps.imports.models import ImportJob
from apps.projects.models import Project


class Estimate(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="estimates"
    )
    name = models.CharField(max_length=255)

    import_job = models.OneToOneField(
        ImportJob,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estimate"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["created_at"]),
        ]
    
    def __str__(self) -> str:
        return f"{self.project.name} - {self.name}"


class EstimateItem(models.Model):
    class MatchingStatus(models.TextChoices):
        NOT_PROCESSED = "not_processed", "Not processed"
        MATCHED = "matched", "Matched"
        UNMATCHED = "unmatched", "Unmatched"
        NO_MATCH = "no_match", "No match"
        MANUAL = "manual", "Manual"
    
    estimate = models.ForeignKey(
        Estimate,
        on_delete=models.CASCADE,
        related_name="items"
    )

    raw_sku = models.CharField(max_length=128, blank=True)
    raw_name = models.CharField(max_length=512)
    unit = models.CharField(max_length=64, blank=True)

    quantity = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    material_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    installation_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estimate_items",
    )

    matching_status = models.CharField(
        max_length=32,
        choices=MatchingStatus.choices,
        default=MatchingStatus.NOT_PROCESSED,
    )
    matching_confidence = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
    )

    raw_row = models.JSONField(default=dict, blank=True)
    row_number = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["estimate"]),
            models.Index(fields=["raw_sku"]),
            models.Index(fields=["raw_name"]),
            models.Index(fields=["matching_status"]),
        ]

    def __str__(self) -> str:
        return self.raw_name