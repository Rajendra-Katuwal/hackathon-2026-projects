import type { Alert, PatientListItem, RiskLevel, TaskOwner, TaskPriority, TaskStatus } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const statusColumns: Array<{ status: TaskStatus; label: string; description: string }> = [
  { status: "pending", label: "Pending", description: "Ready for owner action" },
  { status: "in_progress", label: "In Progress", description: "Currently being coordinated" },
  { status: "completed", label: "Completed", description: "Closed by the care team" },
  { status: "overdue", label: "Overdue", description: "Past due or blocked" },
];

export const riskRank: Record<RiskLevel, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export function sortPatientsByRisk(patients: PatientListItem[]): PatientListItem[] {
  return [...patients].sort((a, b) => {
    const aRank = a.risk ? riskRank[a.risk.level] : 3;
    const bRank = b.risk ? riskRank[b.risk.level] : 3;
    if (aRank !== bRank) return aRank - bRank;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "No deadline";
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function labelFromToken(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function riskBadgeClass(level: RiskLevel | null | undefined): string {
  if (level === "HIGH") return "border-red-200 bg-red-50 text-red-700";
  if (level === "MEDIUM") return "border-amber-200 bg-amber-50 text-amber-700";
  if (level === "LOW") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function statusBadgeClass(status: TaskStatus): string {
  const classes: Record<TaskStatus, string> = {
    pending: "border-slate-200 bg-slate-100 text-slate-700",
    in_progress: "border-blue-200 bg-blue-50 text-blue-700",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    overdue: "border-red-200 bg-red-50 text-red-700",
  };
  return classes[status];
}

export function statusColumnClass(status: TaskStatus): string {
  const classes: Record<TaskStatus, string> = {
    pending: "border-slate-200 bg-slate-50",
    in_progress: "border-blue-200 bg-blue-50/50",
    completed: "border-emerald-200 bg-emerald-50/50",
    overdue: "border-red-200 bg-red-50/50",
  };
  return classes[status];
}

export function priorityBadgeClass(priority: TaskPriority): string {
  const classes: Record<TaskPriority, string> = {
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    high: "border-orange-200 bg-orange-50 text-orange-700",
    critical: "border-red-200 bg-red-50 text-red-700",
  };
  return classes[priority];
}

export function ownerBadgeClass(owner: TaskOwner): string {
  const classes: Record<TaskOwner, string> = {
    doctor: "border-indigo-200 bg-indigo-50 text-indigo-700",
    nurse: "border-teal-200 bg-teal-50 text-teal-700",
    lab: "border-cyan-200 bg-cyan-50 text-cyan-700",
    specialist: "border-violet-200 bg-violet-50 text-violet-700",
    patient: "border-slate-200 bg-slate-100 text-slate-700",
  };
  return classes[owner];
}

export function alertBadgeClass(alert: Alert): string {
  if (alert.type === "overdue") return "border-red-200 bg-red-50 text-red-700";
  if (alert.type === "critical") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}
