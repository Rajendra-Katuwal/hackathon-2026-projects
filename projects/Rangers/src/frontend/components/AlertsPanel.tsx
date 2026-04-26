import { AlertTriangle, CheckCircle2 } from "lucide-react";

import type { Alert } from "@/lib/types";
import { alertBadgeClass, cn, labelFromToken } from "@/lib/utils";

type AlertsPanelProps = {
  alerts: Alert[];
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">Alerts</h3>
            <p className="text-sm text-slate-500">Overdue and critical coordination signals</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-600">{alerts.length}</span>
      </div>

      {alerts.length ? (
        <div className="mt-5 space-y-3">
          {alerts.map((alert, index) => (
            <article key={`${alert.type}-${alert.task_id}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold", alertBadgeClass(alert))}>
                {labelFromToken(alert.type)}
              </span>
              <p className="mt-2 text-sm leading-6 text-slate-700">{alert.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 flex-none" aria-hidden />
          <p>No active alerts</p>
        </div>
      )}
    </section>
  );
}
