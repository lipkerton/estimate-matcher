from decimal import Decimal

from django.db import transaction

from apps.catalog.models import Product
from apps.estimates.models import EstimateItem
from apps.matching.models import MatchCandidate


class ManualEstimateItemMatchingService:
    def set_product(self, estimate_item: EstimateItem, product: Product) -> EstimateItem:
        with transaction.atomic():
            estimate_item.product = product
            estimate_item.matching_status = EstimateItem.MatchingStatus.MANUAL
            estimate_item.matching_confidence = Decimal("1.0000")
            estimate_item.save(
                update_fields=[
                    "product",
                    "matching_status",
                    "matching_confidence",
                ]
            )

            MatchCandidate.objects.update_or_create(
                estimate_item=estimate_item,
                product=product,
                source=MatchCandidate.Source.MANUAL,
                defaults={
                    "confidence": Decimal("1.0000"),
                    "reason": "Selected manually by user",
                },
            )

        return estimate_item

    def mark_no_match(self, estimate_item: EstimateItem) -> EstimateItem:
        with transaction.atomic():
            estimate_item.product = None
            estimate_item.matching_status = EstimateItem.MatchingStatus.NO_MATCH
            estimate_item.matching_confidence = None
            estimate_item.save(
                update_fields=[
                    "product",
                    "matching_status",
                    "matching_confidence",
                ]
            )

        return estimate_item

    def reset_match(self, estimate_item: EstimateItem) -> EstimateItem:
        with transaction.atomic():
            MatchCandidate.objects.filter(estimate_item=estimate_item).delete()

            estimate_item.product = None
            estimate_item.matching_status = EstimateItem.MatchingStatus.NOT_PROCESSED
            estimate_item.matching_confidence = None
            estimate_item.save(
                update_fields=[
                    "product",
                    "matching_status",
                    "matching_confidence",
                ]
            )

        return estimate_item
