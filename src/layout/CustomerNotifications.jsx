import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import EmptyState from "../components/logistics/EmptyState";

const fmtDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "Shipment Dispatched",
      message: "Your shipment TRK-9842-1054 is now in transit.",
      is_read: false,
      shipment_id: "1",
      tracking_number: "TRK-9842-1054",
      created_date: "2026-08-09T11:30:00Z"
    },
    {
      id: "n2",
      title: "Delivery Successful",
      message: "Shipment TRK-3321-8890 was successfully delivered.",
      is_read: true,
      shipment_id: "2",
      tracking_number: "TRK-3321-8890",
      created_date: "2026-08-06T15:00:00Z"
    }
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="space-y-4 font-sans">
      {notifications.length > 0 && notifications.some((n) => !n.is_read) && (
        <div className="flex justify-end">
          <button 
            onClick={markAllRead} 
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState icon={Bell} title="You're all caught up" description="No notifications yet." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {notifications.map((n) => (
            <div key={n.id} className={`px-5 py-4 flex items-start gap-3 transition-colors ${n.is_read ? "" : "bg-yellow-50/50"}`}>
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-transparent" : "bg-yellow-400"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 text-sm">{n.title}</span>
                  <span className="text-xs text-slate-400 shrink-0">{fmtDateTime(n.created_date)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                {n.tracking_number && (
                  <Link 
                    to={`/dashboard/myshipments/${n.shipment_id}`} 
                    className="text-xs font-medium text-yellow-600 hover:text-yellow-500 mt-1 inline-block transition-colors"
                  >
                    View shipment →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}