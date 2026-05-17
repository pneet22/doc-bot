import json
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.config import get_settings
from app.db.session import get_db
from app.models import Document, DocumentChunk, User
from app.schemas.document import DocumentDetailOut, DocumentOut
from app.services.audit_service import write_audit_log
from app.services.chunker import split_into_chunks
from app.services.embedding_service import EmbeddingService
from app.services.text_extractor import extract_text, validate_file_extension
from app.services.vector_store import ChromaVectorStore


router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()
embedding_service = EmbeddingService()
vector_store = ChromaVectorStore()


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
) -> DocumentOut:
    file_type = validate_file_extension(file.filename or "")
    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_mb} MB limit.",
        )
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty files are not allowed.")

    safe_name = Path(file.filename or f"document.{file_type}").name
    stored_filename = f"{uuid4().hex}_{safe_name}"
    storage_path = Path(settings.upload_dir) / stored_filename
    storage_path.write_bytes(content)

    try:
        pages = extract_text(str(storage_path), file_type)
        if not any(page.text.strip() for page in pages):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document contains no extractable text.")

        chunks = split_into_chunks(pages)
        if not chunks:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document contains no usable text chunks.")

        document = Document(
            name=safe_name,
            original_filename=safe_name,
            file_type=file_type,
            storage_path=str(storage_path),
            file_size=len(content),
            chunk_count=len(chunks),
            uploaded_by_id=current_user.id,
        )
        db.add(document)
        db.flush()

        embeddings = embedding_service.embed_texts([chunk.content for chunk in chunks])
        db_chunks: list[DocumentChunk] = []
        for chunk, embedding in zip(chunks, embeddings, strict=True):
            db_chunk = DocumentChunk(
                document_id=document.id,
                document_name=document.name,
                page_number=chunk.page_number,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                embedding_json=json.dumps(embedding),
                uploaded_at=document.uploaded_at,
            )
            db.add(db_chunk)
            db_chunks.append(db_chunk)

        db.flush()
        vector_store.add_chunks(db_chunks, embeddings)
        write_audit_log(
            db,
            current_user,
            action="document_uploaded",
            resource_type="document",
            resource_id=document.id,
            metadata={"document_name": document.name, "chunk_count": document.chunk_count},
        )
        db.commit()
        db.refresh(document)
        return document
    except Exception:
        db.rollback()
        if storage_path.exists():
            storage_path.unlink()
        raise


@router.get("", response_model=list[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[DocumentOut]:
    return db.query(Document).order_by(Document.uploaded_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentDetailOut)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> DocumentDetailOut:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
) -> None:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    vector_store.delete_document(document.id)
    storage_path = Path(document.storage_path)
    write_audit_log(
        db,
        current_user,
        action="document_deleted",
        resource_type="document",
        resource_id=document.id,
        metadata={"document_name": document.name},
    )
    db.delete(document)
    db.commit()
    if storage_path.exists():
        storage_path.unlink()

