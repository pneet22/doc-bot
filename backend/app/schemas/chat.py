from pydantic import BaseModel, Field


class ChatQueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    document_ids: list[int] | None = None
    session_id: int | None = None


class SourceCitation(BaseModel):
    document_id: int
    document_name: str
    page_number: int | None
    chunk_index: int
    similarity: float
    citation: str


class ChatQueryResponse(BaseModel):
    answer: str
    session_id: int
    sources: list[SourceCitation]

