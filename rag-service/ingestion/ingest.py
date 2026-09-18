"""
RAG Knowledge Base Ingestion Script

Loads knowledge_base.json, generates Gemini embeddings for each entry,
and stores documents + embeddings in a persistent ChromaDB collection.

Run from the rag-service directory:
    python -m ingestion.ingest

Requires GOOGLE_API_KEY to be set in rag-service/.env
"""

import json
import os
import sys
from pathlib import Path

import chromadb
from google import genai
from google.genai import types
from dotenv import load_dotenv

# -- Load environment ---------------------------------------------------------
BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY or GOOGLE_API_KEY == "your_google_api_key_here":
    print("ERROR: GOOGLE_API_KEY is not set in rag-service/.env")
    sys.exit(1)

client = genai.Client(api_key=GOOGLE_API_KEY)

# -- Paths --------------------------------------------------------------------
KB_PATH = BASE_DIR / "data" / "knowledge_base.json"
CHROMA_PATH = BASE_DIR / "data" / "chroma_db"
COLLECTION_NAME = "knowledge_base"
EMBEDDING_MODEL = "models/text-embedding-004"


def embed_text(text: str) -> list[float]:
    """Generate a Gemini text embedding for the given text."""
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
    )
    return response.embeddings[0].values


def load_knowledge_base() -> list[dict]:
    """Load and return knowledge base entries from JSON."""
    with open(KB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def ingest():
    """Main ingestion function -- idempotent (deletes and recreates collection)."""
    print(f"Loading knowledge base from: {KB_PATH}")
    documents = load_knowledge_base()
    print(f"  -> {len(documents)} documents loaded")

    # -- ChromaDB setup -------------------------------------------------------
    print(f"\nConnecting to ChromaDB at: {CHROMA_PATH}")
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))

    # Delete existing collection for a clean re-ingest
    try:
        chroma_client.delete_collection(COLLECTION_NAME)
        print(f"  -> Existing '{COLLECTION_NAME}' collection deleted")
    except Exception:
        pass  # Collection didn't exist

    collection = chroma_client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    print(f"  -> Collection '{COLLECTION_NAME}' created")

    # -- Embed and store ------------------------------------------------------
    print("\nGenerating embeddings and ingesting documents...")
    ids = []
    embeddings = []
    metadatas = []
    contents = []

    for i, doc in enumerate(documents):
        print(f"  [{i + 1}/{len(documents)}] Embedding: {doc['title']}")

        embedding = embed_text(doc["content"])

        ids.append(doc["id"])
        embeddings.append(embedding)
        metadatas.append({
            "id": doc["id"],
            "title": doc["title"],
            "category": doc["category"],
        })
        contents.append(doc["content"])

    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=contents,
    )

    print(f"\nIngestion complete -- {len(documents)} documents stored in ChromaDB")
    print(f"   Collection: '{COLLECTION_NAME}'")
    print(f"   Path: {CHROMA_PATH}")


if __name__ == "__main__":
    ingest()
