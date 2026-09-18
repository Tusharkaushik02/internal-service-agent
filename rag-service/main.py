"""
RAG Service — FastAPI Application

Endpoints:
  GET  /health          — Health check
  POST /api/rag/search  — Semantic search over knowledge base
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load .env from rag-service directory
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(
    title="RAG Service",
    description="Semantic search over the internal knowledge base using Gemini + ChromaDB",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ─────────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search query")
    n_results: int = Field(default=3, ge=1, le=10, description="Number of results to return")


class KBResult(BaseModel):
    id: str
    title: str
    category: str
    content: str
    distance: float


class SearchResponse(BaseModel):
    success: bool
    results: list[KBResult]


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "rag-service"}


# ── RAG Search Endpoint ───────────────────────────────────────────────────────
@app.post("/api/rag/search", response_model=SearchResponse)
def rag_search(body: SearchRequest):
    """
    Perform semantic search over the knowledge base.
    Returns top N most relevant KB articles for the given query.
    """
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key or google_api_key == "your_google_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="RAG service is not configured: GOOGLE_API_KEY is missing in rag-service/.env",
        )

    chroma_db_path = BASE_DIR / "data" / "chroma_db"
    if not chroma_db_path.exists():
        raise HTTPException(
            status_code=503,
            detail="ChromaDB has not been initialized. Run: python -m ingestion.ingest",
        )

    try:
        from retrieval.retriever import search
        results = search(query=body.query, n_results=body.n_results)
        return SearchResponse(success=True, results=results)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}",
        )
