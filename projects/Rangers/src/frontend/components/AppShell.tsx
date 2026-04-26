"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Menu, Plus, RefreshCw } from "lucide-react";

import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import Modal from "@/components/Modal";
import PatientCreateForm from "@/components/PatientCreateForm";
import PatientDashboard from "@/components/PatientDashboard";
import Sidebar from "@/components/Sidebar";
import {
  createCareFlow,
  deletePatient,
  getApiError,
  getHealth,
  getPatientDashboard,
  listPatients,
  updateTaskStatus,
} from "@/lib/api";
import type { PatientDashboard as PatientDashboardType, PatientListItem, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type HealthState = "checking" | "online" | "offline";

export default function AppShell() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDashboardType | null>(null);
  const [healthState, setHealthState] = useState<HealthState>("checking");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPatientListLoading, setIsPatientListLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [error, setError] = useState("");

  const selectedPatientId = selectedPatient?.id ?? null;

  const refreshPatients = useCallback(async (silent = false) => {
    if (!silent) setIsPatientListLoading(true);
    try {
      const patientList = await listPatients();
      setPatients(patientList);
    } catch (err) {
      setError(`Backend unavailable. ${getApiError(err)}`);
    } finally {
      if (!silent) setIsPatientListLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    setHealthState("checking");
    try {
      const health = await getHealth();
      setHealthState(health.status === "ok" ? "online" : "offline");
    } catch {
      setHealthState("offline");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setIsPatientListLoading(true);
      const [healthResult, patientResult] = await Promise.allSettled([getHealth(), listPatients()]);

      if (!isMounted) return;

      if (healthResult.status === "fulfilled" && healthResult.value.status === "ok") {
        setHealthState("online");
      } else {
        setHealthState("offline");
      }

      if (patientResult.status === "fulfilled") {
        setPatients(patientResult.value);
      } else {
        setError(`Backend unavailable. ${getApiError(patientResult.reason)}`);
      }

      setIsPatientListLoading(false);
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPatient = useCallback(async (patientId: number) => {
    setError("");
    setShowCreateForm(false);
    setIsSidebarOpen(false);
    setIsDashboardLoading(true);

    try {
      const dashboard = await getPatientDashboard(patientId);
      setSelectedPatient(dashboard);
    } catch (err) {
      setError(`Unable to load patient dashboard. ${getApiError(err)}`);
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  const handleRefreshSelected = useCallback(async () => {
    if (!selectedPatientId) return;

    setError("");
    setIsDashboardLoading(true);
    try {
      const [dashboard, patientList] = await Promise.all([getPatientDashboard(selectedPatientId), listPatients()]);
      setSelectedPatient(dashboard);
      setPatients(patientList);
    } catch (err) {
      setError(`Unable to refresh patient dashboard. ${getApiError(err)}`);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [selectedPatientId]);

  const handleCreatePatient = useCallback(
    async (name: string, summary: string) => {
      setError("");
      setIsCreatingPatient(true);

      try {
        const dashboard = await createCareFlow(name, summary);
        setSelectedPatient(dashboard);
        setShowCreateForm(false);
        await refreshPatients(true);
      } catch (err) {
        setError(`Patient creation failed. ${getApiError(err)}`);
        throw err;
      } finally {
        setIsCreatingPatient(false);
      }
    },
    [refreshPatients],
  );

  const handleTaskStatusChange = useCallback(
    async (taskId: number, status: TaskStatus) => {
      if (!selectedPatient) return;

      const previousDashboard = selectedPatient;
      const existingTask = selectedPatient.tasks.find((task) => task.id === taskId);
      if (!existingTask || existingTask.status === status) return;

      setError("");
      setSelectedPatient({
        ...selectedPatient,
        tasks: selectedPatient.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
      });

      try {
        await updateTaskStatus(taskId, status);
        const [dashboard, patientList] = await Promise.all([getPatientDashboard(selectedPatient.id), listPatients()]);
        setSelectedPatient(dashboard);
        setPatients(patientList);
      } catch (err) {
        setSelectedPatient(previousDashboard);
        const message = `Task update failed. ${getApiError(err)}`;
        setError(message);
        throw new Error(message);
      }
    },
    [selectedPatient],
  );

  const handleDeleteSelectedPatient = useCallback(async () => {
    if (!selectedPatientId) return;

    setError("");
    setIsDeletingPatient(true);
    try {
      await deletePatient(selectedPatientId);
      setSelectedPatient(null);
      setShowCreateForm(false);
      await refreshPatients(true);
    } catch (err) {
      setError(`Patient deletion failed. ${getApiError(err)}`);
      throw err;
    } finally {
      setIsDeletingPatient(false);
    }
  }, [refreshPatients, selectedPatientId]);

  const headerTitle = useMemo(() => {
    if (selectedPatient) return selectedPatient.name;
    return "Care coordination workspace";
  }, [selectedPatient]);

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar
        healthState={healthState}
        isLoading={isPatientListLoading}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewPatient={() => {
          setError("");
          setShowCreateForm(true);
          setIsSidebarOpen(false);
        }}
        onRefresh={() => {
          void checkHealth();
          void refreshPatients();
        }}
        onSearchChange={setSearchQuery}
        onSelectPatient={handleSelectPatient}
        patients={patients}
        searchQuery={searchQuery}
        selectedPatientId={selectedPatientId}
      />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open patient sidebar"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden h-2 w-2 rounded-full bg-blue-600 sm:inline-block" aria-hidden />
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">CareSync AI</p>
                </div>
                <h1 className="mt-0.5 truncate text-base font-semibold text-slate-950 sm:text-lg">{headerTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void refreshPatients();
                  if (selectedPatientId) void handleRefreshSelected();
                }}
                className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:inline-flex"
              >
                <RefreshCw className={cn("h-4 w-4", isDashboardLoading && "animate-spin")} aria-hidden />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowCreateForm(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
              >
                <Plus className="h-4 w-4" aria-hidden />
                New patient
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
          {error ? (
            <div
              role="alert"
              className="mb-5 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="self-start rounded-md px-2 py-1 font-medium text-red-700 hover:bg-red-100"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {isDashboardLoading && !selectedPatient ? (
            <LoadingState title="Loading patient dashboard" description="Retrieving care plans, tasks, risk scores, and timeline events." />
          ) : selectedPatient ? (
            <PatientDashboard
              isDeleting={isDeletingPatient}
              isRefreshing={isDashboardLoading}
              onDeletePatient={handleDeleteSelectedPatient}
              onRefresh={handleRefreshSelected}
              onTaskStatusChange={handleTaskStatusChange}
              patient={selectedPatient}
            />
          ) : (
            <EmptyState
              actionLabel="Create patient"
              description="Select a patient from the risk queue or create a new patient to generate an AI-assisted care coordination workflow."
              onAction={() => setShowCreateForm(true)}
              title="No patient selected"
            />
          )}
        </div>

        {/* New patient modal */}
        <Modal
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          title="Create patient care flow"
          size="xl"
        >
          <PatientCreateForm
            isSubmitting={isCreatingPatient}
            onCancel={() => setShowCreateForm(false)}
            onCreate={handleCreatePatient}
          />
        </Modal>
      </main>
    </div>
  );
}
