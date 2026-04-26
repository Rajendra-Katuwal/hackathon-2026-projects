import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  accent: "blue" | "green" | "red" | "slate";
  icon: ReactNode;
  label: string;
  value: number | string;
};

const accentClass = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-700",
};

export default function StatCard({ accent, icon, label, value }: StatCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accentClass[accent])}>{icon}</span>
      </div>
    </article>
  );
}
