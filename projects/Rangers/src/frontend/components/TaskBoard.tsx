"use client";

import {
  DragOverlay,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Columns3, MoveRight } from "lucide-react";
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
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<TaskStatus | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 140,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeTask = useMemo(() => tasks.find((task) => task.id === activeTaskId) ?? null, [tasks, activeTaskId]);

  const statusLabels = useMemo(
    () =>
      statusColumns.reduce(
        (labels, column) => {
          labels[column.status] = column.label;
          return labels;
        },
        {} as Record<TaskStatus, string>,
      ),
    [],
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

  function resolveDropStatus(rawId: string | null | undefined): TaskStatus | null {
    if (!rawId) return null;
    if (validStatuses.has(rawId as TaskStatus)) return rawId as TaskStatus;
    if (rawId.startsWith("column-")) {
      const columnStatus = rawId.replace("column-", "") as TaskStatus;
      return validStatuses.has(columnStatus) ? columnStatus : null;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = event.active.data.current?.taskId as number | undefined;
    if (!taskId) return;
    setBoardError("");
    setActiveTaskId(taskId);
  }

  function handleDragOver(event: DragOverEvent) {
    const nextStatus = resolveDropStatus((event.over?.id as string | undefined) ?? null);
    setHoveredStatus(nextStatus);
  }

  function handleDragCancel() {
    setActiveTaskId(null);
    setHoveredStatus(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = event.active.data.current?.taskId as number | undefined;
    const currentStatus = event.active.data.current?.status as TaskStatus | undefined;
    const nextStatus = resolveDropStatus((event.over?.id as string | undefined) ?? null);

    setActiveTaskId(null);
    setHoveredStatus(null);

    if (!taskId || !nextStatus || nextStatus === currentStatus) return;

    await moveTask(taskId, nextStatus);
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/30 p-5 shadow-[0_8px_30px_-16px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
            <Columns3 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-950">Task board</h3>
            <p className="text-sm text-slate-500">Manage care coordination flow with drag-and-drop updates</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">{tasks.length} tasks</span>
      </div>

      {boardError ? (
        <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          <p>{boardError}</p>
        </div>
      ) : null}

      {tasks.length ? (
        <DndContext
          collisionDetection={closestCorners}
          sensors={sensors}
          onDragCancel={handleDragCancel}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <p className="mt-3 text-xs font-medium text-slate-500">
            {activeTask && hoveredStatus
              ? `Release to move "${activeTask.title}" to ${statusLabels[hoveredStatus]}.`
              : "Drag cards between columns or use each card's status selector."}
          </p>
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="grid min-w-[940px] grid-cols-4 gap-4">
              {statusColumns.map((column) => (
                <TaskColumn
                  column={column}
                  isActiveDropZone={hoveredStatus === column.status}
                  isDraggingTask={activeTaskId !== null}
                  key={column.status}
                  tasks={groupedTasks[column.status]}
                >
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

          <DragOverlay>
            {activeTask ? (
              <div className="w-[280px] max-w-[80vw] rotate-1 drop-shadow-2xl">
                <TaskCard isDragging isUpdating={false} onStatusChange={moveTask} task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-inner">
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
  isActiveDropZone: boolean;
  isDraggingTask: boolean;
  tasks: Task[];
};

function TaskColumn({ children, column, isActiveDropZone, isDraggingTask, tasks }: TaskColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.status}`,
  });

  const columnAccent: Record<string, string> = {
    pending:     "border-t-slate-400",
    in_progress: "border-t-blue-500",
    completed:   "border-t-emerald-500",
    overdue:     "border-t-rose-400",
  };

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[440px] flex-col rounded-2xl border border-t-4 bg-white/85 backdrop-blur-sm transition duration-200",
        columnAccent[column.status] ?? "border-t-slate-300",
        statusColumnClass(column.status),
        isDraggingTask && "scale-[0.995]",
        (isOver || isActiveDropZone) && "-translate-y-0.5 bg-white ring-2 ring-blue-300/80",
      )}
    >
      {/* Column header */}
      <div className="flex min-h-16 items-start justify-between gap-2 border-b border-slate-200/70 px-3.5 pt-3 pb-2.5">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">{column.label}</h4>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{column.description}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">{tasks.length}</span>
      </div>

      {/* Scrollable card list */}
      <div className="max-h-[58vh] flex-1 overflow-y-auto px-3.5 py-3">
        {isDraggingTask ? (
          <div
            className={cn(
              "mb-2 flex items-center justify-between rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-medium",
              isActiveDropZone
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-slate-50 text-slate-500",
            )}
          >
            <span>{isActiveDropZone ? "Release to drop" : "Drop task here"}</span>
            {isActiveDropZone ? <MoveRight className="h-3.5 w-3.5" aria-hidden /> : null}
          </div>
        ) : null}
        <div className="min-h-24 space-y-2.5">{children}</div>
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
    disabled: isUpdating,
    data: {
      status: task.status,
      taskId: task.id,
    },
  });

  const style = {
    opacity: isDragging ? 0.2 : 1,
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 140ms ease",
  };

  return (
    <div
      ref={setNodeRef}
      className="touch-none cursor-grab active:cursor-grabbing"
      style={style}
      {...listeners}
      {...attributes}
    >
      <TaskCard isDragging={isDragging} isUpdating={isUpdating} onStatusChange={onStatusChange} task={task} />
    </div>
  );
}
