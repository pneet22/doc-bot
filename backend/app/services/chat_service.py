import json

from sqlalchemy.orm import Session

from app.models import ChatMessage, ChatSession, User
from app.schemas.chat import SourceCitation
from app.services.audit_service import write_audit_log
from app.services.llm_service import NOT_FOUND_MESSAGE, LLMProvider
from app.services.retrieval_service import RetrievalService, RetrievedChunk


class ChatService:
    def __init__(self, retrieval_service: RetrievalService, llm_provider: LLMProvider) -> None:
        self.retrieval_service = retrieval_service
        self.llm_provider = llm_provider

    def answer_question(
        self,
        db: Session,
        user: User,
        question: str,
        document_ids: list[int] | None,
        session_id: int | None,
    ) -> tuple[str, int, list[SourceCitation]]:
        session = self._get_or_create_session(db, user, question, session_id)
        retrieved = self.retrieval_service.retrieve(db, question, document_ids)
        if not retrieved:
            answer = NOT_FOUND_MESSAGE
            sources: list[SourceCitation] = []
        else:
            grounded_answer = self.llm_provider.generate_answer(question, retrieved)
            sources = [source_from_hit(hit) for hit in retrieved]
            answer = format_answer_with_sources(grounded_answer, sources)

        message = ChatMessage(
            session_id=session.id,
            user_id=user.id,
            question=question,
            answer=answer,
            sources_json=json.dumps([source.model_dump() for source in sources]),
        )
        db.add(message)
        write_audit_log(
            db,
            user,
            action="question_asked",
            resource_type="chat",
            resource_id=session.id,
            metadata={"question": question, "document_ids": document_ids or [], "sources": len(sources)},
        )
        db.commit()
        db.refresh(session)
        return answer, session.id, sources

    @staticmethod
    def _get_or_create_session(
        db: Session,
        user: User,
        question: str,
        session_id: int | None,
    ) -> ChatSession:
        if session_id:
            session = db.get(ChatSession, session_id)
            if session and session.user_id == user.id:
                return session

        title = question[:80] if question else "Document Q&A"
        session = ChatSession(user_id=user.id, title=title)
        db.add(session)
        db.flush()
        return session


def source_from_hit(hit: RetrievedChunk) -> SourceCitation:
    chunk = hit.chunk
    page = f"Page {chunk.page_number}" if chunk.page_number is not None else "Page N/A"
    citation = f"[{chunk.document_name}, {page}, Chunk {chunk.chunk_index}]"
    return SourceCitation(
        document_id=chunk.document_id,
        document_name=chunk.document_name,
        page_number=chunk.page_number,
        chunk_index=chunk.chunk_index,
        similarity=round(hit.similarity, 4),
        citation=citation,
    )


def format_answer_with_sources(answer: str, sources: list[SourceCitation]) -> str:
    if answer == NOT_FOUND_MESSAGE:
        return answer
    source_lines = "\n".join(f"- {source.citation}" for source in sources)
    return f"{answer}\n\nSources Used\n{source_lines}"

