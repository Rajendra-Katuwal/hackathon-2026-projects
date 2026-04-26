import Link from "next/link";
import { Activity, BrainCircuit, ClipboardList, FileSearch, GitBranch, ShieldCheck, UsersRound } from "lucide-react";

const features = [
  { title: "Risk Prioritization", icon: Activity, text: "Surface patients with overdue tasks, active risks, and unresolved care gaps first." },
  { title: "AI Care Plans", icon: BrainCircuit, text: "Generate coordination plans from real patient context for clinician review." },
  { title: "Task Coordination", icon: ClipboardList, text: "Track owners, deadlines, priorities, and status across the care team." },
  { title: "Timeline + Care Graph", icon: GitBranch, text: "Review care progress over time and understand how tasks, owners, and risks connect." },
  { title: "Grounded AI Insights", icon: FileSearch, text: "Ask questions against patient summaries, care plans, and task status." },
  { title: "Auditability", icon: ShieldCheck, text: "Support traceability for care coordination actions and workflow changes." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 font-semibold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          CareSync AI
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            Login
          </Link>
          <Link href="/signup" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Create Account
          </Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Clinician-first care coordination</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            AI-powered care coordination for healthcare teams
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            CareSync AI helps providers turn patient context into care plans, task workflows, risk prioritization, timeline review, care graphs, and grounded AI insights.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
              Login
            </Link>
            <Link href="/signup" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Create Account
            </Link>
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-500">CareSync AI supports care coordination and does not replace clinical judgment.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700">High Risk</p>
              <p className="mt-2 text-3xl font-semibold text-red-900">12</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-700">Overdue</p>
              <p className="mt-2 text-3xl font-semibold text-amber-900">27</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-700">In Progress</p>
              <p className="mt-2 text-3xl font-semibold text-blue-900">43</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Patient Risk Queue</p>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Provider Dashboard</span>
            </div>
            <div className="mt-4 space-y-3">
              {["Risk review", "Care plan", "Task ownership", "Timeline update"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-blue-700">{index + 1}</span>
                  <div className="h-3 flex-1 rounded bg-slate-200" />
                  <span className="text-xs font-medium text-slate-500">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-blue-700" aria-hidden />
                <h2 className="mt-4 font-semibold text-slate-900">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <UsersRound className="h-6 w-6 text-teal-700" aria-hidden />
            <h2 className="text-xl font-semibold text-slate-900">Built for care teams</h2>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Doctors", "Nurses", "Care Coordinators", "Case Managers", "Labs", "Patients"].map((role) => (
              <span key={role} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
