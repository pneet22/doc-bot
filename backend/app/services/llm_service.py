import re

from app.services.retrieval_service import RetrievedChunk


NOT_FOUND_MESSAGE = "I could not find this in the uploaded documents."


class LLMProvider:
    def generate_answer(self, question: str, retrieved_chunks: list[RetrievedChunk]) -> str:
        raise NotImplementedError


class MockLLMProvider(LLMProvider):
    """Extractive answer generator for local development.

    It only selects sentences from retrieved document chunks, which keeps the MVP
    grounded even when no hosted LLM provider is configured.
    """

    def generate_answer(self, question: str, retrieved_chunks: list[RetrievedChunk]) -> str:
        if not retrieved_chunks:
            return NOT_FOUND_MESSAGE

        question_terms = set(re.findall(r"[a-zA-Z0-9]{3,}", question.lower()))
        candidate_sentences: list[str] = []
        for hit in retrieved_chunks:
            sentences = re.split(r"(?<=[.!?])\s+", hit.chunk.content)
            ranked = sorted(
                (sentence.strip() for sentence in sentences if sentence.strip()),
                key=lambda sentence: overlap_score(sentence, question_terms),
                reverse=True,
            )
            for sentence in ranked[:2]:
                if sentence and sentence not in candidate_sentences:
                    candidate_sentences.append(sentence)

        if not candidate_sentences:
            return NOT_FOUND_MESSAGE

        selected = candidate_sentences[:4]
        return " ".join(selected)


def overlap_score(sentence: str, question_terms: set[str]) -> int:
    sentence_terms = set(re.findall(r"[a-zA-Z0-9]{3,}", sentence.lower()))
    return len(sentence_terms.intersection(question_terms))


def build_llm_provider() -> LLMProvider:
    return MockLLMProvider()

