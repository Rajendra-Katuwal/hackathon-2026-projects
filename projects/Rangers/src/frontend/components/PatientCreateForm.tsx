"use client";

import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";

const demoSummary =
  "Patient has type 2 diabetes, hypertension, missed recent HbA1c follow-up, inconsistent medication adherence, and needs coordinated PCP/lab/pharmacy follow-up.";

type PatientCreateFormProps = {
  isSubmitting: boolean;
  onCancel?: () => void;
  onCreate: (name: string, summary: string) => Promise<void>;
};

export default function PatientCreateForm({ isSubmitting, onCancel, onCreate }: PatientCreateFormProps) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    const trimmedName = name.trim();
    const trimmedSummary = summary.trim();

    if (!trimmedName || !trimmedSummary) {
      setLocalError("Enter a patient name and care context summary.");
      return;
    }

    try {
      await onCreate(trimmedName, trimmedSummary);
    } catch {
      setLocalError("Patient creation failed. Check the message above and try again.");
    }
  }

  return (
    <section className="p-5 sm:p-6">
      <p className="mb-5 text-sm leading-6 text-slate-500">
        Add patient context to generate a care plan, risk score, coordination tasks, timeline, and dependency graph.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {localError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {localError}
          </div>
        ) : null}

        <label className="block text-sm font-medium text-slate-800" htmlFor="patient-name">
          Patient name
          <input
            id="patient-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
            placeholder="Example: Maya Thompson"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-normal text-slate-900 shadow-sm placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </label>

        <label className="block text-sm font-medium text-slate-800" htmlFor="patient-summary">
          Patient summary and care context
          <textarea
            id="patient-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            disabled={isSubmitting}
            rows={7}
            placeholder="Summarize conditions, missed follow-ups, current care gaps, and coordination needs."
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-normal leading-6 text-slate-900 shadow-sm placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setSummary(demoSummary)}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4 text-teal-600" aria-hidden />
            Use demo summary
          </button>

          <div className="flex items-center gap-2">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Generating…" : "Generate care plan"}
            </button>
          </div>
        </div>

        {isSubmitting ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">
            Generating care plan, tasks, and risk score...
          </div>
        ) : null}
      </form>
    </section>
  );
}
