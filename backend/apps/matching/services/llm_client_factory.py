from django.conf import settings

from apps.matching.services.llm_clients import (
    FakeLLMClient,
    LLMClientProtocol,
    OllamaAsyncLLMClient,
    SyncLLMClientAdapter,
)


def build_default_llm_client() -> LLMClientProtocol:
    if not settings.LLM_ENABLED:
        return FakeLLMClient()

    if settings.LLM_PROVIDER == "ollama":
        async_client = OllamaAsyncLLMClient(
            base_url=settings.LLM_BASE_URL,
            model=settings.LLM_MODEL,
            timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        )
        return SyncLLMClientAdapter(async_client)

    return FakeLLMClient()
