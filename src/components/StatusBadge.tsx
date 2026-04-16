import { getStatusTone } from "@/lib/utils";

export default function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusTone(
        label,
      )}`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}
