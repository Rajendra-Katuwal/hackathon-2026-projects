"use client";

import {
  Activity,
  AlertOctagon,
  Brain,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GitBranch,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";

import AlertsPanel from "@/components/AlertsPanel";
import CareGraph from "@/components/CareGraph";
import CarePlanCard from "@/components/CarePlanCard";
import PatientHeader from "@/components/PatientHeader";
import RagPanel from "@/components/RagPanel";
import RiskCard from "@/components/RiskCard";
import StatCard from "@/components/StatCard";
import TaskBoard from "@/components/TaskBoard";
import TimelinePanel from "@/components/TimelinePanel";
import type { PatientDashboard as PatientDashboardType, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type PatientDashboardProps = {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onTaskStatusChange: (taskId: number, status: TaskStatus) => Promise<void>;
  patient: PatientDashboardType;
};

export default function PatientDashboard({ isRefreshing, onRefresh, onTaskStatusChange, patient }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "coordination" | "insights">("overview");

  const taskCounts = useMemo(() => {
    return patient.tasks.reduce(
      (counts, task) => {
        counts.total += 1;
        counts[task.status] += 1;
        return counts;
      },
      { completed: 0, in_progress: 0, overdue: 0, pending: 0, total: 0 } as Record<TaskStatus | "total", number>,
    );
  }, [patient.tasks]);

  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: LayoutDashboard,
      helper: "Risk, alerts, and plan",
    },
    {
      id: "tasks" as const,
      label: "Tasks",
      icon: ClipboardList,
      helper: `${taskCounts.pending + taskCounts.in_progress + taskCounts.overdue} active`,
    },
    {
      id: "coordination" as const,
      label: "Graph & Timeline",
      icon: GitBranch,
      helper: `${patient.timeline_events?.length ?? 0} events`,
    },
    {
      id: "insights" as const,
      label: "AI Insight",
      icon: Brain,
      helper: "Ask RAG",
    },
  ];

  return (
    <div className="space-y-5">
      <PatientHeader isRefreshing={isRefreshing} onRefresh={onRefresh} patient={patient} />

      {isRefreshing ? (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Refreshing patient dashboard...
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Patient dashboard metrics">
        <StatCard
          accent="blue"
          icon={<Activity className="h-5 w-5" aria-hidden />}
          label="Risk score"
          value={patient.latest_risk ? `${patient.latest_risk.score}/100` : "Not scored"}
        />
        <StatCard
          accent="slate"
          icon={<ClipboardList className="h-5 w-5" aria-hidden />}
          label="Total tasks"
          value={taskCounts.total}
        />
        <StatCard accent="slate" icon={<Clock3 className="h-5 w-5" aria-hidden />} label="Pending" value={taskCounts.pending} />
        <StatCard
          accent="blue"
          icon={<Loader2 className="h-5 w-5" aria-hidden />}
          label="In progress"
          value={taskCounts.in_progress}
        />
        <StatCard
          accent="green"
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
          label="Completed"
          value={taskCounts.completed}
        />
        <StatCard
          accent="red"
          icon={<AlertOctagon className="h-5 w-5" aria-hidden />}
          label="Overdue"
          value={taskCounts.overdue}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm" aria-label="Dashboard sections">
        <div className="grid gap-2 md:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-md px-3 py-2 text-left transition",
                  isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
                aria-pressed={isActive}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 flex-none items-center justify-center rounded-md",
                    isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className={cn("block truncate text-xs", isActive ? "text-blue-100" : "text-slate-500")}>{tab.helper}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "overview" ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_0.8fr]">
          <div className="space-y-4">
            <RiskCard risk={patient.latest_risk} />
            <AlertsPanel alerts={patient.alerts ?? []} />
          </div>
          <CarePlanCard carePlan={patient.latest_care_plan} />
        </div>
      ) : null}

      {activeTab === "tasks" ? <TaskBoard onTaskStatusChange={onTaskStatusChange} tasks={patient.tasks ?? []} /> : null}

      {activeTab === "coordination" ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <CareGraph graph={patient.care_graph} />
          <TimelinePanel events={patient.timeline_events ?? []} />
        </section>
      ) : null}

      {activeTab === "insights" ? <RagPanel patientId={patient.id} /> : null}
    </div>
  );
}
