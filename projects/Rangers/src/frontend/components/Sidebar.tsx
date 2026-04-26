"use client";

import { Activity, AlertTriangle, Plus, RefreshCw, Search, ShieldCheck, Wifi, WifiOff, X } from "lucide-react";

import type { PatientListItem } from "@/lib/types";
import { cn, sortPatientsByRisk } from "@/lib/utils";

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
    return !query || patient.name.toLowerCase().includes(query) || patient.summary_preview.toLowerCase().includes(query);
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
          "fixed inset-y-0 left-0 z-50 flex w-[min(21rem,calc(100vw-2rem))] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-80 lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex-none border-b border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-base font-semibold text-slate-950">CareSync AI</p>
                <p className="text-xs font-medium text-slate-500">Care coordination</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                healthState === "online" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                healthState === "offline" && "border-red-200 bg-red-50 text-red-700",
                healthState === "checking" && "border-slate-200 bg-slate-50 text-slate-500",
              )}
            >
              {healthState === "online" ? <Wifi className="h-3.5 w-3.5" aria-hidden /> : null}
              {healthState === "offline" ? <WifiOff className="h-3.5 w-3.5" aria-hidden /> : null}
              {healthState === "checking" ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden /> : null}
              {healthState === "online" ? "API online" : healthState === "offline" ? "API offline" : "Checking..."}
            </div>
            <button
              type="button"
              aria-label="Refresh patients and API status"
              onClick={onRefresh}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewPatient}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New patient
          </button>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="patient-search"
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search patients..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-3 py-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Risk queue</p>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
              {filteredPatients.length}
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
              Loading patients...
            </div>
          ) : filteredPatients.length ? (
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => onSelectPatient(patient.id)}
                  className={cn(
                    "group w-full rounded-xl border bg-white p-3 text-left shadow-sm transition",
                    selectedPatientId === patient.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                      : patient.risk?.level === "HIGH"
                        ? "border-red-200 hover:border-red-300 hover:bg-red-50/60"
                        : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{patient.name}</p>
                      <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">{patient.summary_preview || "No summary"}</p>
                    </div>
                    {patient.risk ? (
                      <span
                        className={cn(
                          "flex-none rounded-full px-2 py-0.5 text-xs font-semibold",
                          patient.risk.level === "HIGH" && "bg-red-100 text-red-700",
                          patient.risk.level === "MEDIUM" && "bg-amber-100 text-amber-700",
                          patient.risk.level === "LOW" && "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {patient.risk.score}
                      </span>
                    ) : null}
                  </div>

                  {patient.task_counts.total > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {patient.task_counts.overdue > 0 ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
                          {patient.task_counts.overdue} overdue
                        </span>
                      ) : null}
                      {patient.task_counts.in_progress > 0 ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {patient.task_counts.in_progress} active
                        </span>
                      ) : null}
                      {patient.task_counts.pending > 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {patient.task_counts.pending} pending
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
              <Activity className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
              <p className="mt-3 text-sm font-medium text-slate-700">No patients found</p>
              <p className="mt-1 text-xs text-slate-500">
                {searchQuery ? "Adjust your search." : "Create a patient to get started."}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
