import { Clock3 } from "lucide-react";
import { useMemo } from "react";

import type { TimelineEvent } from "@/lib/types";
import { cn, formatDateTime, labelFromToken } from "@/lib/utils";

type TimelinePanelProps = {
  events: TimelineEvent[];
};

export default function TimelinePanel({ events }: TimelinePanelProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Clock3 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">Timeline</h3>
            <p className="text-sm text-slate-500">Newest events first</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-600">{sortedEvents.length}</span>
      </div>

      {sortedEvents.length ? (
        <div className="max-h-[480px] overflow-y-auto px-5 py-4">
          <ol className="relative space-y-5 border-l-2 border-slate-100 pl-5">
            {sortedEvents.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[1.625rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm",
                    event.event_type.includes("completed") && "bg-emerald-500",
                    event.event_type.includes("deadline") && "bg-red-500",
                    event.event_type.includes("risk") && "bg-amber-500",
                    !event.event_type.includes("completed") &&
                      !event.event_type.includes("deadline") &&
                      !event.event_type.includes("risk") &&
                      "bg-blue-500",
                  )}
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {labelFromToken(event.event_type)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(event.timestamp)}</p>
                <p className="mt-1.5 text-sm leading-5 text-slate-700">{event.description}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="p-5 text-center text-sm text-slate-400">
          No timeline events yet.
        </div>
      )}
    </section>
  );
}
