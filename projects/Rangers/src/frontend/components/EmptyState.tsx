import { ClipboardList, Plus } from "lucide-react";

type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
};

export default function EmptyState({ actionLabel, description, onAction, title }: EmptyStateProps) {
  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="max-w-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
          <ClipboardList className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
