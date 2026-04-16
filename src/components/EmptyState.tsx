interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="surface-card flex min-h-64 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-orange-200 p-8 text-center">
      <div className="mb-4 rounded-full bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f57224]">
        Empty State
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}
