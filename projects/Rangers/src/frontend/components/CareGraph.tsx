"use client";

import { GitBranch, User } from "lucide-react";
import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";

import type { CareGraphData } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { badge: string; border: string; dot: string; text: string }> = {
  pending:     { border: "border-slate-200",   badge: "bg-slate-100 text-slate-600",     dot: "bg-slate-400",    text: "Pending" },
  in_progress: { border: "border-blue-300",    badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500",     text: "In Progress" },
  completed:   { border: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500",  text: "Done" },
  overdue:     { border: "border-red-300",     badge: "bg-red-100 text-red-700",         dot: "bg-red-500",      text: "Overdue" },
};

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-400",
  medium:   "bg-amber-400",
  low:      "bg-emerald-500",
};

const OWNER_BADGE: Record<string, string> = {
  doctor:     "bg-indigo-100 text-indigo-700",
  nurse:      "bg-teal-100 text-teal-700",
  lab:        "bg-cyan-100 text-cyan-700",
  specialist: "bg-violet-100 text-violet-700",
  patient:    "bg-slate-100 text-slate-600",
};

// ─── Custom node: patient (root) ──────────────────────────────────────────────
function PatientNode({ data }: NodeProps) {
  return (
    <div className="flex min-w-[160px] flex-col items-center gap-1.5 rounded-2xl border-2 border-indigo-400 bg-indigo-600 px-5 py-3.5 text-center shadow-lg">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white">
        <User className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold leading-snug text-white">{data.label as string}</p>
      <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-200">Patient</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-indigo-300 !bg-indigo-200"
      />
    </div>
  );
}

// ─── Custom node: task ────────────────────────────────────────────────────────
function TaskNode({ data }: NodeProps) {
  const status = (data.status as string | undefined) ?? "pending";
  const priority = (data.priority as string | undefined) ?? "low";
  const owner = (data.owner as string | undefined) ?? "nurse";
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;

  return (
    <div
      className={cn(
        "min-w-[175px] max-w-[200px] rounded-xl border-2 bg-white shadow-sm",
        cfg.border,
        status === "overdue" && "shadow-red-100",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-300 !bg-slate-200"
      />

      <div className="p-3">
        {/* Title */}
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">
          {data.label as string}
        </p>

        {/* Status + owner badges */}
        <div className="mt-2 flex flex-wrap gap-1">
          <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", cfg.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
            {cfg.text}
          </span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", OWNER_BADGE[owner] ?? OWNER_BADGE.nurse)}>
            {owner}
          </span>
        </div>

        {/* Priority */}
        <div className="mt-1.5 flex items-center gap-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[priority] ?? PRIORITY_DOT.low)} />
          <span className="text-[10px] font-medium capitalize text-slate-500">{priority}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-300 !bg-slate-200"
      />
    </div>
  );
}

// ─── Module-level constants (React Flow warning #002 prevention) ──────────────
const nodeTypes = {
  input:   PatientNode,  // backend emits type:"input" for patient node
  default: TaskNode,     // task nodes have no type → falls back to "default"
};
const edgeTypes = {};

// ─── Component ────────────────────────────────────────────────────────────────
type CareGraphProps = {
  graph: CareGraphData | null;
};

export default function CareGraph({ graph }: CareGraphProps) {
  const nodes = useMemo(
    () =>
      (graph?.nodes ?? []).map((n) => ({
        ...n,
        style: undefined, // let custom node components handle styling
      })) as Node[],
    [graph?.nodes],
  );

  const edges = useMemo(
    () =>
      (graph?.edges ?? []).map((e) => ({
        ...e,
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        labelStyle: { fontSize: 10, fill: "#64748b", fontWeight: 600 },
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9 },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: "#94a3b8" },
      })) as Edge[],
    [graph?.edges],
  );

  const hasGraph = nodes.length > 0;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <GitBranch className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold text-slate-950">Care dependency graph</h3>
          <p className="text-sm text-slate-500">
            {hasGraph
              ? `${nodes.length - 1} task node${nodes.length - 1 !== 1 ? "s" : ""} · drag or scroll to explore`
              : "No graph data yet"}
          </p>
        </div>
      </div>

      <div className="h-[500px] bg-slate-50">
        {hasGraph ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e2e8f0" gap={20} size={1} />
            <MiniMap
              pannable
              zoomable
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              nodeColor={(n) => {
                if (n.type === "input") return "#6366f1";
                const s = n.data?.status as string;
                if (s === "overdue") return "#ef4444";
                if (s === "in_progress") return "#3b82f6";
                if (s === "completed") return "#10b981";
                return "#94a3b8";
              }}
            />
            <Controls
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            />
          </ReactFlow>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <GitBranch className="h-10 w-10 text-slate-300" aria-hidden />
            <p className="text-sm font-medium text-slate-400">
              Generate a care plan to see the dependency graph.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
