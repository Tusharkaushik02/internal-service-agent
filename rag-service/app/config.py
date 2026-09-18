"""Central, environment-based configuration for the RAG service."""

import os
from pathlib import Path

from dotenv import load_dotenv


SERVICE_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(SERVICE_ROOT / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Keep existing local installations working while they migrate the variable name.
# New deployments should always configure GEMINI_API_KEY.
if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

COLLECTION_NAME = os.getenv("COLLECTION_NAME", "internal_service_kb")
EMBEDDING_MODEL = "models/gemini-embedding-001"
EMBEDDING_REQUEST_TIMEOUT_SECONDS = 15


def chroma_path() -> Path:
    """Return the configured persistent Chroma path, relative to this service."""
    configured_path = Path(os.getenv("CHROMA_PATH", "./chroma_db")).expanduser()
    return configured_path if configured_path.is_absolute() else SERVICE_ROOT / configured_path


CHROMA_PATH = chroma_path()
KNOWLEDGE_BASE_PATH = SERVICE_ROOT / "data" / "knowledge_base.json"
