import { FileText, MessageSquareText, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, getApiError } from "../api/client.js";
import DocumentCard from "../components/DocumentCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchDocuments() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteDocument(documentId) {
    if (!window.confirm("Delete this document and its vector chunks?")) return;
    try {
      await api.delete(`/documents/${documentId}`);
      setDocuments((current) => current.filter((document) => document.id !== documentId));
    } catch (err) {
      setError(getApiError(err));
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  const totalChunks = useMemo(
    () => documents.reduce((total, document) => total + document.chunk_count, 0),
    [documents]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Document vault"
        description="Review uploaded knowledge sources, open document chunks, and move into citation-backed chat."
        actions={
          <>
            {isAdmin ? (
              <Link
                to="/documents/upload"
                className="inline-flex items-center gap-2 rounded-lg bg-vault px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus size={17} />
                Upload
              </Link>
            ) : null}
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <MessageSquareText size={17} />
              Ask
            </Link>
          </>
        }
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard icon={FileText} label="Documents" value={documents.length} />
        <MetricCard icon={ShieldCheck} label="Indexed chunks" value={totalChunks} />
        <MetricCard icon={MessageSquareText} label="Retrieval mode" value="Top 5" />
      </section>

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <p className="text-sm text-slate-500">Loading documents...</p> : null}

      {!loading && documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-ink">No documents indexed yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            {isAdmin ? "Upload a PDF, TXT, or DOCX file to start." : "Ask an admin to upload documents."}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} onDelete={deleteDocument} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-vault">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

