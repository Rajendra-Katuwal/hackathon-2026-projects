import axios, { AxiosError } from "axios";

import type {
  HealthResponse,
  PatientDashboard,
  PatientListItem,
  RagResponse,
  Task,
  TaskStatus,
} from "@/lib/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60_000,
});

type ApiErrorBody = {
  error?: string;
  detail?: string;
  message?: string;
};

export function getApiError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.data?.error) return error.response.data.error;
    if (error.response?.data?.detail) return error.response.data.detail;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.code === AxiosError.ERR_NETWORK) {
      return "Backend unavailable. Confirm the Django API is running at http://localhost:8000.";
    }
    if (error.code === "ECONNABORTED") {
      return "The request took too long. Please try again.";
    }
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>("/api/health/");
  return response.data;
}

export async function listPatients(): Promise<PatientListItem[]> {
  const response = await api.get<PatientListItem[]>("/api/patients/");
  return response.data;
}

export async function createCareFlow(name: string, summary: string): Promise<PatientDashboard> {
  const response = await api.post<PatientDashboard>("/api/care/create/", { name, summary }, { timeout: 180_000 });
  return response.data;
}

export async function getPatientDashboard(patientId: number | string): Promise<PatientDashboard> {
  const response = await api.get<PatientDashboard>(`/api/patient/${patientId}/`);
  return response.data;
}

export async function deletePatient(patientId: number | string): Promise<void> {
  await api.delete(`/api/patient/${patientId}/`);
}

export async function updateTaskStatus(taskId: number | string, status: TaskStatus): Promise<Task> {
  const response = await api.post<Task>("/api/task/update/", { task_id: taskId, status });
  return response.data;
}

export async function queryRag(patientId: number | string, question: string): Promise<RagResponse> {
  const response = await api.post<RagResponse>("/api/rag/query/", { patient_id: patientId, question }, { timeout: 180_000 });
  return response.data;
}
