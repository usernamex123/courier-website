import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, CheckCircle2, Clock, Plus, Bell, ArrowRight } from "lucide-react";
import KpiCard from "../components/logistics/KpiCard";
import EmptyState from "../components/logistics/EmptyState";
import ShipmentStatusBadge from "../components/logistics/ShipmentStatusBadge";

export default function UserDashboard() {
  // Local mock data configured for seamless execution without external backend services
  const [shipments] = useState([
    {
      id: "1",
      tracking_number: "TRK-9842-1054",
      origin: "Damak",
      destination: "Kathmandu",
      current_status: "in_transit",
      price: 14.50,
      created_date: "2026-08-06T10:00:00Z"
    },
    {
      id: "2",
      tracking_number: "TRK-3321-8890",
      origin: "Damak",
      destination: "Pokhara",
      current_status: "delivered",
      price: 9.62,
      created_date: "2026-08-02T14:30:00Z"
    },
    {
      id: "3",
      tracking_number: "TRK-1120-4432",
      origin: "Damak",
      destination: "Biratnagar",
      current_status: "delivered",
      price: 8.00,
      created_date: "2026-07-28T09:15:00Z"
    },
    {
      id: "4",
      tracking_number: "TRK-7765-2219",
      origin: "Damak",
      destination: "Lalitpur",
      current_status: "created",
      price: 16.20,
      created_date: "2026-08-09T16:45:00Z"
    }
  ]);

  const [notifications] = useState([
    {
      id: "n1",
      title: "Shipment Dispatched",
      message: "Your shipment TRK-9842-1054 is now in transit.",
      created_date: "2026-08-09T11:30:00Z"
    },
    {
      id: "n2",
      title: "Delivery Successful",
      message: "Shipment TRK-3321-8890 was successfully delivered.",
      created_date: "2026-08-06T15:00:00Z"
    }
  ]);

  const fmtMoney = (val) => `$${Number(val || 0).toFixed(2)}`;
  const fmtDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const inTransit = shipments.filter((s) => 
    ["in_transit", "out_for_delivery", "at_destination_facility", "picked_up"].includes(s.current_status)
  ).length;
  
  const delivered = shipments.filter((s) => s.current_status === "delivered").length;
  
  const pending = shipments.filter((s) => 
    ["created", "confirmed", "pickup_scheduled"].includes(s.current_status)
  ).length;
  
  const recent = shipments.slice(0, 5);

  return (
    <div className="space-y-6 font-sans">
      
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Total Shipments" value={shipments.length} accent="black" />
        <KpiCard icon={Clock} label="Pending" value={pending} accent="yellow" />
        <KpiCard icon={Truck} label="In Transit" value={inTransit} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Delivered" value={delivered} accent="green" />
      </div>

      {/* Main Grid: Recent Shipments & Notifications */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Recent Shipments Section */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-slate-900">Recent Shipments</h2>
              <Link 
                to="/dashboard/myshipments" 
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                View All
              </Link>
            </div>
            <Link 
              to="/dashboard/create" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-yellow-600 hover:text-yellow-500 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Shipment
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState 
              icon={Package} 
              title="No shipments yet" 
              description="Create your first shipment to get started." 
              action={
                <Link 
                  to="/dashboard/create" 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-300 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create Shipment
                </Link>
              } 
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((s) => (
                <Link 
                  key={s.id} 
                  to={`/dashboard/myshipments/${s.id}`} 
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="font-mono font-semibold text-sm text-slate-900">{s.tracking_number}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {s.origin || "Damak"} → {s.destination || "Damak"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <ShipmentStatusBadge status={s.current_status} />
                    <span className="text-sm font-medium text-slate-700 hidden sm:block font-mono">
                      {fmtMoney(s.price)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              <h2 className="font-bold text-slate-900">Notifications</h2>
            </div>
            <Link 
              to="/dashboard/notifications" 
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              View All
            </Link>
          </div>

          {notifications.length === 0 ? (
            <EmptyState 
              icon={Bell} 
              title="You're all caught up" 
              description="No notifications yet." 
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div key={n.id} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="text-sm font-medium text-slate-800">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{fmtDate(n.created_date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}