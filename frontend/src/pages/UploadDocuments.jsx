import { FileUp, ShieldAlert, UploadCloud } from "lucide-react";
import { useState } from "react";

import { api, getApiError } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function UploadDocuments() {
  const { isAdmin } = useAuth();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Access" title="Upload documents" />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-center gap-3 font-semibold">
            <ShieldAlert size={20} />
            Viewer accounts cannot upload documents.
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setStatus("");
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await api.post("/documents/upload", body, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setStatus(`${response.data.name} indexed with ${response.data.chunk_count} chunks.`);
      setFile(null);
      event.currentTarget.reset();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Ingestion"
        title="Upload documents"
        description="PDF, TXT, and DOCX files are parsed, chunked, embedded, and written to the document vault."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label
          htmlFor="document"
          className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-vault hover:bg-emerald-50"
        >
          <UploadCloud size={36} className="text-vault" />
          <span className="mt-3 text-sm font-semibold text-ink">
            {file ? file.name : "Choose a PDF, TXT, or DOCX file"}
          </span>
          <span className="mt-1 text-xs text-slate-500">Maximum upload size follows the backend limit.</span>
          <input
            id="document"
            type="file"
            accept=".pdf,.txt,.docx"
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>

        {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {status ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</div> : null}

        <button
          type="submit"
          disabled={!file || loading}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-vault px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileUp size={18} />
          {loading ? "Indexing..." : "Upload and index"}
        </button>
      </form>
    </div>
  );
}

