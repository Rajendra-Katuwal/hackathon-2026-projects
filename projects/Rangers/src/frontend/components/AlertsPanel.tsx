import { AlertTriangle, CheckCircle2, Clock, Zap } from "lucide-react";

import type { Alert } from "@/lib/types";
import { cn, labelFromToken } from "@/lib/utils";

type AlertsPanelProps = {
  alerts: Alert[];
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const overdue = alerts.filter((a) => a.type === "overdue");
  const critical = alerts.filter((a) => a.type === "critical");

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              alerts.length > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500",
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">Alerts</h3>
            <p className="text-sm text-slate-500">Overdue and critical coordination signals</p>
          </div>
        </div>
        {alerts.length > 0 ? (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-red-700">
            {alerts.length}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        {alerts.length ? (
          <div className="space-y-2.5">
            {overdue.map((alert, i) => (
              <div
                key={`overdue-${alert.task_id}-${i}`}
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-red-200 text-red-700">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">Overdue task</p>
                  <p className="mt-0.5 text-sm text-red-900">{alert.message}</p>
                </div>
              </div>
            ))}
            {critical.map((alert, i) => (
              <div
                key={`critical-${alert.task_id}-${i}`}
                className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-200 text-amber-700">
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Critical priority</p>
                  <p className="mt-0.5 text-sm text-amber-900">{alert.message}</p>
                </div>
              </div>
            ))}
            {alerts
              .filter((a) => a.type !== "overdue" && a.type !== "critical")
              .map((alert, i) => (
                <div
                  key={`other-${alert.task_id}-${i}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    {labelFromToken(alert.type)}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">{alert.message}</p>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" aria-hidden />
            <p className="text-sm font-semibold text-emerald-800">No active alerts — all tasks on track</p>
          </div>
        )}
      </div>
    </section>
  );
}
