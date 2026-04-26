"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Columns3 } from "lucide-react";
import { useMemo, useState } from "react";

import TaskCard from "@/components/TaskCard";
import type { Task, TaskStatus } from "@/lib/types";
import { cn, statusColumnClass, statusColumns } from "@/lib/utils";

type TaskBoardProps = {
  onTaskStatusChange: (taskId: number, status: TaskStatus) => Promise<void>;
  tasks: Task[];
};

const validStatuses = new Set<TaskStatus>(["pending", "in_progress", "completed", "overdue"]);

export default function TaskBoard({ onTaskStatusChange, tasks }: TaskBoardProps) {
  const [boardError, setBoardError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const groupedTasks = useMemo(() => {
    return statusColumns.reduce(
      (groups, column) => {
        groups[column.status] = tasks.filter((task) => task.status === column.status);
        return groups;
      },
      {} as Record<TaskStatus, Task[]>,
    );
  }, [tasks]);

  async function moveTask(taskId: number, status: TaskStatus) {
    setBoardError("");
    setUpdatingTaskId(taskId);
    try {
      await onTaskStatusChange(taskId, status);
    } catch (err) {
      setBoardError(err instanceof Error ? err.message : "Task update failed. Please try again.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = event.active.data.current?.taskId as number | undefined;
    const currentStatus = event.active.data.current?.status as TaskStatus | undefined;
    const nextStatus = event.over?.id as TaskStatus | undefined;

    if (!taskId || !nextStatus || !validStatuses.has(nextStatus) || nextStatus === currentStatus) return;

    await moveTask(taskId, nextStatus);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Columns3 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">Task board</h3>
            <p className="text-sm text-slate-500">Move tasks across care coordination workflow statuses</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">{tasks.length} tasks</span>
      </div>

      {boardError ? (
        <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          <p>{boardError}</p>
        </div>
      ) : null}

      {tasks.length ? (
        <DndContext
          sensors={sensors}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <p className="mt-2 text-xs text-slate-400">Drag cards between columns, or use the status selector on a card.</p>
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="grid min-w-[920px] grid-cols-4 gap-3">
              {statusColumns.map((column) => (
                <TaskColumn column={column} key={column.status} tasks={groupedTasks[column.status]}>
                  {groupedTasks[column.status].map((task) => (
                    <DraggableTaskCard
                      isUpdating={updatingTaskId === task.id}
                      key={task.id}
                      onStatusChange={moveTask}
                      task={task}
                    />
                  ))}
                </TaskColumn>
              ))}
            </div>
          </div>
        </DndContext>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">No care coordination tasks available.</p>
          <p className="mt-1 text-xs text-slate-400">Tasks are auto-generated from the care plan.</p>
        </div>
      )}
    </section>
  );
}

type TaskColumnProps = {
  children: React.ReactNode;
  column: (typeof statusColumns)[number];
  tasks: Task[];
};

function TaskColumn({ children, column, tasks }: TaskColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.status,
  });

  const columnAccent: Record<string, string> = {
    pending:     "border-t-slate-400",
    in_progress: "border-t-blue-500",
    completed:   "border-t-emerald-500",
    overdue:     "border-t-red-500",
  };

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[420px] flex-col rounded-xl border-2 border-t-4 transition",
        columnAccent[column.status] ?? "border-t-slate-300",
        statusColumnClass(column.status),
        isOver && "ring-2 ring-blue-300",
      )}
    >
      {/* Column header */}
      <div className="flex min-h-16 items-start justify-between gap-2 px-3 pt-3 pb-2">
        <div className="min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">{column.label}</h4>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{column.description}</p>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm">{tasks.length}</span>
      </div>

      {/* Scrollable card list */}
      <div className="max-h-[58vh] flex-1 overflow-y-auto px-3 pb-3">
        <div className="min-h-24 space-y-2">{children}</div>
      </div>
    </section>
  );
}

type DraggableTaskCardProps = {
  isUpdating: boolean;
  onStatusChange: (taskId: number, status: TaskStatus) => Promise<void>;
  task: Task;
};

function DraggableTaskCard({ isUpdating, onStatusChange, task }: DraggableTaskCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: `task-${task.id}`,
    data: {
      status: task.status,
      taskId: task.id,
    },
  });

  const style = {
    opacity: isDragging ? 0.55 : 1,
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard isUpdating={isUpdating} onStatusChange={onStatusChange} task={task} />
    </div>
  );
}
