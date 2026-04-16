export default function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="surface-card flex min-h-56 items-center justify-center rounded-[1.5rem]">
      <div className="flex items-center gap-3 text-slate-600">
        <span className="h-3 w-3 animate-pulse rounded-full bg-[#f57224]" />
        <span>{label}</span>
      </div>
    </div>
  );
}
