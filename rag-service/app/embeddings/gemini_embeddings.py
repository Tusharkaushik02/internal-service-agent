"""Small Gemini embedding adapter, isolated from ingestion and retrieval."""

from collections.abc import Sequence

import google.generativeai as genai

from app.config import EMBEDDING_MODEL, EMBEDDING_REQUEST_TIMEOUT_SECONDS, GEMINI_API_KEY


class EmbeddingError(RuntimeError):
    """Raised when a Gemini embedding cannot be created."""


class GeminiEmbeddings:
    """Generate document and query vectors with the Gemini embeddings API."""

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or GEMINI_API_KEY
        if not self.api_key:
            raise EmbeddingError("GEMINI_API_KEY is not configured")
        genai.configure(api_key=self.api_key)

    def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        """Return one document embedding for every non-empty input text."""
        if not texts or any(not isinstance(text, str) or not text.strip() for text in texts):
            raise EmbeddingError("Texts to embed must be a non-empty list of strings")
        return [self._embed(text, task_type="retrieval_document") for text in texts]

    def embed_query(self, text: str) -> list[float]:
        """Return an embedding optimized for a retrieval query."""
        return self._embed(text, task_type="retrieval_query")

    def _embed(self, text: str, task_type: str) -> list[float]:
        if not isinstance(text, str) or not text.strip():
            raise EmbeddingError("Text to embed must not be empty")

        try:
            response = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=text,
                task_type=task_type,
                request_options={"timeout": EMBEDDING_REQUEST_TIMEOUT_SECONDS},
            )
            vector = response["embedding"]
        except Exception as exc:
            raise EmbeddingError("Gemini embedding request failed") from exc

        if not isinstance(vector, list) or not vector:
            raise EmbeddingError("Gemini returned an invalid embedding")
        return vector


def embed_texts(texts: Sequence[str]) -> list[list[float]]:
    """Convenience function for callers that only need document embeddings."""
    return GeminiEmbeddings().embed_documents(texts)
