"""FastAPI endpoints for the independent RAG retrieval service."""

from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.embeddings.gemini_embeddings import EmbeddingError
from app.retrieval.retriever import RetrievalError, search


app = FastAPI(title="Internal Service RAG", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "rag-service"}


def _error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"success": False, "message": message})


@app.post("/api/rag/search", response_model=None)
def rag_search(payload: dict[str, Any]) -> dict[str, Any] | JSONResponse:
    """Embed a query and return the matching KB records without vectors."""
    query = payload.get("query")
    if not isinstance(query, str) or not query.strip():
        return _error_response(400, "Query is required")

    top_k = payload.get("top_k", 3)
    if isinstance(top_k, bool) or not isinstance(top_k, int) or not 1 <= top_k <= 10:
        return _error_response(400, "top_k must be an integer between 1 and 10")

    normalized_query = query.strip()
    try:
        results = search(normalized_query, top_k=top_k)
    except EmbeddingError:
        return _error_response(503, "GEMINI_API_KEY is not configured or embeddings are unavailable")
    except RetrievalError:
        return _error_response(503, "Knowledge base is unavailable. Run ingestion first.")

    return {"success": True, "query": normalized_query, "results": results}
