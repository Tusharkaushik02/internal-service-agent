"""Load the JSON knowledge base, embed it, and upsert it into ChromaDB.

Run from the rag-service directory with: ``python -m app.ingestion.ingest``.
"""

import json
import sys
from pathlib import Path

from app.config import KNOWLEDGE_BASE_PATH
from app.embeddings.gemini_embeddings import EmbeddingError, GeminiEmbeddings
from app.retrieval.retriever import RetrievalError, upsert_documents


REQUIRED_FIELDS = ("id", "title", "category", "content")


class IngestionError(RuntimeError):
    """Raised when the local knowledge base cannot be ingested safely."""


def load_knowledge_base(path: Path = KNOWLEDGE_BASE_PATH) -> list[dict]:
    """Read and validate the complete JSON knowledge base before making API calls."""
    try:
        with path.open("r", encoding="utf-8") as file:
            documents = json.load(file)
    except FileNotFoundError as exc:
        raise IngestionError("Knowledge-base JSON file was not found") from exc
    except json.JSONDecodeError as exc:
        raise IngestionError("Knowledge-base JSON is invalid") from exc
    except OSError as exc:
        raise IngestionError("Knowledge-base JSON could not be read") from exc

    if not isinstance(documents, list) or not documents:
        raise IngestionError("Knowledge base must be a non-empty JSON array")

    seen_ids: set[str] = set()
    for index, document in enumerate(documents, start=1):
        if not isinstance(document, dict):
            raise IngestionError(f"Knowledge-base record {index} must be an object")
        missing = [field for field in REQUIRED_FIELDS if not isinstance(document.get(field), str) or not document[field].strip()]
        if missing:
            raise IngestionError(f"Knowledge-base record {index} is missing required fields: {', '.join(missing)}")
        if document["id"] in seen_ids:
            raise IngestionError(f"Knowledge-base record {index} has a duplicate id")
        seen_ids.add(document["id"])

    return documents


def ingest() -> int:
    """Embed all records and safely upsert them by their stable IDs."""
    documents = load_knowledge_base()
    print(f"Loaded {len(documents)} documents")

    embeddings = GeminiEmbeddings().embed_documents([document["content"] for document in documents])
    print("Generated embeddings")

    upsert_documents(documents, embeddings)
    print(f"Stored {len(documents)} documents in ChromaDB")
    print("Ingestion completed")
    return len(documents)


def main() -> int:
    try:
        ingest()
        return 0
    except (IngestionError, EmbeddingError, RetrievalError) as exc:
        print(f"Ingestion failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
