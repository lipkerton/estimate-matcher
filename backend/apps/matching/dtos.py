from dataclasses import dataclass
from decimal import Decimal

from apps.catalog.models import Product


@dataclass(frozen=True)
class LLMRerankCandidate:
    product_id: int
    sku: str
    name: str
    unit: str
    confidence: Decimal
    source: str
    reason: str


@dataclass(frozen=True)
class LLMRerankRequest:
    estimate_item_id: int
    raw_sku: str
    raw_name: str
    unit: str
    candidates: list[LLMRerankCandidate]


@dataclass(frozen=True)
class LLMRerankResult:
    decision: str
    product_id: int | None
    confidence: Decimal
    reason: str


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
