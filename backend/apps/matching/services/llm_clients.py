from decimal import Decimal
from typing import Protocol

from apps.matching.dtos import LLMRerankRequest, LLMRerankResult


class LLMClientProtocol(Protocol):
    def rerank_match_candidates(
        self,
        request: LLMRerankRequest,
    ) -> LLMRerankResult:
        raise NotImplementedError


class FakeLLMClient:
    """
    Для докальной разработки.
    """
    MIN_ACCEPTABLE_CONFIDENCE = Decimal("0.7000")

    def rerank_match_candidates(
        self,
        request: LLMRerankRequest,
    ) -> LLMRerankResult:
        if not request.candidates:
            return LLMRerankResult(
                decision="no_match",
                product_id=None,
                confidence=Decimal("0.0000"),
                reason="No candidates were provided.",
            )
        
        best_candidate = max(
            request.candidates,
            key=lambda candidate: candidate.confidence,
        )

        if best_candidate.confidence < self.MIN_ACCEPTABLE_CONFIDENCE:
            return LLMRerankResult(
                decision="no_match",
                product_id=None,
                confidence=best_candidate.confidence,
                reason=(
                    "Best candidate confidence is below fake LLM acceptance threshold."
                ),
            )
        
        adjusted_confidence = min(
            best_candidate.confidence + Decimal("0.0500"),
            Decimal("1.0000"),
        )

        return LLMRerankResult(
            decision="match",
            product_id=best_candidate.product_id,
            confidence=adjusted_confidence,
            reason=(
                "Fake LLM selected the best deterministic candidate."
                f"Original source: {best_candidate.source}. "
                f"Original reason: {best_candidate.reason}"
            )
        )