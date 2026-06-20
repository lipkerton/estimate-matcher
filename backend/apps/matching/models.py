from django.db import models

from apps.catalog.models import Product
from apps.estimates.models import EstimateItem


class MatchCandidate(models.Model):
    class Source(models.TextChoices):
        EXACT_SKU = "exact_sku", "Exact SKU"
        FUZZY_NAME = "fuzzy_name", "Fuzzy name"
        AI = "ai", "AI"
        MANUAL = "manual", "Manual"
    
    estimate_item = models.ForeignKey(
        EstimateItem,
        on_delete=models.CASCADE,
        related_name="match_candidates",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="match_candidates",
    )
    
    confidence = models.DecimalField(max_digits=5, decimal_places=4)
    source = models.CharField(max_length=32, choices=Source.choices)
    reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-confidence"]
        indexes = [
            models.Index(fields=["estimate_item"]),
            models.Index(fields=["product"]),
            models.Index(fields=["source"]),
            models.Index(fields=["confidence"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["estimate_item", "product", "source"],
                name="unique_match_candidate_per_source",
            )
        ]
    
    def __str__(self) -> str:
        return f"{self.estimate_item_id} -> {self.product_id} ({self.confidence})"