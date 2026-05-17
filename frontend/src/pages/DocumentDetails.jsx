import { ArrowLeft, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, getApiError } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";

export default function DocumentDetails() {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocument() {
      try {
        const response = await api.get(`/documents/${documentId}`);
        setDocument(response.data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    }
    fetchDocument();
  }, [documentId]);

  return (
    <div>
      <PageHeader
        eyebrow="Document"
        title={document?.name || "Document details"}
        description={document ? `${document.chunk_count} indexed chunks from ${document.file_type.toUpperCase()}` : ""}
        actions={
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Back
          </Link>
        }
      />

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <p className="text-sm text-slate-500">Loading document...</p> : null}

      {document ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-vault">
              <FileText size={24} />
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <Meta label="Type" value={document.file_type.toUpperCase()} />
              <Meta label="Chunks" value={document.chunk_count} />
              <Meta label="Uploaded" value={new Date(document.uploaded_at).toLocaleString()} />
              <Meta label="File size" value={formatBytes(document.file_size)} />
            </dl>
          </aside>

          <section className="space-y-3">
            {document.chunks.map((chunk) => (
              <article key={chunk.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Chunk {chunk.chunk_index}</span>
                  <span>·</span>
                  <span>{chunk.page_number ? `Page ${chunk.page_number}` : "Page N/A"}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{chunk.content}</p>
              </article>
            ))}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-slate-800">{value}</dd>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

