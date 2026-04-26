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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Clock3 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">Timeline</h3>
            <p className="text-sm text-slate-500">Newest coordination events first</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-600">{sortedEvents.length}</span>
      </div>

      {sortedEvents.length ? (
        <div className="mt-5 max-h-117.5 overflow-y-auto pr-1">
          <ol className="relative space-y-5 border-l border-slate-200 pl-5">
            {sortedEvents.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-7.25 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                    event.event_type.includes("completed") && "bg-emerald-500",
                    event.event_type.includes("deadline") && "bg-red-500",
                    event.event_type.includes("risk") && "bg-amber-500",
                    !event.event_type.includes("completed") &&
                      !event.event_type.includes("deadline") &&
                      !event.event_type.includes("risk") &&
                      "bg-blue-500",
                  )}
                />
                <p className="text-sm font-semibold text-slate-950">{labelFromToken(event.event_type)}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDateTime(event.timestamp)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{event.description}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          No timeline events are available for this patient.
        </div>
      )}
    </section>
  );
}
