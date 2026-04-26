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
  const filteredPatients = sortPatientsByRisk(patients).filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.summary_preview.toLowerCase().includes(q);
  });

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close patient sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(21rem,calc(100vw-2rem))] flex-col bg-slate-900 transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-80 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ── Brand header ─────────────────────────────────────── */}
        <div className="flex-none border-b border-white/10 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold text-white">CareSync AI</p>
                <p className="text-xs text-slate-400">Care coordination</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {/* API status + refresh */}
          <div className="mt-4 flex items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                healthState === "online" ? "bg-emerald-500/20 text-emerald-400" :
                healthState === "offline" ? "bg-red-500/20 text-red-400" :
                "bg-white/10 text-slate-400",
              )}
            >
              {healthState === "online" ? <Wifi className="h-3.5 w-3.5" aria-hidden /> : null}
              {healthState === "offline" ? <WifiOff className="h-3.5 w-3.5" aria-hidden /> : null}
              {healthState === "checking" ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden /> : null}
              {healthState === "online" ? "API online" : healthState === "offline" ? "API offline" : "Checking…"}
            </div>
            <button
              type="button"
              aria-label="Refresh patients and API status"
              onClick={onRefresh}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} aria-hidden />
            </button>
          </div>

          {/* New patient CTA */}
          <button
            type="button"
            onClick={onNewPatient}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New patient
          </button>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              id="patient-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search patients…"
              className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:bg-white/15 focus:outline-none"
            />
          </div>
        </div>

        {/* ── Patient risk queue ────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk queue</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-400">
              {filteredPatients.length}
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-xl bg-white/5 p-4 text-center text-sm text-slate-500">Loading patients…</div>
          ) : filteredPatients.length ? (
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => onSelectPatient(patient.id)}
                  className={cn(
                    "group w-full rounded-xl border p-3 text-left transition",
                    selectedPatientId === patient.id
                      ? "border-blue-500 bg-blue-600/25 shadow-sm"
                      : patient.risk?.level === "HIGH"
                      ? "border-red-500/30 bg-red-500/10 hover:bg-red-500/15"
                      : "border-white/8 bg-white/5 hover:bg-white/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{patient.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{patient.summary_preview || "No summary"}</p>
                    </div>
                    {patient.risk ? (
                      <span
                        className={cn(
                          "flex-none rounded-full px-2 py-0.5 text-xs font-bold",
                          patient.risk.level === "HIGH"
                            ? "bg-red-500 text-white"
                            : patient.risk.level === "MEDIUM"
                            ? "bg-amber-400 text-amber-900"
                            : "bg-emerald-500 text-white",
                        )}
                      >
                        {patient.risk.score}
                      </span>
                    ) : null}
                  </div>

                  {/* Task status pills */}
                  {patient.task_counts.total > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {patient.task_counts.overdue > 0 ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
                          {patient.task_counts.overdue} overdue
                        </span>
                      ) : null}
                      {patient.task_counts.in_progress > 0 ? (
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                          {patient.task_counts.in_progress} active
                        </span>
                      ) : null}
                      {patient.task_counts.pending > 0 ? (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                          {patient.task_counts.pending} pending
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 p-6 text-center">
              <Activity className="mx-auto h-8 w-8 text-slate-700" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-slate-400">No patients found</p>
              <p className="mt-1 text-xs text-slate-600">
                {searchQuery ? "Adjust your search." : "Create a patient to get started."}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
