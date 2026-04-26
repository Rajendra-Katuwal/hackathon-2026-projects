"use client";

import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node } from "reactflow";
import { GitBranch } from "lucide-react";
import { useMemo } from "react";

import type { CareGraphData } from "@/lib/types";

type CareGraphProps = {
  graph: CareGraphData | null;
};

export default function CareGraph({ graph }: CareGraphProps) {
  const nodes = useMemo(() => (graph?.nodes ?? []) as Node[], [graph?.nodes]);
  const edges = useMemo(() => (graph?.edges ?? []) as Edge[], [graph?.edges]);
  const hasGraph = nodes.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <GitBranch className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold text-slate-950">Care graph</h3>
          <p className="text-sm text-slate-500">Patient, owner, task, and status relationships</p>
        </div>
      </div>

      <div className="mt-5 h-105 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {hasGraph ? (
          <ReactFlow
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodes={nodes}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#cbd5e1" gap={18} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
            No graph data is available for this patient.
          </div>
        )}
      </div>
    </section>
  );
}
