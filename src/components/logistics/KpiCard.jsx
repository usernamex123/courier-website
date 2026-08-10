import React from "react";
import { cn } from "../../lib/utils";

export default function KpiCard({ icon: Icon, label, value, sub, accent = "yellow" }) {
  const accents = {
    yellow: "bg-yellow-400 text-black",
    black: "bg-black text-white",
    blue: "bg-blue-500 text-white",
    green: "bg-green-500 text-white",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-500 text-white"
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", accents[accent])}>
        {Icon ? <Icon className="w-6 h-6" /> : null}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}