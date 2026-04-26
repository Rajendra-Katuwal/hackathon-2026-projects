import { Activity, ShieldAlert, TrendingUp } from "lucide-react";

import type { RiskScore } from "@/lib/types";
import { cn, formatDateTime, riskBadgeClass } from "@/lib/utils";

type RiskCardProps = {
  risk: RiskScore | null;
};

export default function RiskCard({ risk }: RiskCardProps) {
  if (!risk) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">Risk score</h3>
            <p className="text-sm text-slate-500">Not yet assessed</p>
          </div>
        </div>
      </section>
    );
  }

  const barColor =
    risk.level === "HIGH"
      ? "bg-red-500"
      : risk.level === "MEDIUM"
      ? "bg-amber-400"
      : "bg-emerald-500";

  const borderColor =
    risk.level === "HIGH"
      ? "border-red-200"
      : risk.level === "MEDIUM"
      ? "border-amber-200"
      : "border-emerald-200";

  return (
    <section className={cn("overflow-hidden rounded-xl border-2 bg-white shadow-sm", borderColor)}>
      {/* Score header */}
      <div className="flex items-center justify-between gap-4 px-5 pt-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">Risk score</h3>
            <p className="text-xs text-slate-500">Assessed {formatDateTime(risk.created_at)}</p>
          </div>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", riskBadgeClass(risk.level))}>
          {risk.level}
        </span>
      </div>

      {/* Score gauge */}
      <div className="px-5 pb-2 pt-4">
        <div className="flex items-end justify-between">
          <span className="text-5xl font-bold leading-none text-slate-950">{risk.score}</span>
          <span className="mb-1 text-sm font-medium text-slate-400">/ 100</span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn("h-full rounded-full transition-all duration-700", barColor)}
            style={{ width: `${risk.score}%` }}
            role="progressbar"
            aria-valuenow={risk.score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      {/* Reasoning */}
      {risk.reasoning ? (
        <div className="mx-5 mb-5 mt-3 rounded-lg bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            Clinical reasoning
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">{risk.reasoning}</p>
        </div>
      ) : null}
    </section>
  );
}
