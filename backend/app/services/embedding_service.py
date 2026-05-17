import hashlib
import math
import re

import numpy as np

from app.core.config import get_settings


class EmbeddingService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if self.settings.embedding_backend.lower() == "mock":
            return [self._hash_embedding(text) for text in texts]

        model = self._load_model()
        if model is None:
            return [self._hash_embedding(text) for text in texts]

        embeddings = model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.astype(float).tolist()

    def _load_model(self):
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError:
            return None

        self._model = SentenceTransformer(self.settings.embedding_model_name)
        return self._model

    @staticmethod
    def _hash_embedding(text: str, dimensions: int = 384) -> list[float]:
        vector = np.zeros(dimensions, dtype=float)
        tokens = re.findall(r"[a-zA-Z0-9]+", text.lower())
        for token in tokens:
            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
            value = int.from_bytes(digest, "big")
            index = value % dimensions
            sign = -1.0 if value & 1 else 1.0
            vector[index] += sign
        norm = math.sqrt(float(np.dot(vector, vector)))
        if norm == 0:
            return vector.tolist()
        return (vector / norm).tolist()

