export default function SourceList({ sources }) {
  if (!sources?.length) {
    return <p className="text-sm text-slate-500">No sources were used.</p>;
  }

  return (
    <div className="grid gap-2">
      {sources.map((source) => (
        <div
          key={`${source.document_id}-${source.chunk_index}`}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
        >
          <p className="font-medium">{source.citation}</p>
          <p className="text-xs text-slate-500">Similarity {Math.round(source.similarity * 100)}%</p>
        </div>
      ))}
    </div>
  );
}

