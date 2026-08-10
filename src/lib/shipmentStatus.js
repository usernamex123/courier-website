// Frontend shipment status helpers (display only). Mirrors backend shared/shipment.ts labels.

export const STATUS_LABELS = {
    created: "Created",
    confirmed: "Confirmed",
    pickup_scheduled: "Pickup Scheduled",
    picked_up: "Picked Up",
    at_origin_facility: "At Origin Facility",
    in_transit: "In Transit",
    at_destination_facility: "At Destination Facility",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    delayed: "Delayed",
    failed_delivery: "Failed Delivery",
    cancelled: "Cancelled",
    returned: "Returned",
    damaged: "Damaged",
    lost: "Lost"
  };
  
  export const SHIPMENT_STATUSES = [
    "created", "confirmed", "pickup_scheduled", "picked_up", "at_origin_facility",
    "in_transit", "at_destination_facility", "out_for_delivery", "delivered",
    "delayed", "failed_delivery", "cancelled", "returned", "damaged", "lost"
  ];
  
  export const FLOW_ORDER = [
    "created", "confirmed", "pickup_scheduled", "picked_up", "at_origin_facility",
    "in_transit", "at_destination_facility", "out_for_delivery", "delivered"
  ];
  
  export const EXCEPTION_STATUSES = ["delayed", "failed_delivery", "cancelled", "returned", "damaged", "lost"];
  export const TERMINAL_STATUSES = ["delivered", "cancelled", "returned", "lost"];
  
  export const SERVICE_TYPES = ["Standard", "Express", "Priority"];
  export const PACKAGE_TYPES = ["Box", "Envelope", "Pallet", "Tube", "Poly Bag", "Crate", "Custom"];
  
  // Tailwind class strings (literal so the purge keeps them).
  export const STATUS_STYLES = {
    created: "bg-slate-100 text-slate-700",
    confirmed: "bg-blue-100 text-blue-700",
    pickup_scheduled: "bg-indigo-100 text-indigo-700",
    picked_up: "bg-cyan-100 text-cyan-700",
    at_origin_facility: "bg-sky-100 text-sky-700",
    in_transit: "bg-amber-100 text-amber-700",
    at_destination_facility: "bg-violet-100 text-violet-700",
    out_for_delivery: "bg-yellow-100 text-yellow-800",
    delivered: "bg-green-100 text-green-700",
    delayed: "bg-orange-100 text-orange-700",
    failed_delivery: "bg-rose-100 text-rose-700",
    cancelled: "bg-slate-200 text-slate-600",
    returned: "bg-gray-200 text-gray-700",
    damaged: "bg-red-100 text-red-700",
    lost: "bg-red-200 text-red-800"
  };
  
  export const PAYMENT_STYLES = {
    unpaid: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-rose-100 text-rose-700",
    refunded: "bg-slate-200 text-slate-600"
  };
  
  export function label(status) {
    return STATUS_LABELS[status] || (status || "unknown").replace(/_/g, " ");
  }
  
  export function fmtMoney(n, currency = "USD") {
    const v = Number(n) || 0;
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(v);
  }
  
  export function fmtDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "—"; }
  }
  
  export function fmtDateTime(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch { return "—"; }
  }
  
  // Progress percentage for the happy-path timeline (0-100).
  export function flowProgress(status) {
    const idx = FLOW_ORDER.indexOf(status);
    if (idx === -1) return null; // exception status
    return Math.round(((idx + 1) / FLOW_ORDER.length) * 100);
  }