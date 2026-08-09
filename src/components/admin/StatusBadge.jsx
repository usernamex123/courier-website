import React from "react";
import { cn } from "../../utils/utils.js";

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  picked_up: { label: "Picked Up", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  in_transit: { label: "In Transit", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  out_for_delivery: { label: "Out for Delivery", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  delivered: { label: "Delivered", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  failed: { label: "Failed", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  returned: { label: "Returned", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-500" },
  delayed: { label: "Delayed", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  inactive: { label: "Inactive", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" },
  available: { label: "Available", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  on_delivery: { label: "On Delivery", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  offline: { label: "Offline", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" },
};

export default function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || {
    label: status ? status.replace(/_/g, " ") : "Unknown",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      <span className="capitalize">{config.label}</span>
    </span>
  );
}