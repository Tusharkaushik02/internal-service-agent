# RAG Service

This standalone FastAPI service retrieves internal knowledge-base documents from a local, persistent ChromaDB collection. It does not access the Node.js backend or MongoDB.

## Configure

Create `rag-service/.env` locally (it is ignored by Git):

```env
GEMINI_API_KEY="your-key"
CHROMA_PATH="./chroma_db"
COLLECTION_NAME="internal_service_kb"
```

`GEMINI_API_KEY` is never logged. For a smooth upgrade of the previous local setup, `GOOGLE_API_KEY` is temporarily accepted when `GEMINI_API_KEY` is absent; new setups should use `GEMINI_API_KEY`.

## Run

From `rag-service/`:

```bash
pip install -r requirements.txt
python -m app.ingestion.ingest
uvicorn app.main:app --reload --port 8000
```

Ingestion validates `data/knowledge_base.json`, requests Gemini document embeddings, and upserts records by their JSON IDs. Running it again updates the same records instead of duplicating them.

## API

```bash
curl http://localhost:8000/health
```

```bash
curl -X POST http://localhost:8000/api/rag/search -H "Content-Type: application/json" -d '{"query":"How do I request VPN access?","top_k":3}'
```

The search response contains only `id`, `title`, `category`, and `content`; embeddings never leave the service.
