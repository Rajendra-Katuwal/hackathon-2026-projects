import type { CSSProperties } from "react";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskOwner = "doctor" | "lab" | "patient" | "nurse" | "specialist";

export type HealthResponse = {
  status: "ok" | string;
  service: string;
  version: string;
};

export type PatientListItem = {
  id: number;
  name: string;
  summary_preview: string;
  created_at: string;
  risk: {
    score: number;
    level: RiskLevel;
  } | null;
  task_counts: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
};

export type Task = {
  id: number;
  care_plan: number;
  title: string;
  description: string;
  owner: TaskOwner;
  priority: TaskPriority;
  deadline: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type RiskScore = {
  id: number;
  score: number;
  level: RiskLevel;
  reasoning: string;
  created_at: string;
};

export type CarePlan = {
  id: number;
  content: string;
  tasks: Task[];
  created_at: string;
  updated_at: string;
};

export type TimelineEvent = {
  id: number;
  event_type: string;
  timestamp: string;
  description: string;
};

export type Alert = {
  type: string;
  task_id: number;
  message: string;
};

export type ReactFlowNode = {
  id: string;
  type?: string;
  data: {
    label: string;
    owner?: TaskOwner | string;
    status?: TaskStatus | string;
    priority?: TaskPriority | string;
  };
  position: {
    x: number;
    y: number;
  };
  style?: CSSProperties;
};

export type ReactFlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: CSSProperties;
};

export type CareGraphData = {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
};

export type PatientDashboard = {
  id: number;
  name: string;
  summary: string;
  created_at: string;
  care_plans: CarePlan[];
  risk_scores: RiskScore[];
  timeline_events: TimelineEvent[];
  tasks: Task[];
  latest_risk: RiskScore | null;
  latest_care_plan: CarePlan | null;
  care_graph: CareGraphData | null;
  alerts: Alert[];
};

export type RagResponse = {
  question: string;
  answer: string;
  patient_id: number | string | null;
};
