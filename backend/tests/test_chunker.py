from app.services.chunker import split_into_chunks
from app.services.text_extractor import ExtractedPage


def test_split_into_chunks_keeps_metadata():
    pages = [ExtractedPage(page_number=3, text=" ".join(["trust"] * 500))]
    chunks = split_into_chunks(pages)

    assert chunks
    assert chunks[0].page_number == 3
    assert chunks[0].chunk_index == 0

