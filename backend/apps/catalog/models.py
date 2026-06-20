from django.db import models


class ProductGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
        ]
    
    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    sku = models.CharField(max_length=128, unique=True)
    name = models.CharField(max_length=512)
    unit = models.CharField(max_length=64)

    group = models.ForeignKey(
        ProductGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )

    normalized_name = models.CharField(max_length=512, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["sku"]),
            models.Index(fields=["name"]),
            models.Index(fields=["normalized_name"]),
        ]
    
    def __str__(self) -> str:
        return f"{self.sku} - {self.name}"
