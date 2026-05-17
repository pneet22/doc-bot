import json
import math
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import DocumentChunk
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import ChromaVectorStore


@dataclass(frozen=True)
class RetrievedChunk:
    chunk: DocumentChunk
    similarity: float


class RetrievalService:
    def __init__(self, embedding_service: EmbeddingService, vector_store: ChromaVectorStore) -> None:
        self.settings = get_settings()
        self.embedding_service = embedding_service
        self.vector_store = vector_store

    def retrieve(
        self,
        db: Session,
        question: str,
        document_ids: list[int] | None,
    ) -> list[RetrievedChunk]:
        query_embedding = self.embedding_service.embed_texts([question])[0]
        hits = self.vector_store.query(query_embedding, document_ids, self.settings.retrieval_top_k)
        if hits:
            chunk_map = {
                chunk.id: chunk
                for chunk in db.query(DocumentChunk)
                .filter(DocumentChunk.id.in_([hit.chunk_id for hit in hits]))
                .all()
            }
            retrieved = [
                RetrievedChunk(chunk=chunk_map[hit.chunk_id], similarity=hit.similarity)
                for hit in hits
                if hit.chunk_id in chunk_map and hit.similarity >= self.settings.similarity_threshold
            ]
            return retrieved[: self.settings.retrieval_top_k]

        return self._retrieve_from_sqlite_embeddings(db, query_embedding, document_ids)

    def _retrieve_from_sqlite_embeddings(
        self,
        db: Session,
        query_embedding: list[float],
        document_ids: list[int] | None,
    ) -> list[RetrievedChunk]:
        query = db.query(DocumentChunk)
        if document_ids:
            query = query.filter(DocumentChunk.document_id.in_(document_ids))

        scored: list[RetrievedChunk] = []
        for chunk in query.all():
            if not chunk.embedding_json:
                continue
            similarity = cosine_similarity(query_embedding, json.loads(chunk.embedding_json))
            if similarity >= self.settings.similarity_threshold:
                scored.append(RetrievedChunk(chunk=chunk, similarity=similarity))

        scored.sort(key=lambda hit: hit.similarity, reverse=True)
        return scored[: self.settings.retrieval_top_k]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    numerator = sum(a * b for a, b in zip(left, right, strict=False))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return max(0.0, numerator / (left_norm * right_norm))

