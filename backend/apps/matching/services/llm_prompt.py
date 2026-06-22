import json

from apps.matching.dtos import LLMRerankRequest


def build_rerank_messages(request: LLMRerankRequest) -> list[dict[str, str]]:
    """
    Для локальных тестов.
    """
    system_message = """
You are a product matching assistant for construction estimates.

Your task:
Given one estimate item and a small list of candidate catalog products,
choose the best matching product or return no_match.

Rules:
- Use only the provided candidates.
- Do not invent product IDs.
- Prefer exact technical match: SKU, product type, dimensions, unit.
- If candidates are ambiguous or weak, return no_match.
- Return only valid JSON.
""".strip()

    payload = {
        "estimate_item": {
            "id": request.estimate_item_id,
            "raw_sku": request.raw_sku,
            "raw_name": request.raw_name,
            "unit": request.unit,
        },
        "candidates": [
            {
                "product_id": candidate.product_id,
                "sku": candidate.sku,
                "name": candidate.name,
                "unit": candidate.unit,
                "deterministic_confidence": str(candidate.confidence),
                "source": candidate.source,
                "reason": candidate.reason,
            }
            for candidate in request.candidates
        ],
        "response_schema": {
            "decision": "match | no_match",
            "product_id": "integer or null",
            "confidence": "decimal from 0 to 1",
            "reason": "short explanation",
        },
    }

    user_message = json.dumps(payload, ensure_ascii=False, indent=2)

    return [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message},
    ]