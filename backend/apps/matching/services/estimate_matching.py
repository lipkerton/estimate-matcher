from decimal import Decimal
from typing import Iterable

from django.db import transaction
from rapidfuzz import fuzz

from apps.catalog.models import Product
from apps.estimates.models import Estimate, EstimateItem
from apps.matching.dtos import EstimateMatchingResult, ProductMatch
from apps.matching.models import MatchCandidate
from apps.matching.services.text_normalization import normalize_sku, normalize_text


class EstimateMatchingService:
    def __init__(
        self,
        min_confidence: Decimal = Decimal("0.6000"),
        auto_match_threshold: Decimal = Decimal("0.500"),
        max_candidates: int = 3,
    ) -> None:
        self.min_confidence = min_confidence
        self.auto_match_threshold = auto_match_threshold
        self.max_candidates = max_candidates
    
    def match_estimate(self, estimate_id: int) -> EstimateMatchingResult:
        estimate = Estimate.objects.get(id=estimate_id)

        items = list(
            estimate.items.select_related("product").all()
        )
        products = list(
            Product.objects.select_related("group").all()
        )

        sku_index = self._build_sku_index(products)

        processed_items = 0
        matched_items = 0
        unmatched_items = 0
        created_candidates = 0

        with transaction.atomic():
            MatchCandidate.objects.filter(
                estimate_item__estimate=estimate,
            ).delete()

            for item in items:
                processed_items += 1

                matches = self._match_item(
                    item=item,
                    products=products,
                    sku_index=sku_index,
                )

                created_candidates += self._save_candidates(item, matches)

                best_match = matches[0] if matches else None

                if best_match and best_match.confidence >= self.auto_match_threshold:
                    item.product = best_match.product
                    item.matching_status = EstimateItem.MatchingStatus.MATCHED
                    item.matching_confidence = best_match.confidence
                    matched_items += 1
                else:
                    item.product = None
                    item.matching_status = EstimateItem.MatchingStatus.UNMATCHED
                    item.matching_confidence = (
                        best_match.confidence if best_match else None
                    )
                    unmatched_items += 1
                
                item.save(
                    update_fields=[
                        "product",
                        "matching_status",
                        "matching_confidence",
                    ]
                )
        
        return EstimateMatchingResult(
            processed_item=processed_items,
            matched_items=matched_items,
            unmatched_items=unmatched_items,
            created_candidates=created_candidates,
        )
    
    def _match_item(
        self,
        item: EstimateItem,
        products: list[Product],
        sku_index: dict[str, Product],
    ) -> list[ProductMatch]:
        matches: list[ProductMatch] = list()

        exact_match = self._match_by_sku(item, sku_index)

        if exact_match:
            matches.append(exact_match)
        
        fuzzy_matches = self._match_by_name(item, products)
        matches.extend(fuzzy_matches)

        return self._deduplicate_and_sort(matches)
    
    def _match_by_sku(
        self,
        item: EstimateItem,
        sku_index: dict[str, Product],
    ) -> ProductMatch | None:
        if not item.raw_sku:
            return None
        
        normalized_raw_sku = normalize_sku(item.raw_sku)
        product = sku_index.get(normalized_raw_sku)

        if not product:
            return None
        
        return ProductMatch(
            product=product,
            confidence=Decimal("1.0000"),
            source=MatchCandidate.Source.EXACT_SKU,
            reason="Exact SKU match",
        )
    
    def _match_by_name(
        self,
        item: EstimateItem,
        products: Iterable[Product],
    ) -> list[ProductMatch]:
        normalized_item_name = normalize_text(item.raw_name)

        if not normalized_item_name:
            return []
        
        matches: list[ProductMatch] = list()

        for product in products:
            product_name = product.normalized_name or product.name
            normalized_product_name = normalize_text(product_name)

            if not normalized_product_name:
                continue
            
            score = fuzz.token_set_ratio(
                normalized_item_name,
                normalized_product_name,
            )

            confidence = Decimal(str(score / 100)).quantize(Decimal("0.0001"))

            if confidence < self.min_confidence:
                continue

            matches.append(
                ProductMatch(
                    product=product,
                    confidence=confidence,
                    source=MatchCandidate.Source.FUZZY_NAME,
                    reason=f"Fuzzy name match: {score}",
                )
            )
        
        matches.sort(key=lambda match: match.confidence, reverse=True)

        return matches[: self.max_candidates]

    def _build_sku_index(self, products: Iterable[Product]) -> dict[str, Product]:
        result: dict[str, Product] = {}

        for product in products:
            if product.sku:
                result[normalize_sku(product.sku)] = product

        return result

    def _deduplicate_and_sort(
        self,
        matches: list[ProductMatch],
    ) -> list[ProductMatch]:
        best_by_product_id: dict[int, ProductMatch] = {}

        for match in matches:
            existing = best_by_product_id.get(match.product.id)

            if existing is None or match.confidence > existing.confidence:
                best_by_product_id[match.product.id] = match

        result = list(best_by_product_id.values())
        result.sort(key=lambda match: match.confidence, reverse=True)

        return result[: self.max_candidates]

    def _save_candidates(
        self,
        item: EstimateItem,
        matches: list[ProductMatch],
    ) -> int:
        candidates = [
            MatchCandidate(
                estimate_item=item,
                product=match.product,
                confidence=match.confidence,
                source=match.source,
                reason=match.reason,
            )
            for match in matches
        ]

        MatchCandidate.objects.bulk_create(candidates)

        return len(candidates)