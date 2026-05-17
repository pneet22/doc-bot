import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function DocumentCard({ document, onDelete }) {
  const { isAdmin } = useAuth();
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-vault">
          <FileText size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-ink">{document.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {document.file_type.toUpperCase()} · {formatBytes(document.file_size)} · {document.chunk_count} chunks
          </p>
          <p className="mt-2 text-xs text-slate-400">Uploaded {new Date(document.uploaded_at).toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <Link
          to={`/documents/${document.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ExternalLink size={16} />
          Details
        </Link>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => onDelete(document.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

