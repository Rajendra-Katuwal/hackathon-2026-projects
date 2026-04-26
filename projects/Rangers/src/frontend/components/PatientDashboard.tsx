"use client";

import {
  AlertOctagon,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GitBranch,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import AlertsPanel from "@/components/AlertsPanel";
import CareGraph from "@/components/CareGraph";
import CarePlanCard from "@/components/CarePlanCard";
import RagPanel from "@/components/RagPanel";
import RiskCard from "@/components/RiskCard";
import TaskBoard from "@/components/TaskBoard";
import TimelinePanel from "@/components/TimelinePanel";
import type { PatientDashboard as PatientDashboardType, TaskStatus } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

type Tab = "overview" | "tasks" | "coordination" | "insights";

type PatientDashboardProps = {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onTaskStatusChange: (taskId: number, status: TaskStatus) => Promise<void>;
  patient: PatientDashboardType;
};

// ─── Compact stat pill ────────────────────────────────────────────────────────
function StatPill({
  accent,
  icon,
  label,
}: {
  accent?: "red" | "blue" | "green" | "amber";
  icon: ReactNode;
  label: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        accent === "red" && "border-red-200 bg-red-50 text-red-700",
        accent === "blue" && "border-blue-200 bg-blue-50 text-blue-700",
        accent === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        accent === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
        !accent && "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {icon}
      {label}
    </span>
  );
}

export default function PatientDashboard({
  isRefreshing,
  onRefresh,
  onTaskStatusChange,
  patient,
}: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const taskCounts = useMemo(
    () =>
      patient.tasks.reduce(
        (acc, t) => {
          acc.total += 1;
          acc[t.status] += 1;
          return acc;
        },
        { completed: 0, in_progress: 0, overdue: 0, pending: 0, total: 0 } as Record<TaskStatus | "total", number>,
      ),
    [patient.tasks],
  );

  const riskLevel = patient.latest_risk?.level ?? null;
  const riskScore = patient.latest_risk?.score ?? null;
  const alertCount = patient.alerts?.length ?? 0;

  const tabs: Array<{
    badge?: number;
    badgeVariant?: "red" | "default";
    helper: string;
    icon: typeof LayoutDashboard;
    id: Tab;
    label: string;
  }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, helper: "Risk, alerts & plan" },
    {
      id: "tasks",
      label: "Tasks",
      icon: ClipboardList,
      helper: `${taskCounts.pending + taskCounts.in_progress} active`,
      badge: taskCounts.overdue > 0 ? taskCounts.overdue : undefined,
      badgeVariant: "red",
    },
    {
      id: "coordination",
      label: "Graph & Timeline",
      icon: GitBranch,
      helper: `${patient.timeline_events?.length ?? 0} events`,
    },
    { id: "insights", label: "AI Insight", icon: Brain, helper: "Ask care questions" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ── Patient banner ──────────────────────────────────────────────────── */}
      <div
        className={cn(
          "border-b px-6 py-5",
          riskLevel === "HIGH"
            ? "border-red-200 bg-gradient-to-r from-red-50 to-rose-50"
            : riskLevel === "MEDIUM"
            ? "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50"
            : riskLevel === "LOW"
            ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50"
            : "border-slate-200 bg-slate-50",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Risk badge */}
            {riskLevel && riskScore !== null ? (
              <div
                className={cn(
                  "flex min-w-[68px] flex-col items-center rounded-xl border-2 px-3 py-2 shadow-sm",
                  riskLevel === "HIGH"
                    ? "border-red-300 bg-white text-red-700"
                    : riskLevel === "MEDIUM"
                    ? "border-amber-300 bg-white text-amber-700"
                    : "border-emerald-300 bg-white text-emerald-700",
                )}
              >
                <p className="text-2xl font-black leading-none">{riskScore}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest">{riskLevel}</p>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</p>
              <h2 className="mt-0.5 text-xl font-bold text-slate-950 sm:text-2xl">{patient.name}</h2>
              <p className="mt-0.5 text-xs text-slate-500">Registered {formatDateTime(patient.created_at)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Alert badge */}
            {alertCount > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-bold text-red-700 transition hover:bg-red-200"
              >
                <AlertTriangle className="h-4 w-4" aria-hidden />
                {alertCount} alert{alertCount > 1 ? "s" : ""}
              </button>
            ) : null}

            {/* Refresh */}
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} aria-hidden />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        {patient.summary ? (
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{patient.summary}</p>
        ) : null}

        {/* Compact stat pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatPill icon={<ClipboardList className="h-3.5 w-3.5" aria-hidden />} label={`${taskCounts.total} tasks`} />
          {taskCounts.overdue > 0 ? (
            <StatPill
              accent="red"
              icon={<AlertOctagon className="h-3.5 w-3.5" aria-hidden />}
              label={`${taskCounts.overdue} overdue`}
            />
          ) : null}
          {taskCounts.in_progress > 0 ? (
            <StatPill
              accent="blue"
              icon={<Loader2 className="h-3.5 w-3.5" aria-hidden />}
              label={`${taskCounts.in_progress} in progress`}
            />
          ) : null}
          {taskCounts.pending > 0 ? (
            <StatPill
              accent="amber"
              icon={<Clock3 className="h-3.5 w-3.5" aria-hidden />}
              label={`${taskCounts.pending} pending`}
            />
          ) : null}
          {taskCounts.completed > 0 ? (
            <StatPill
              accent="green"
              icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
              label={`${taskCounts.completed} done`}
            />
          ) : null}
        </div>

        {/* Refreshing indicator */}
        {isRefreshing ? (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Refreshing dashboard…
          </div>
        ) : null}

        {/* AI disclaimer */}
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 text-xs text-blue-800 backdrop-blur">
          <ShieldAlert className="mt-px h-3.5 w-3.5 flex-none text-blue-600" aria-hidden />
          AI-generated coordination support only — not a diagnosis or substitute for clinical judgment.
        </div>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white">
        <nav className="flex overflow-x-auto px-6" role="tablist" aria-label="Dashboard sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-semibold whitespace-nowrap transition",
                  isActive
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {tab.label}
                {tab.badge ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-xs font-bold",
                      tab.badgeVariant === "red" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6">
        {activeTab === "overview" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <RiskCard risk={patient.latest_risk} />
              <AlertsPanel alerts={patient.alerts ?? []} />
            </div>
            <CarePlanCard carePlan={patient.latest_care_plan} />
          </div>
        ) : null}

        {activeTab === "tasks" ? (
          <TaskBoard onTaskStatusChange={onTaskStatusChange} tasks={patient.tasks ?? []} />
        ) : null}

        {activeTab === "coordination" ? (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
            <CareGraph graph={patient.care_graph} />
            <TimelinePanel events={patient.timeline_events ?? []} />
          </div>
        ) : null}

        {activeTab === "insights" ? <RagPanel patientId={patient.id} /> : null}
      </div>
    </div>
  );
}
