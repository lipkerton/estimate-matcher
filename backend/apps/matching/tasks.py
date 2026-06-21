from decimal import Decimal
from typing import Any

from celery import shared_task

from apps.matching.services.estimate_matching import EstimateMatchingService


@shared_task
def match_estimate_task(
    estimate_id: int,
    min_confidence: str = "0.6000",
    auto_match_threshold: str =  "0.8500",
    max_candidates: int = 3
) -> dict[str, Any]:
    result = EstimateMatchingService(
        min_confidence=Decimal(min_confidence),
        auto_match_threshold=Decimal(auto_match_threshold),
        max_candidates=max_candidates,
    ).match_estimate(estimate_id)

    return {
        "processed_items": result.processed_items,
        "matched_items": result.matched_items,
        "unmatched_items": result.unmatched_items,
        "created_candidates": result.created_candidates,
    }