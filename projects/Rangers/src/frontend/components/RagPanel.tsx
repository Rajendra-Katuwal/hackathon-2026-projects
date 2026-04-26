"use client";

import { type FormEvent, useState } from "react";
import { Brain, Loader2, MessageSquare, Send, ShieldCheck, Sparkles } from "lucide-react";

import MarkdownContent from "@/components/MarkdownContent";
import { getApiError, queryRag } from "@/lib/api";

type RagPanelProps = {
  patientId: number;
};

const EXAMPLE_QUESTIONS = [
  "What should the care team prioritize next?",
  "Which tasks are blocking progress?",
  "What follow-up gaps exist for this patient?",
  "Are there any medication adherence risks?",
];

export default function RagPanel({ patientId }: RagPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const q = question.trim();
    if (!q) return;

    setError("");
    setAnswer("");
    setIsLoading(true);

    try {
      const res = await queryRag(patientId, q);
      setAnswer(res.answer);
    } catch (err) {
      setError(`RAG query failed. ${getApiError(err)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Brain className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold text-blue-950">AI Care Insight</h3>
          <p className="mt-0.5 text-sm text-blue-700">
            Grounded by clinical guidelines + this patient&apos;s live care state (risk, tasks, alerts, timeline).
          </p>
        </div>
      </div>

      {/* Example questions */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Suggested questions
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-500" aria-hidden />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <label className="sr-only" htmlFor="rag-question">
          Care coordination question
        </label>
        <textarea
          id="rag-question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about care priorities, blockers, follow-up gaps, owner handoffs, medication risks…"
          className="w-full resize-none border-0 px-4 py-3.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void handleSubmit();
          }}
        />
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-500" aria-hidden />
            Clinical support only — not a diagnosis
          </div>
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {isLoading ? "Thinking…" : "Ask"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-blue-800">Consulting clinical guidelines…</p>
            <p className="text-xs text-blue-600">Retrieving relevant context and generating response.</p>
          </div>
        </div>
      ) : null}

      {/* Answer */}
      {answer && !isLoading ? (
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <MessageSquare className="h-4 w-4 text-blue-600" aria-hidden />
            <p className="text-sm font-semibold text-slate-800">AI Response</p>
            <span className="ml-auto text-xs text-slate-400">Grounded by clinical context</span>
          </div>
          <div className="p-5">
            <MarkdownContent content={answer} />
          </div>
        </article>
      ) : null}
    </section>
  );
}
