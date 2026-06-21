from dataclasses import dataclass
from decimal import Decimal

from apps.catalog.models import Product
from apps.matching.models import MatchCandidate


@dataclass(frozen=True)
class ProductMatch:
    product: Product
    confidence: Decimal
    source: str
    reason: str = ""


@dataclass(frozen=True)
class EstimateMatchingResult:
    processed_item: int
    matched_items: int
    unmatched_items: int
    created_candidates: int
