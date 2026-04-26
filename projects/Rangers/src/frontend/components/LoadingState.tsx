import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  description: string;
  title: string;
};

export default function LoadingState({ description, title }: LoadingStateProps) {
  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="max-w-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </section>
  );
}
