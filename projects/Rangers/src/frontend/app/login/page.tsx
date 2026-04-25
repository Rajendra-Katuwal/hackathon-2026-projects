"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { ErrorState } from "@/components/shared/ErrorState";
import { useAuth } from "@/hooks/useAuth";
import { getApiError } from "@/lib/api";
import { useUiStore } from "@/store/uiStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const notify = useUiStore((state) => state.notify);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (user) {
      const next = new URLSearchParams(window.location.search).get("next") || "/patients";
      router.replace(next);
    }
  }, [router, user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await login.mutateAsync(form);
    notify("Signed in securely.", "success");
    const next = new URLSearchParams(window.location.search).get("next") || "/patients";
    router.replace(next);
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in with your provider account to access CareSync AI.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {login.isError ? <ErrorState title="Unable to sign in" description={getApiError(login.error)} /> : null}
        <Field label="Email" type="email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} />
        <Field label="Password" type="password" value={form.password} onChange={(password) => setForm((current) => ({ ...current, password }))} />
        <button disabled={login.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          <LockKeyhole className="h-4 w-4" aria-hidden />
          {login.isPending ? "Signing in..." : "Login"}
        </button>
        <div className="flex items-center justify-between text-sm">
          <Link href="/signup" className="font-semibold text-blue-700 hover:text-blue-800">Create account</Link>
          <Link href="/forgot-password" className="font-semibold text-slate-600 hover:text-slate-900">Forgot password?</Link>
        </div>
        <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          Sessions use secure backend authentication. Shared workstations should be locked when unattended.
        </p>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="mb-8 flex items-center gap-3 font-semibold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          CareSync AI
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-slate-900">
      {label}
      <input
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal text-slate-900 outline-blue-600"
      />
    </label>
  );
}
