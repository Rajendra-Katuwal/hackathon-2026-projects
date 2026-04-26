import { RefreshCw, ShieldAlert } from "lucide-react";

import type { PatientDashboard } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

type PatientHeaderProps = {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  patient: PatientDashboard;
};

export default function PatientHeader({ isRefreshing, onRefresh, patient }: PatientHeaderProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-700">Patient care workspace</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">{patient.name}</h2>
          <p className="mt-2 text-sm text-slate-500">Created {formatDateTime(patient.created_at)}</p>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-700">{patient.summary || "No patient summary available."}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            void onRefresh();
          }}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} aria-hidden />
          Refresh
        </button>
      </div>

      <div className="mt-5 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
        <ShieldAlert className="mt-0.5 h-5 w-5 flex-none text-blue-700" aria-hidden />
        <p>AI-generated coordination support. Not a diagnosis or substitute for clinical judgment.</p>
      </div>
    </section>
  );
}
