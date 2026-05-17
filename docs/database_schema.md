# Database Schema

SQLite is used for the MVP. The SQLAlchemy models can be moved to PostgreSQL with minimal changes.

## users

| Column | Type | Notes |
| --- | --- | --- |
| id | integer | Primary key |
| username | string | Unique login name |
| password_hash | string | bcrypt hash |
| role | string | `admin` or `viewer` |
| created_at | datetime | UTC creation time |

## documents

| Column | Type | Notes |
| --- | --- | --- |
| id | integer | Primary key |
| name | string | Display name |
| original_filename | string | Original upload filename |
| file_type | string | `pdf`, `txt`, or `docx` |
| storage_path | string | Local stored file path |
| file_size | integer | Bytes |
| chunk_count | integer | Number of generated chunks |
| uploaded_by_id | integer | FK to `users.id` |
| uploaded_at | datetime | UTC upload time |

## document_chunks

| Column | Type | Notes |
| --- | --- | --- |
| id | integer | Primary key |
| document_id | integer | FK to `documents.id` |
| document_name | string | Denormalized for citations |
| page_number | integer/null | PDF page number when available |
| chunk_index | integer | Stable chunk order inside a document |
| content | text | Chunk text |
| embedding_json | text/null | JSON embedding fallback |
| uploaded_at | datetime | Copied from document upload |
| created_at | datetime | UTC creation time |

## chat_sessions

| Column | Type | Notes |
| --- | --- | --- |
| id | integer | Primary key |
| user_id | integer | FK to `users.id` |
| title | string | First question preview |
| created_at | datetime | UTC creation time |

## chat_messages

| Column | Type | Notes |
| --- | --- | --- |
| id | integer | Primary key |
| session_id | integer | FK to `chat_sessions.id` |
| user_id | integer | FK to `users.id` |
| question | text | User question |
| answer | text | Grounded answer or not-found message |
| sources_json | text | Serialized citation metadata |
| created_at | datetime | UTC creation time |

## audit_logs

| Column | Type | Notes |
| --- | --- | --- |
| id | integer | Primary key |
| user_id | integer/null | Acting user if available |
| username | string | Denormalized username |
| action | string | `document_uploaded`, `document_deleted`, `question_asked` |
| resource_type | string | `document` or `chat` |
| resource_id | string/null | Related resource ID |
| metadata_json | text | Serialized event metadata |
| created_at | datetime | UTC event time |

## Vector Store

ChromaDB stores vectors in `backend/storage/chroma`. Each vector id uses the format:

```text
chunk-{document_chunks.id}
```

Vector metadata includes:

```json
{
  "document_id": "1",
  "document_name": "security_policy.txt",
  "page_number": 1,
  "chunk_index": 0,
  "uploaded_at": "2026-05-16T12:00:00Z"
}
```

