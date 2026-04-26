"use client";

import { CalendarDays, UserRound } from "lucide-react";

import type { Task, TaskStatus } from "@/lib/types";
import {
  cn,
  formatDate,
  labelFromToken,
  ownerBadgeClass,
  priorityBadgeClass,
  statusBadgeClass,
  statusColumns,
} from "@/lib/utils";

type TaskCardProps = {
  isUpdating: boolean;
  onStatusChange: (taskId: number, status: TaskStatus) => Promise<void>;
  task: Task;
};

const PRIORITY_BAR: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-400",
  medium:   "bg-amber-400",
  low:      "bg-emerald-500",
};

export default function TaskCard({ isUpdating, onStatusChange, task }: TaskCardProps) {
  const isOverdue = task.status === "overdue";
  const isInProgress = task.status === "in_progress";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-white transition hover:shadow-md",
        isOverdue
          ? "border-red-200 shadow-sm shadow-red-50"
          : isInProgress
          ? "border-blue-100"
          : "border-slate-200",
        isUpdating && "pointer-events-none opacity-60",
      )}
    >
      {/* Priority left accent */}
      <span
        className={cn("absolute inset-y-0 left-0 w-0.5 rounded-l-lg", PRIORITY_BAR[task.priority] ?? PRIORITY_BAR.low)}
        aria-hidden
      />

      <div className="pl-3 pr-3 pt-2.5 pb-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-1.5">
          <h5 className="line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-snug text-slate-900">
            {task.title}
          </h5>
          <span
            className={cn(
              "ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              statusBadgeClass(task.status),
            )}
          >
            {labelFromToken(task.status)}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              ownerBadgeClass(task.owner),
            )}
          >
            <UserRound className="h-2.5 w-2.5" aria-hidden />
            {labelFromToken(task.owner)}
          </span>
          <span className="flex items-center gap-0.5 rounded-full bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            <CalendarDays className="h-2.5 w-2.5" aria-hidden />
            {formatDate(task.deadline)}
          </span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", priorityBadgeClass(task.priority))}>
            {labelFromToken(task.priority)}
          </span>
        </div>

        {/* Status select */}
        <select
          aria-label={`Move task: ${task.title}`}
          value={task.status}
          disabled={isUpdating}
          onChange={(e) => void onStatusChange(task.id, e.target.value as TaskStatus)}
          className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:cursor-not-allowed"
        >
          {statusColumns.map((col) => (
            <option key={col.status} value={col.status}>
              {col.label}
            </option>
          ))}
        </select>
      </div>

      {/* Updating overlay */}
      {isUpdating ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70">
          <span className="text-[11px] font-semibold text-slate-500">Updating…</span>
        </div>
      ) : null}
    </article>
  );
}
