from decimal import Decimal

from django.db import models

from apps.catalog.models import Product
from apps.imports.models import ImportJob
from apps.suppliers.models import Supplier


class PriceList(models.Model):
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="price_lists",
    )
    import_job = models.OneToOneField(
        ImportJob,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="price_list",
    )

    name = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["supplier"]),
            models.Index(fields=["uploaded_at"]),
        ]

    def __str__(self) -> str:
        if self.name:
            return f"{self.supplier.name} — {self.name}"
        return f"{self.supplier.name} — {self.uploaded_at:%Y-%m-%d}"


class SupplierPriceItem(models.Model):
    price_list = models.ForeignKey(
        PriceList,
        on_delete=models.CASCADE,
        related_name="items",
    )

    supplier_sku = models.CharField(max_length=128, blank=True)
    supplier_name = models.CharField(max_length=512)
    unit = models.CharField(max_length=64, blank=True)

    price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0"),
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supplier_price_items",
    )

    raw_row = models.JSONField(default=dict, blank=True)
    row_number = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["price_list"]),
            models.Index(fields=["supplier_sku"]),
            models.Index(fields=["supplier_name"]),
        ]

    def __str__(self) -> str:
        return self.supplier_name
