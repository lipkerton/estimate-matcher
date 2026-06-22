from decimal import Decimal

from django.db import transaction

from apps.catalog.models import Product
from apps.estimates.models import Estimate, EstimateItem
from apps.matching.dtos import (
    LLMRerankCandidate,
    LLMRerankRequest,
    LLMRerankResult,
)
from apps.matching.models import MatchCandidate
from apps.matching.services.llm_client_factory import build_default_llm_client
from apps.matching.services.llm_clients import LLMClientProtocol


class LLMRerankerService:
    def __init__(
        self,
        llm_client: LLMClientProtocol | None = None,
        auto_match_threshold: Decimal = Decimal("0.8500"),
        max_candidates: int = 5,
    ) -> None:
        self.llm_client = llm_client or build_default_llm_client()
        self.auto_match_threshold = auto_match_threshold
        self.max_candidates = max_candidates

    def rerank_estimate(self, estimate_id: int) -> dict[str, int]:
        estimate = Estimate.objects.get(id=estimate_id)

        items = list(
            estimate.items.prefetch_related(
                "match_candidates",
                "match_candidates__product",
            )
        )

        processed_items = 0
        matched_items = 0
        no_match_items = 0
        skipped_items = 0
        created_or_updated_candidates = 0

        for item in items:
            result = self.rerank_item(item)

            if result is None:
                skipped_items += 1
                continue

            processed_items += 1

            if result.decision == "match":
                matched_items += 1
            else:
                no_match_items += 1

            created_or_updated_candidates += 1

        return {
            "processed_items": processed_items,
            "matched_items": matched_items,
            "no_match_items": no_match_items,
            "skipped_items": skipped_items,
            "created_or_updated_candidates": created_or_updated_candidates,
        }

    def rerank_item(self, item: EstimateItem) -> LLMRerankResult | None:
        candidates = self._get_candidates(item)

        if not candidates:
            return None

        request = self._build_request(item, candidates)
        result = self.llm_client.rerank_match_candidates(request)

        self._apply_result(item, result)

        return result

    def _get_candidates(self, item: EstimateItem) -> list[MatchCandidate]:
        candidates = list(
            item.match_candidates.select_related("product")
            .exclude(source=MatchCandidate.Source.AI)
            .order_by("-confidence")[: self.max_candidates]
        )

        return candidates

    def _build_request(
        self,
        item: EstimateItem,
        candidates: list[MatchCandidate],
    ) -> LLMRerankRequest:
        llm_candidates = [
            LLMRerankCandidate(
                product_id=candidate.product.id,
                sku=candidate.product.sku,
                name=candidate.product.name,
                unit=candidate.product.unit,
                confidence=candidate.confidence,
                source=candidate.source,
                reason=candidate.reason,
            )
            for candidate in candidates
        ]

        return LLMRerankRequest(
            estimate_item_id=item.id,
            raw_sku=item.raw_sku,
            raw_name=item.raw_name,
            unit=item.unit,
            candidates=llm_candidates,
        )

    def _apply_result(
        self,
        item: EstimateItem,
        result: LLMRerankResult,
    ) -> None:
        with transaction.atomic():
            if result.decision == "match" and result.product_id is not None:
                self._apply_match_result(item, result)
                return

            self._apply_no_match_result(item, result)

    def _apply_match_result(
        self,
        item: EstimateItem,
        result: LLMRerankResult,
    ) -> None:
        product = Product.objects.get(id=result.product_id)

        MatchCandidate.objects.update_or_create(
            estimate_item=item,
            product=product,
            source=MatchCandidate.Source.AI,
            defaults={
                "confidence": result.confidence,
                "reason": result.reason,
            },
        )

        if result.confidence >= self.auto_match_threshold:
            item.product = product
            item.matching_status = EstimateItem.MatchingStatus.MATCHED
            item.matching_confidence = result.confidence
            item.save(
                update_fields=[
                    "product",
                    "matching_status",
                    "matching_confidence",
                ]
            )
        else:
            item.product = None
            item.matching_status = EstimateItem.MatchingStatus.UNMATCHED
            item.matching_confidence = result.confidence
            item.save(
                update_fields=[
                    "product",
                    "matching_status",
                    "matching_confidence",
                ]
            )

    def _apply_no_match_result(
        self,
        item: EstimateItem,
        result: LLMRerankResult,
    ) -> None:
        item.product = None
        item.matching_status = EstimateItem.MatchingStatus.UNMATCHED
        item.matching_confidence = result.confidence
        item.save(
            update_fields=[
                "product",
                "matching_status",
                "matching_confidence",
            ]
        )
