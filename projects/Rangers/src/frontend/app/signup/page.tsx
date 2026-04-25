"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";

import { ErrorState } from "@/components/shared/ErrorState";
import { useAuth } from "@/hooks/useAuth";
import { getApiError } from "@/lib/api";
import { useUiStore } from "@/store/uiStore";

const roles = ["Doctor", "Nurse", "Care Coordinator", "Case Manager", "Admin"];

export default function SignupPage() {
  const router = useRouter();
  const { signup, user } = useAuth();
  const notify = useUiStore((state) => state.notify);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    role: "Care Coordinator",
  });

  useEffect(() => {
    if (user) router.replace("/patients");
  }, [router, user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    await signup.mutateAsync({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      organization: form.organization,
      role: form.role,
    });
    notify("Account created.", "success");
    router.replace("/patients");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="mb-8 flex items-center gap-3 font-semibold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          CareSync AI
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Create provider account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Set up secure access for your care coordination workflow.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {(error || signup.isError) ? <div className="sm:col-span-2"><ErrorState title="Unable to create account" description={error || getApiError(signup.error)} /></div> : null}
          <Field label="Full name" value={form.full_name} onChange={(full_name) => setForm((current) => ({ ...current, full_name }))} />
          <Field label="Email" type="email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} />
          <Field label="Password" type="password" value={form.password} onChange={(password) => setForm((current) => ({ ...current, password }))} />
          <Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(confirmPassword) => setForm((current) => ({ ...current, confirmPassword }))} />
          <Field label="Organization / clinic name" value={form.organization} onChange={(organization) => setForm((current) => ({ ...current, organization }))} />
          <label className="block text-sm font-semibold text-slate-900">
            Role
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal">
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button disabled={signup.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              <UserPlus className="h-4 w-4" aria-hidden />
              {signup.isPending ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-semibold text-blue-700">Login</Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm font-semibold text-slate-900">
      {label}
      <input type={type} required value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal" />
    </label>
  );
}
