from datetime import datetime

from pydantic import BaseModel


class DocumentChunkOut(BaseModel):
    id: int
    page_number: int | None
    chunk_index: int
    content: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    name: str
    original_filename: str
    file_type: str
    file_size: int
    chunk_count: int
    uploaded_by_id: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetailOut(DocumentOut):
    chunks: list[DocumentChunkOut]

