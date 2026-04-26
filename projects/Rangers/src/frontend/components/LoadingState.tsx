import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  description: string;
  title: string;
};

export default function LoadingState({ description, title }: LoadingStateProps) {
  return (
    <section className="flex min-h-105 items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="max-w-md">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </section>
  );
}
