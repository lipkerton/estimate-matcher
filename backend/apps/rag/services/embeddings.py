from dataclasses import dataclass
import hashlib
import re

from django.conf import settings


TOKEN_RE = re.compile(r"[a-zA-Zа-яА-Я0-9]+")


@dataclass(slots=True)
class EmbeddingService:
    """
    Для локальных тестов (временно).
    """
    dimensions: str = settings.RAG_EMBEDDING_DIMENSIONS

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)
    
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]
    
    def _embed(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        tokens = TOKEN_RE.findall(text.lower())

        for token in tokens:
            digest = hashlib.md5(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign
        
        norm = math.sqrt(sum(value * value for value in vector))

        if norm == 0:
            return vector
        
        return [value / norm for value in vector]
