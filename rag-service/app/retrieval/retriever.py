"""Persistent ChromaDB collection and simple semantic search."""

from collections.abc import Sequence

import chromadb

from app.config import CHROMA_PATH, COLLECTION_NAME
from app.embeddings.gemini_embeddings import EmbeddingError, GeminiEmbeddings


class RetrievalError(RuntimeError):
    """Raised when ChromaDB cannot serve the requested operation."""


def get_collection(create: bool = False):
    """Open the configured collection, optionally creating it for ingestion."""
    try:
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        if create:
            return client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
        return client.get_collection(name=COLLECTION_NAME)
    except Exception as exc:
        raise RetrievalError("The ChromaDB collection is unavailable") from exc


def upsert_documents(documents: Sequence[dict], embeddings: Sequence[Sequence[float]]) -> int:
    """Insert or update documents using their stable knowledge-base IDs."""
    if len(documents) != len(embeddings):
        raise RetrievalError("Document and embedding counts do not match")

    try:
        collection = get_collection(create=True)
        collection.upsert(
            ids=[document["id"] for document in documents],
            documents=[document["content"] for document in documents],
            metadatas=[
                {
                    "id": document["id"],
                    "title": document["title"],
                    "category": document["category"],
                }
                for document in documents
            ],
            embeddings=[list(vector) for vector in embeddings],
        )
        return collection.count()
    except (RetrievalError, EmbeddingError):
        raise
    except Exception as exc:
        raise RetrievalError("Unable to store documents in ChromaDB") from exc


def search(query: str, top_k: int = 3) -> list[dict]:
    """Return the most semantically relevant knowledge-base records."""
    try:
        collection = get_collection()
        available = collection.count()
        if available == 0:
            return []
        query_vector = GeminiEmbeddings().embed_query(query)
        response = collection.query(
            query_embeddings=[query_vector],
            n_results=min(top_k, available),
            include=["documents", "metadatas"],
        )
    except (RetrievalError, EmbeddingError):
        raise
    except Exception as exc:
        raise RetrievalError("Unable to search the knowledge base") from exc

    return [
        {
            "id": metadata["id"],
            "title": metadata["title"],
            "category": metadata["category"],
            "content": document,
        }
        for document, metadata in zip(response["documents"][0], response["metadatas"][0])
    ]
