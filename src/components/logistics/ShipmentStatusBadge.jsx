import React from "react";
import { cn } from "../../lib/utils";
import { STATUS_STYLES, label } from "../../lib/shipmentStatus";

export default function ShipmentStatusBadge({ status, className }) {
  const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-700";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap", cls, className)}>
      {label(status)}
    </span>
  );
}