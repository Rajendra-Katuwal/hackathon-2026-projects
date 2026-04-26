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
  isDragging?: boolean;
  isUpdating: boolean;
  onStatusChange: (taskId: number, status: TaskStatus) => Promise<void>;
  task: Task;
};

const PRIORITY_BAR: Record<string, string> = {
  critical: "bg-rose-400",
  high:     "bg-orange-400",
  medium:   "bg-amber-400",
  low:      "bg-emerald-500",
};

export default function TaskCard({ isDragging = false, isUpdating, onStatusChange, task }: TaskCardProps) {
  const isOverdue = task.status === "overdue";
  const isInProgress = task.status === "in_progress";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white/95 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        isOverdue
          ? "border-rose-200 shadow-sm shadow-rose-100/70"
          : isInProgress
          ? "border-blue-200"
          : "border-slate-200/90",
        isDragging && "scale-[1.01] rotate-[0.4deg] border-blue-300 shadow-xl ring-2 ring-blue-200",
        isUpdating && "pointer-events-none opacity-60",
      )}
    >
      {/* Priority left accent */}
      <span className={cn("absolute inset-y-0 left-0 w-1", PRIORITY_BAR[task.priority] ?? PRIORITY_BAR.low)} aria-hidden />

      <div className="pl-4 pr-3.5 pt-3.5 pb-3.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h5 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-900">
            {task.title}
          </h5>
          <span
            className={cn(
              "ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
              statusBadgeClass(task.status),
            )}
          >
            {labelFromToken(task.status)}
          </span>
        </div>

        {/* Meta row */}
        {task.description ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{task.description}</p>
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              ownerBadgeClass(task.owner),
            )}
          >
            <UserRound className="h-2.5 w-2.5" aria-hidden />
            {labelFromToken(task.owner)}
          </span>
          <span className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            <CalendarDays className="h-2.5 w-2.5" aria-hidden />
            {formatDate(task.deadline)}
          </span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", priorityBadgeClass(task.priority))}>
            {labelFromToken(task.priority)}
          </span>
        </div>

        {/* Status select */}
        <label className="mt-3.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
          Status
          <select
            aria-label={`Move task: ${task.title}`}
            value={task.status}
            disabled={isUpdating}
            onChange={(e) => void onStatusChange(task.id, e.target.value as TaskStatus)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed"
          >
            {statusColumns.map((col) => (
              <option key={col.status} value={col.status}>
                {col.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Updating overlay */}
      {isUpdating ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/75 backdrop-blur-[1px]">
          <span className="text-[11px] font-medium text-slate-600">Updating...</span>
        </div>
      ) : null}
    </article>
  );
}
