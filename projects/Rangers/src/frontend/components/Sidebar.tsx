"use client";

import { Activity, Circle, Plus, RefreshCw, Search, ShieldCheck, Wifi, WifiOff, X } from "lucide-react";

import type { PatientListItem } from "@/lib/types";
import { cn, riskBadgeClass, sortPatientsByRisk } from "@/lib/utils";

type SidebarProps = {
  healthState: "checking" | "online" | "offline";
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onNewPatient: () => void;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onSelectPatient: (patientId: number) => void;
  patients: PatientListItem[];
  searchQuery: string;
  selectedPatientId: number | null;
};

export default function Sidebar({
  healthState,
  isLoading,
  isOpen,
  onClose,
  onNewPatient,
  onRefresh,
  onSearchChange,
  onSelectPatient,
  patients,
  searchQuery,
  selectedPatientId,
}: SidebarProps) {
  const filteredPatients = sortPatientsByRisk(patients).filter((patient) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return patient.name.toLowerCase().includes(query) || patient.summary_preview.toLowerCase().includes(query);
  });

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close patient sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-88 lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">CareSync AI</h2>
                <p className="text-sm text-slate-500">Care coordination dashboard</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                healthState === "online" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                healthState === "offline" && "border-red-200 bg-red-50 text-red-700",
                healthState === "checking" && "border-slate-200 bg-slate-100 text-slate-600",
              )}
            >
              {healthState === "online" ? <Wifi className="h-4 w-4" aria-hidden /> : null}
              {healthState === "offline" ? <WifiOff className="h-4 w-4" aria-hidden /> : null}
              {healthState === "checking" ? <Circle className="h-4 w-4" aria-hidden /> : null}
              {healthState === "online" ? "API online" : healthState === "offline" ? "API unavailable" : "Checking API"}
            </div>
            <button
              type="button"
              aria-label="Refresh patients and API status"
              onClick={onRefresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewPatient}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New patient
          </button>

          <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="patient-search">
            Patient search
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="patient-search"
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by name or summary"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Risk queue</p>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-600">
              {filteredPatients.length}
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Loading patients...</div>
          ) : filteredPatients.length ? (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => onSelectPatient(patient.id)}
                  className={cn(
                    "w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40",
                    selectedPatientId === patient.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{patient.name}</p>
                      <p className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-slate-500">{patient.summary_preview || "No summary preview"}</p>
                    </div>
                    <span
                      className={cn(
                        "flex-none rounded-full border px-2.5 py-1 text-sm font-semibold",
                        riskBadgeClass(patient.risk?.level),
                      )}
                    >
                      {patient.risk ? patient.risk.level : "NO RISK"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <TaskCount label="Total" value={patient.task_counts.total} />
                    <TaskCount label="Pending" value={patient.task_counts.pending} />
                    <TaskCount label="Active" value={patient.task_counts.in_progress} />
                    <TaskCount label="Overdue" value={patient.task_counts.overdue} tone={patient.task_counts.overdue ? "red" : "slate"} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <Activity className="mx-auto h-6 w-6 text-slate-400" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-slate-700">No patients found</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">Create a patient or adjust the search query.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function TaskCount({ label, tone = "slate", value }: { label: string; tone?: "slate" | "red"; value: number }) {
  return (
    <span className={cn("rounded-md px-2 py-1.5", tone === "red" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600")}>
      <span className="block text-sm font-semibold">{value}</span>
      <span className="block text-[11px] font-medium">{label}</span>
    </span>
  );
}
