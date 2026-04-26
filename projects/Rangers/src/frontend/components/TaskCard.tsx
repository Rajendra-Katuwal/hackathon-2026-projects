"use client";

import { CalendarDays, GripVertical, UserRound } from "lucide-react";

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

export default function TaskCard({ isUpdating, onStatusChange, task }: TaskCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <GripVertical className="mt-1 h-5 w-5 flex-none text-slate-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-2.5 py-1 text-sm font-semibold", statusBadgeClass(task.status))}>
              {labelFromToken(task.status)}
            </span>
            <span className={cn("rounded-full border px-2.5 py-1 text-sm font-semibold", priorityBadgeClass(task.priority))}>
              {labelFromToken(task.priority)}
            </span>
          </div>

          <h5 className="mt-3 font-semibold leading-6 text-slate-950">{task.title}</h5>
          {task.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold", ownerBadgeClass(task.owner))}>
              <UserRound className="h-3.5 w-3.5" aria-hidden />
              {labelFromToken(task.owner)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-600">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {formatDate(task.deadline)}
            </span>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor={`task-status-${task.id}`}>
            Move task
            <select
              id={`task-status-${task.id}`}
              value={task.status}
              disabled={isUpdating}
              onChange={(event) => {
                void onStatusChange(task.id, event.target.value as TaskStatus);
              }}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            >
              {statusColumns.map((column) => (
                <option key={column.status} value={column.status}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </article>
  );
}
