from dataclasses import dataclass

from app.core.config import get_settings
from app.services.text_extractor import ExtractedPage


@dataclass(frozen=True)
class ChunkPayload:
    page_number: int | None
    chunk_index: int
    content: str


def split_into_chunks(pages: list[ExtractedPage]) -> list[ChunkPayload]:
    settings = get_settings()
    chunks: list[ChunkPayload] = []
    chunk_index = 0

    for page in pages:
        words = page.text.split()
        if not words:
            continue
        start = 0
        while start < len(words):
            end = min(start + settings.chunk_size_words, len(words))
            content = " ".join(words[start:end]).strip()
            if content:
                chunks.append(
                    ChunkPayload(
                        page_number=page.page_number,
                        chunk_index=chunk_index,
                        content=content,
                    )
                )
                chunk_index += 1
            if end == len(words):
                break
            start = max(end - settings.chunk_overlap_words, start + 1)

    return chunks

