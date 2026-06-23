import asyncio
import json
import re
from decimal import Decimal, InvalidOperation
from typing import Any, Protocol

import httpx

from apps.matching.dtos import LLMRerankRequest, LLMRerankResult
from apps.matching.exceptions import LLMRerankError
from apps.matching.services.llm_prompt import build_rerank_messages


class LLMClientProtocol(Protocol):
    def rerank_match_candidates(
        self,
        request: LLMRerankRequest,
    ) -> LLMRerankResult:
        raise NotImplementedError


class AsyncLLMClientProtocol(Protocol):
    async def rerank_match_candidates(
        self,
        request: LLMRerankRequest,
    ) -> LLMRerankResult:
        raise NotImplementedError


class SyncLLMClientAdapter:
    """
    Adapter that allows using an async LLM client from sync services/Celery tasks.
    """

    def __init__(self, async_client: AsyncLLMClientProtocol) -> None:
        self.async_client = async_client

    def rerank_match_candidates(
        self,
        request: LLMRerankRequest,
    ) -> LLMRerankResult:
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(
                self.async_client.rerank_match_candidates(request),
            )

        raise LLMRerankError(
            "Cannot use SyncLLMClientAdapter inside a running event loop."
        )


class FakeLLMClient:
    """
    Для докальной разработки без модели.
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
            ),
        )


class OllamaAsyncLLMClient:
    def __init__(
        self,
        base_url: str,
        model: str,
        timeout_seconds: int = 120,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds

    async def rerank_match_candidates(
        self,
        request: LLMRerankRequest,
    ) -> LLMRerankResult:
        messages = build_rerank_messages(request)

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0,
            },
        }

        url = f"{self.base_url}/api/chat"

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise LLMRerankError(f"Ollama HTTP request failed: {exc}") from exc

        try:
            response_data = response.json()
            content = response_data["message"]["content"]
        except (KeyError, TypeError, json.JSONDecodeError) as exc:
            raise LLMRerankError("Invalid Ollama response format.") from exc

        parsed = self._parse_json_content(content)
        result = self._build_result(parsed)
        self._validate_result(result, request)

        return result

    def _parse_json_content(self, content: str) -> dict[str, Any]:
        content = content.strip()

        # DeepSeek-R1 can include reasoning inside <think>...</think>.
        content = re.sub(
            r"<think>.*?</think>",
            "",
            content,
            flags=re.DOTALL,
        ).strip()

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{.*\}", content, flags=re.DOTALL)

        if not match:
            raise LLMRerankError("Ollama response does not contain JSON.")

        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise LLMRerankError("Cannot parse JSON from Ollama response.") from exc

    def _build_result(self, data: dict[str, Any]) -> LLMRerankResult:
        decision = str(data.get("decision", "")).strip()

        if decision not in {"match", "no_match"}:
            raise LLMRerankError("LLM decision must be 'match' or 'no_match'.")

        raw_product_id = data.get("product_id")

        if raw_product_id in {"", "null"}:
            raw_product_id = None

        product_id = int(raw_product_id) if raw_product_id is not None else None

        try:
            confidence = Decimal(str(data.get("confidence", "0"))).quantize(
                Decimal("0.0001"),
            )
        except (InvalidOperation, ValueError) as exc:
            raise LLMRerankError("LLM confidence must be a decimal value.") from exc

        reason = str(data.get("reason", "")).strip()

        return LLMRerankResult(
            decision=decision,
            product_id=product_id,
            confidence=confidence,
            reason=reason,
        )

    def _validate_result(
        self,
        result: LLMRerankResult,
        request: LLMRerankRequest,
    ) -> None:
        if result.confidence < Decimal("0") or result.confidence > Decimal("1"):
            raise LLMRerankError("LLM confidence must be between 0 and 1.")

        allowed_product_ids = {candidate.product_id for candidate in request.candidates}

        if result.decision == "match":
            if result.product_id is None:
                raise LLMRerankError("LLM returned match without product_id.")

            if result.product_id not in allowed_product_ids:
                raise LLMRerankError(
                    "LLM returned product_id that was not in candidates."
                )

        if result.decision == "no_match" and result.product_id is not None:
            raise LLMRerankError("LLM returned no_match with product_id.")
