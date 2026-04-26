"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";

import { ErrorState } from "@/components/shared/ErrorState";
import { authApi, getApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: () => setSent(true),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="mb-8 flex items-center gap-3 font-semibold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          CareSync AI
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Enter your provider email and the backend reset service will send instructions if an account exists.</p>
        {sent ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
            Reset request submitted. Check your email for next steps.
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await mutation.mutateAsync(email);
            }}
          >
            {mutation.isError ? <ErrorState title="Unable to request reset" description={getApiError(mutation.error)} /> : null}
            <label className="block text-sm font-semibold text-slate-900">
              Email
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal" />
            </label>
            <button disabled={mutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              <Mail className="h-4 w-4" aria-hidden />
              {mutation.isPending ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-blue-700">Back to Login</Link>
      </div>
    </main>
  );
}
