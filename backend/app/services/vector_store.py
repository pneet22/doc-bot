from dataclasses import dataclass
from typing import Any

from app.core.config import get_settings
from app.models import DocumentChunk


@dataclass(frozen=True)
class VectorSearchHit:
    chunk_id: int
    similarity: float


class ChromaVectorStore:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None
        self._collection = None
        self.available = False
        try:
            import chromadb

            self._client = chromadb.PersistentClient(path=self.settings.chroma_dir)
            self._collection = self._client.get_or_create_collection(
                name=self.settings.chroma_collection,
                metadata={"hnsw:space": "cosine"},
            )
            self.available = True
        except Exception:
            self.available = False

    def add_chunks(self, chunks: list[DocumentChunk], embeddings: list[list[float]]) -> None:
        if not self.available or not self._collection or not chunks:
            return

        self._collection.add(
            ids=[self._vector_id(chunk.id) for chunk in chunks],
            embeddings=embeddings,
            documents=[chunk.content for chunk in chunks],
            metadatas=[self._metadata(chunk) for chunk in chunks],
        )

    def delete_document(self, document_id: int) -> None:
        if not self.available or not self._collection:
            return
        self._collection.delete(where={"document_id": str(document_id)})

    def query(
        self,
        query_embedding: list[float],
        document_ids: list[int] | None,
        top_k: int,
    ) -> list[VectorSearchHit]:
        if not self.available or not self._collection:
            return []

        where: dict[str, Any] | None = None
        if document_ids:
            doc_ids = [str(document_id) for document_id in document_ids]
            where = {"document_id": doc_ids[0]} if len(doc_ids) == 1 else {"document_id": {"$in": doc_ids}}

        result = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,
            include=["distances", "metadatas"],
        )

        ids = result.get("ids", [[]])[0]
        distances = result.get("distances", [[]])[0]
        hits: list[VectorSearchHit] = []
        for vector_id, distance in zip(ids, distances, strict=False):
            chunk_id = int(str(vector_id).replace("chunk-", ""))
            similarity = max(0.0, 1.0 - float(distance))
            hits.append(VectorSearchHit(chunk_id=chunk_id, similarity=similarity))
        return hits

    @staticmethod
    def _vector_id(chunk_id: int) -> str:
        return f"chunk-{chunk_id}"

    @staticmethod
    def _metadata(chunk: DocumentChunk) -> dict[str, str | int]:
        metadata: dict[str, str | int] = {
            "document_id": str(chunk.document_id),
            "document_name": chunk.document_name,
            "chunk_index": chunk.chunk_index,
            "uploaded_at": chunk.uploaded_at.isoformat(),
        }
        if chunk.page_number is not None:
            metadata["page_number"] = chunk.page_number
        return metadata

