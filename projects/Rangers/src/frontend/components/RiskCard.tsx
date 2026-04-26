import { Activity, ShieldAlert } from "lucide-react";

import type { RiskScore } from "@/lib/types";
import { cn, formatDateTime, riskBadgeClass } from "@/lib/utils";

type RiskCardProps = {
  risk: RiskScore | null;
};

export default function RiskCard({ risk }: RiskCardProps) {
  if (!risk) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">Risk prioritization</h3>
            <p className="text-sm text-slate-500">No risk score available yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-lg border bg-white p-5 shadow-sm",
        risk.level === "HIGH" ? "border-red-200" : risk.level === "MEDIUM" ? "border-amber-200" : "border-emerald-200",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Activity className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold text-slate-950">Risk prioritization</h3>
              <p className="text-sm text-slate-500">Assessed {formatDateTime(risk.created_at)}</p>
            </div>
          </div>
          <p className="mt-5 text-5xl font-semibold text-slate-950">{risk.score}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Risk score out of 100</p>
        </div>

        <span className={cn("inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold", riskBadgeClass(risk.level))}>
          {risk.level} risk
        </span>
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ShieldAlert className="h-4 w-4 text-slate-500" aria-hidden />
          Reasoning
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{risk.reasoning || "No risk reasoning provided."}</p>
      </div>
    </section>
  );
}
