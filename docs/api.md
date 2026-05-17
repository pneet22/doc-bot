# TrustVault AI API

Base URL: `http://localhost:8000`

Authentication uses a bearer token returned by `POST /auth/login`.

## POST /auth/login

Request:

```json
{
  "username": "admin",
  "password": "your-local-admin-password"
}
```

Response:

```json
{
  "access_token": "token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

## POST /documents/upload

Role: `admin`

Uploads and indexes one PDF, TXT, or DOCX file.

Form data:

```text
file=<document>
```

Response:

```json
{
  "id": 1,
  "name": "security_policy.txt",
  "original_filename": "security_policy.txt",
  "file_type": "txt",
  "file_size": 1204,
  "chunk_count": 3,
  "uploaded_by_id": 1,
  "uploaded_at": "2026-05-16T12:00:00Z"
}
```

## GET /documents

Role: `admin` or `viewer`

Returns uploaded document metadata.

## GET /documents/{document_id}

Role: `admin` or `viewer`

Returns document metadata plus chunk text and metadata.

## DELETE /documents/{document_id}

Role: `admin`

Deletes the document, its relational chunks, its vector entries, and its stored file.

## POST /chat/query

Role: `admin` or `viewer`

Request:

```json
{
  "question": "What controls are required for privileged access?",
  "document_ids": [1, 2],
  "session_id": null
}
```

Response:

```json
{
  "answer": "Access reviews are required quarterly...\n\nSources Used\n- [security_policy.txt, Page N/A, Chunk 2]",
  "session_id": 1,
  "sources": [
    {
      "document_id": 1,
      "document_name": "security_policy.txt",
      "page_number": null,
      "chunk_index": 2,
      "similarity": 0.72,
      "citation": "[security_policy.txt, Page N/A, Chunk 2]"
    }
  ]
}
```

If retrieval is weak or empty:

```json
{
  "answer": "I could not find this in the uploaded documents.",
  "session_id": 1,
  "sources": []
}
```

## GET /audit-logs

Role: `admin`

Returns the 200 most recent audit events.

## GET /health

Response:

```json
{
  "status": "ok",
  "service": "TrustVault AI"
}
```
