from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse
from app.services.chat_service import ChatService
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import build_llm_provider
from app.services.retrieval_service import RetrievalService
from app.services.vector_store import ChromaVectorStore


router = APIRouter(prefix="/chat", tags=["chat"])
embedding_service = EmbeddingService()
vector_store = ChromaVectorStore()
retrieval_service = RetrievalService(embedding_service, vector_store)
chat_service = ChatService(retrieval_service, build_llm_provider())


@router.post("/query", response_model=ChatQueryResponse)
def query_documents(
    payload: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatQueryResponse:
    answer, session_id, sources = chat_service.answer_question(
        db=db,
        user=current_user,
        question=payload.question,
        document_ids=payload.document_ids,
        session_id=payload.session_id,
    )
    return ChatQueryResponse(answer=answer, session_id=session_id, sources=sources)

