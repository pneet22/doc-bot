# TrustVault AI

TrustVault AI is a production-quality MVP for a secure RAG-based document chatbot. Users upload PDF, TXT, and DOCX files, ask questions from selected documents, and receive answers grounded only in retrieved document chunks with source citations.

If no retrieved chunk passes the similarity threshold, the backend returns:

```text
I could not find this in the uploaded documents.
```

## Tech Stack

Backend:
- FastAPI, Python, SQLAlchemy
- SQLite for MVP persistence
- ChromaDB for vector search, with a SQLite embedding fallback for local development
- sentence-transformers embeddings
- PyMuPDF for PDF parsing
- python-docx for DOCX parsing
- Mock extractive LLM provider for offline development

Frontend:
- React + Vite
- Tailwind CSS
- Axios
- React Router
- lucide-react icons

## Folder Structure

```text
backend/
  app/
    api/            FastAPI route modules
    core/           config and security helpers
    db/             SQLAlchemy session and DB initialization
    models/         User, Document, Chunk, Chat, Audit models
    schemas/        Pydantic request/response schemas
    services/       ingestion, embeddings, retrieval, chat, audit
  requirements.txt
frontend/
  src/
    api/            Axios client
    components/     reusable layout and UI components
    context/        local auth context
    pages/          landing, login, dashboard, upload, chat, logs, details
docs/
sample_documents/
```

## Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set SECRET_KEY plus local admin/viewer passwords.
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

Default MVP users are seeded only when `DEFAULT_ADMIN_PASSWORD` and/or `DEFAULT_VIEWER_PASSWORD` are set in the local environment file. Keep those values out of Git.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The web app will be available at `http://localhost:5173`.

## Example Usage Flow

1. Sign in with the local admin account configured in your environment file.
2. Upload files from `sample_documents/` or your own PDF, TXT, and DOCX documents.
3. Open the dashboard to confirm each document was chunked and indexed.
4. Open Chat, select one or more documents, and ask a question grounded in those files.
5. Review the answer and the `Sources Used` citations.
6. Ask a question unrelated to the uploaded content and confirm the fallback answer is returned.
7. Open Audit Logs as admin to review upload, delete, and question events.
8. Sign in as `viewer` and confirm upload/delete/audit actions are restricted.

## RAG Architecture

1. Upload validation checks extension, size, and empty files.
2. Text extraction uses PyMuPDF for PDFs, UTF-8/Latin-1 decoding for TXT, and python-docx for DOCX.
3. Documents are split into overlapping word chunks with metadata:
   - `document_id`
   - `document_name`
   - `page_number`
   - `chunk_index`
   - `uploaded_at`
4. Embeddings are generated with `sentence-transformers/all-MiniLM-L6-v2` by default.
5. Embeddings are stored in ChromaDB and mirrored as JSON in SQLite for a local fallback.
6. Queries retrieve the top 5 chunks from selected documents.
7. Chunks below `SIMILARITY_THRESHOLD` are discarded.
8. The mock LLM provider builds an extractive answer only from retrieved chunks.
9. Every successful grounded answer includes a `Sources Used` section.

## Security Controls

- Admin-only document upload and deletion.
- Viewer accounts can authenticate, view documents, and ask questions only.
- File type validation for `.pdf`, `.txt`, and `.docx`.
- Configurable upload size limit.
- Empty or non-extractable documents are rejected.
- The chat layer never calls general knowledge; no retrieved source means no answer.
- Audit logs record:
  - `document_uploaded`
  - `document_deleted`
  - `question_asked`

## API Documentation

FastAPI provides interactive OpenAPI docs after the backend starts:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

See [docs/api.md](docs/api.md) for endpoint details.

## Database Schema

See [docs/database_schema.md](docs/database_schema.md) for table definitions and relationships.

## Screenshots

Add screenshots here after running the app:

- Landing page
- Login page
- Dashboard with uploaded documents
- Upload page
- Chat answer with citations
- Audit logs
- Document details

## Future Improvements

- Replace local auth with OAuth/OIDC and refresh tokens.
- Add tenant-aware document permissions.
- Add streaming LLM responses with a hosted provider behind the existing abstraction.
- Add reranking, hybrid lexical/vector search, and citation span highlighting.
- Add background ingestion jobs for large documents.
- Add PostgreSQL with pgvector for production deployment.
- Add automated Playwright tests and backend integration tests.
- Add document redaction, malware scanning, and PII classification.
