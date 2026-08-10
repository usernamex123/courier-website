import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Package, Plus, ArrowRight } from "lucide-react";
import ShipmentStatusBadge from "../components/logistics/ShipmentStatusBadge";
import EmptyState from "../components/logistics/EmptyState";

const STATUS_LABELS = {
  created: "Created",
  confirmed: "Confirmed",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  at_destination_facility: "At Destination",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const fmtMoney = (val) => `$${Number(val || 0).toFixed(2)}`;
const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function MyShipments() {
  const [shipments] = useState([
    {
      id: "1",
      tracking_number: "TRK-9842-1054",
      shipment_number: "SH-1001",
      origin: "Damak",
      destination: "Kathmandu",
      service_type: "Standard Express",
      current_status: "in_transit",
      price: 14.50,
      recipient_name: "John Doe",
      created_date: "2026-08-06T10:00:00Z"
    },
    {
      id: "2",
      tracking_number: "TRK-3321-8890",
      shipment_number: "SH-1002",
      origin: "Damak",
      destination: "Pokhara",
      service_type: "Next Day",
      current_status: "delivered",
      price: 9.62,
      recipient_name: "Jane Smith",
      created_date: "2026-08-02T14:30:00Z"
    },
    {
      id: "3",
      tracking_number: "TRK-1120-4432",
      shipment_number: "SH-1003",
      origin: "Damak",
      destination: "Biratnagar",
      service_type: "Economy",
      current_status: "delivered",
      price: 8.00,
      recipient_name: "Ram Thapa",
      created_date: "2026-07-28T09:15:00Z"
    },
    {
      id: "4",
      tracking_number: "TRK-7765-2219",
      shipment_number: "SH-1004",
      origin: "Damak",
      destination: "Lalitpur",
      service_type: "Standard Express",
      current_status: "created",
      price: 16.20,
      recipient_name: "Sita Sharma",
      created_date: "2026-08-09T16:45:00Z"
    }
  ]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const filtered = shipments.filter((s) => {
    const matchQ = !q || (
      (s.tracking_number || "") + 
      (s.shipment_number || "") + 
      (s.origin || "") + 
      (s.destination || "") + 
      (s.recipient_name || "")
    ).toLowerCase().includes(q.toLowerCase());
    const matchS = !status || s.current_status === status;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search tracking, origin, recipient…" 
            className="flex-1 py-2.5 text-sm outline-none bg-transparent" 
          />
        </div>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)} 
          className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm shadow-sm outline-none"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_LABELS).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <Link 
          to="/dashboard/create" 
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-300 whitespace-nowrap shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState 
            icon={Package} 
            title="No shipments found" 
            description={q || status ? "No shipments match your search." : "You don't have any shipments yet."} 
            action={
              <Link 
                to="/dashboard/create" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-300 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Shipment
              </Link>
            } 
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Tracking #</th>
                  <th className="text-left px-4 py-3 font-semibold">Route</th>
                  <th className="text-left px-4 py-3 font-semibold">Service</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Price</th>
                  <th className="text-left px-4 py-3 font-semibold">Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{s.tracking_number}</td>
                    <td className="px-4 py-3 text-slate-600">{s.origin} → {s.destination}</td>
                    <td className="px-4 py-3 text-slate-600">{s.service_type}</td>
                    <td className="px-4 py-3"><ShipmentStatusBadge status={s.current_status} /></td>
                    <td className="px-4 py-3 font-medium text-slate-800 font-mono">{fmtMoney(s.price)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(s.created_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/dashboard/myshipments/${s.id}`} className="inline-flex p-1 text-yellow-600 hover:text-yellow-500 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((s) => (
              <Link 
                key={s.id} 
                to={`/dashboard/myshipments/${s.id}`} 
                className="block bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-900 text-sm">{s.tracking_number}</span>
                  <ShipmentStatusBadge status={s.current_status} />
                </div>
                <div className="text-xs text-slate-500 mt-1">{s.origin} → {s.destination}</div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-sm">
                  <span className="text-xs text-slate-400">{fmtDate(s.created_date)}</span>
                  <span className="font-medium font-mono text-slate-900">{fmtMoney(s.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}