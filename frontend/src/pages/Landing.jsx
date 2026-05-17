import { ArrowRight, FileCheck2, LockKeyhole, MessageSquareText, ShieldCheck } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-100 text-ink">
      <section className="document-grid min-h-screen border-b border-slate-200 bg-white">
        <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <ShieldCheck size={17} className="text-vault" />
              Secure RAG document workspace
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-6xl">
              TrustVault AI
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Upload internal PDFs, TXT files, and DOCX documents, then ask grounded questions with citations and audit
              visibility built in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-vault px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
              >
                Open dashboard
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="grid gap-4 md:grid-cols-[0.75fr_1.25fr]">
              <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                <PreviewRow icon={FileCheck2} label="handbook.pdf" value="17 chunks" />
                <PreviewRow icon={FileCheck2} label="policy.docx" value="9 chunks" />
                <PreviewRow icon={FileCheck2} label="controls.txt" value="5 chunks" />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MessageSquareText size={18} className="text-vault" />
                  Grounded answer
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  Access reviews are required quarterly for privileged systems. Evidence must include reviewer,
                  timestamp, and remediation status.
                </p>
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                  [security-policy.docx, Page N/A, Chunk 4]
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <LockKeyhole size={18} className="text-amber-600" />
              Answers are constrained to retrieved document chunks.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PreviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-vault">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-slate-500">{value}</p>
      </div>
    </div>
  );
}

