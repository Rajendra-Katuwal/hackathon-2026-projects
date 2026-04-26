import { BrainCircuit } from "lucide-react";

import type { CarePlan } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type CarePlanCardProps = {
  carePlan: CarePlan | null;
};

export default function CarePlanCard({ carePlan }: CarePlanCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
          <BrainCircuit className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold text-slate-950">Latest care plan</h3>
          <p className="text-sm text-slate-500">AI-assisted care coordination plan</p>
        </div>
      </div>

      {carePlan ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-slate-500">Updated {formatDateTime(carePlan.updated_at)}</p>
          <div className="mt-3 max-h-130 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{carePlan.content}</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          No care plan is available for this patient.
        </div>
      )}
    </section>
  );
}
