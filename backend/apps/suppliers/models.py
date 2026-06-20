from django.db import models


class Supplier(models.Model):
    class Currency(models.TextChoices):
        RUB = "RUB", "Russian ruble"
        USD = "USD", "US dollar"
        EUR = "EUR", "Euro"
        CNY = "CNY", "Chinese yuan"

    name = models.CharField(max_length=255)
    inn = models.CharField(max_length=12, unique=True)
    currency = models.CharField(
        max_length=3, choices=Currency.choices, default=Currency.RUB
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["inn"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.inn})"
