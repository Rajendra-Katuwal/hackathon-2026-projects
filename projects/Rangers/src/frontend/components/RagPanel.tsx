"use client";

import { FormEvent, useState } from "react";
import { Brain, Loader2, MessageSquareText, ShieldCheck } from "lucide-react";

import { getApiError, queryRag } from "@/lib/api";

type RagPanelProps = {
  patientId: number;
};

const exampleQuestions = [
  "What should the care team prioritize next?",
  "Which tasks are blocking progress?",
  "What follow-up gaps exist for this patient?",
];

export default function RagPanel({ patientId }: RagPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await queryRag(patientId, trimmedQuestion);
      setAnswer(response.answer);
    } catch (err) {
      setError(`RAG query failed. ${getApiError(err)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Brain className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold text-slate-950">RAG insight</h3>
          <p className="text-sm text-slate-500">Grounded by guidelines plus this patient&apos;s tasks, risk, alerts, and timeline</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {exampleQuestions.map((example) => (
          <button
            type="button"
            key={example}
            onClick={() => setQuestion(example)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {example}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="rag-question">
          Care coordination question
          <textarea
            id="rag-question"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about priorities, blockers, follow-up gaps, or owner handoffs."
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-normal leading-6 text-slate-900 shadow-sm placeholder:text-slate-400"
          />
        </label>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 text-sm leading-6 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-teal-600" aria-hidden />
            <p>Grounded AI insight for care coordination support only.</p>
          </div>
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageSquareText className="h-4 w-4" aria-hidden />}
            Ask care question
          </button>
        </div>
      </form>

      {error ? (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {answer ? (
        <article className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Answer</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{answer}</p>
        </article>
      ) : null}
    </section>
  );
}
