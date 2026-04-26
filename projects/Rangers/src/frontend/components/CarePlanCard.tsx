import { BrainCircuit, Expand } from "lucide-react";
import { useState } from "react";

import MarkdownContent from "@/components/MarkdownContent";
import Modal from "@/components/Modal";
import type { CarePlan } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type CarePlanCardProps = {
  carePlan: CarePlan | null;
};

/** ~300 chars gives roughly 5-6 visible lines as a preview */
const PREVIEW_CHARS = 320;

export default function CarePlanCard({ carePlan }: CarePlanCardProps) {
  const [showModal, setShowModal] = useState(false);

  const isLong = !!carePlan && carePlan.content.length > PREVIEW_CHARS;
  const preview = isLong ? carePlan!.content.slice(0, PREVIEW_CHARS).trimEnd() + "…" : carePlan?.content ?? "";

  return (
    <>
      <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <BrainCircuit className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold text-slate-950">Care plan</h3>
              <p className="text-sm text-slate-500">
                {carePlan ? `Updated ${formatDateTime(carePlan.updated_at)}` : "AI-assisted care coordination plan"}
              </p>
            </div>
          </div>
          {carePlan ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Expand className="h-3.5 w-3.5" aria-hidden />
              View full
            </button>
          ) : null}
        </div>

        {carePlan ? (
          <div className="flex-1 p-5">
            <MarkdownContent content={preview} />
            {isLong ? (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Read full care plan →
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-400">
            <div>
              <BrainCircuit className="mx-auto mb-3 h-8 w-8 text-slate-300" aria-hidden />
              No care plan is available for this patient yet.
            </div>
          </div>
        )}
      </section>

      {/* Full care plan modal */}
      {carePlan ? (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Full care plan"
          size="2xl"
        >
          <div className="px-6 py-5">
            <p className="mb-4 text-xs text-slate-400">Updated {formatDateTime(carePlan.updated_at)}</p>
            <MarkdownContent content={carePlan.content} />
          </div>
        </Modal>
      ) : null}
    </>
  );
}
