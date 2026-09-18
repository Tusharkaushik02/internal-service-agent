"""
RAG Retrieval Module

Provides semantic search over the ChromaDB knowledge base using Gemini embeddings.
"""

import os
from pathlib import Path

import chromadb
from google import genai
from google.genai import types
from dotenv import load_dotenv

# -- Load environment ---------------------------------------------------------
BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

CHROMA_PATH = BASE_DIR / "data" / "chroma_db"
COLLECTION_NAME = "knowledge_base"
EMBEDDING_MODEL = "models/text-embedding-004"

# -- Lazy-loaded clients ------------------------------------------------------
_genai_client = None
_chroma_collection = None


def _get_genai_client():
    global _genai_client
    if _genai_client is None:
        _genai_client = genai.Client(api_key=GOOGLE_API_KEY)
    return _genai_client


def _get_collection():
    """Lazily initialize ChromaDB client and collection."""
    global _chroma_collection
    if _chroma_collection is None:
        chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        _chroma_collection = chroma_client.get_collection(COLLECTION_NAME)
    return _chroma_collection


def embed_query(text: str) -> list[float]:
    """Generate a Gemini embedding for a search query."""
    client = _get_genai_client()
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return response.embeddings[0].values


def search(query: str, n_results: int = 3) -> list[dict]:
    """
    Perform semantic search over the knowledge base.

    Args:
        query: Natural language search query
        n_results: Number of top results to return (default 3)

    Returns:
        List of dicts with id, title, category, content, distance
    """
    collection = _get_collection()
    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    output = []
    for i in range(len(results["ids"][0])):
        meta = results["metadatas"][0][i]
        output.append({
            "id": meta.get("id"),
            "title": meta.get("title"),
            "category": meta.get("category"),
            "content": results["documents"][0][i],
            "distance": round(results["distances"][0][i], 4),
        })

    return output
