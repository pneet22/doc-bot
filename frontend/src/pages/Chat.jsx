import { Bot, FileText, Send, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { api, getApiError } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";

export default function Chat() {
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await api.get("/documents");
        setDocuments(response.data);
        setSelectedIds(response.data.map((document) => document.id));
      } catch (err) {
        setError(getApiError(err));
      }
    }
    fetchDocuments();
  }, []);

  function toggleDocument(documentId) {
    setSelectedIds((current) =>
      current.includes(documentId) ? current.filter((id) => id !== documentId) : [...current, documentId]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim()) return;
    const currentQuestion = question.trim();
    setQuestion("");
    setLoading(true);
    setError("");
    setMessages((current) => [...current, { role: "user", content: currentQuestion }]);

    try {
      const response = await api.post("/chat/query", {
        question: currentQuestion,
        document_ids: selectedIds.length ? selectedIds : null,
        session_id: sessionId
      });
      setSessionId(response.data.session_id);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.data.answer, sources: response.data.sources }
      ]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Chat"
        title="Ask from uploaded documents"
        description="Questions are answered only from retrieved chunks that pass the configured similarity threshold."
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
            <FileText size={18} className="text-vault" />
            Selected documents
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">No documents are available.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((document) => (
                <label
                  key={document.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(document.id)}
                    onChange={() => toggleDocument(document.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-vault focus:ring-vault"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{document.name}</span>
                    <span className="text-xs text-slate-500">{document.chunk_count} chunks</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </aside>

        <section className="flex min-h-[680px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div>
                  <Bot size={34} className="mx-auto text-vault" />
                  <p className="mt-3 font-semibold text-ink">Start with a document-specific question.</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Example: What controls are required for privileged access reviews?
                  </p>
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <ChatBubble key={`${message.role}-${index}`} message={message} />
            ))}

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Bot size={18} className="text-vault" />
                Retrieving grounded context...
              </div>
            ) : null}
          </div>

          {error ? <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question from the selected documents..."
                rows={2}
                className="min-h-[52px] flex-1 resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-vault focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-vault text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                title="Send question"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-vault">
          <Bot size={18} />
        </div>
      ) : null}
      <div className={`max-w-3xl rounded-lg px-4 py-3 ${isUser ? "bg-vault text-white" : "bg-slate-100 text-ink"}`}>
        <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
      </div>
      {isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
          <UserRound size={18} />
        </div>
      ) : null}
    </div>
  );
}
