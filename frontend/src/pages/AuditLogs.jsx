import { ClipboardList, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { api, getApiError } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuditLogs() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchLogs() {
      try {
        const response = await api.get("/audit-logs");
        setLogs(response.data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Access" title="Audit logs" />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-center gap-3 font-semibold">
            <ShieldAlert size={20} />
            Viewer accounts cannot view audit logs.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Audit logs"
        description="Admin-visible trail for uploads, deletions, and document questions."
      />

      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <p className="text-sm text-slate-500">Loading logs...</p> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <HeaderCell>Action</HeaderCell>
              <HeaderCell>User</HeaderCell>
              <HeaderCell>Resource</HeaderCell>
              <HeaderCell>Metadata</HeaderCell>
              <HeaderCell>Time</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <BodyCell>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-vault">
                    <ClipboardList size={14} />
                    {log.action}
                  </span>
                </BodyCell>
                <BodyCell>{log.username}</BodyCell>
                <BodyCell>
                  {log.resource_type}
                  {log.resource_id ? ` #${log.resource_id}` : ""}
                </BodyCell>
                <BodyCell>
                  <code className="whitespace-pre-wrap break-words text-xs text-slate-600">
                    {JSON.stringify(log.metadata)}
                  </code>
                </BodyCell>
                <BodyCell>{new Date(log.created_at).toLocaleString()}</BodyCell>
              </tr>
            ))}
            {!loading && logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                  No audit events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderCell({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>;
}

function BodyCell({ children }) {
  return <td className="max-w-xs px-4 py-4 align-top text-sm text-slate-700">{children}</td>;
}

