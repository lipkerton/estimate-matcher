class MatchingDomainError(Exception):
    """Base exception for matching domain errors."""


class LLMRerankError(MatchingDomainError):
    """Raised when LLM reranking fails."""
