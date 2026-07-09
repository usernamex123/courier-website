import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");

  // Fallback array prevents "Cannot read properties of undefined (reading 'filter')"
  const shipments = user?.shipments || [
    { id: "SS-9482", destination: "Kathmandu, NP", status: "In Transit", date: "2026-07-08", weight: "12kg" },
    { id: "SS-1049", destination: "Lalitpur, NP", status: "Delivered", date: "2026-07-05", weight: "2.5kg" },
    { id: "SS-3321", destination: "Pokhara, NP", status: "Pending", date: "2026-07-07", weight: "45kg" },
  ];

  // Safe filtration pass
  const filteredShipments = shipments.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-28 px-5 md:px-8 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Branding Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Command Center</h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, <span className="text-blue-400 font-semibold">{user?.name || "Operator"}</span>. Managing active delivery pipelines.
            </p>
          </div>
          <button 
            onClick={() => navigate("/shipping")}
            className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/10"
          >
            <Plus size={16} />
            <span>New Order</span>
          </button>
        </div>

        {/* Quick Analytical Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl backdrop-blur-sm">
            <div className="text-slate-500 mb-2"><Package size={20} /></div>
            <div className="text-2xl font-black">{shipments.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total Bookings</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl backdrop-blur-sm">
            <div className="text-blue-400 mb-2"><Clock size={20} /></div>
            <div className="text-2xl font-black">
              {shipments.filter(s => s.status === "In Transit").length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Moving Lanes</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl backdrop-blur-sm">
            <div className="text-green-400 mb-2"><CheckCircle2 size={20} /></div>
            <div className="text-2xl font-black">
              {shipments.filter(s => s.status === "Delivered").length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Success Drops</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl backdrop-blur-sm">
            <div className="text-amber-400 mb-2"><AlertTriangle size={20} /></div>
            <div className="text-2xl font-black">
              {shipments.filter(s => s.status === "Pending").length}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Holds</div>
          </div>
        </div>

        {/* Filters and Datagrid Ledger */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-slate-900/60 no-scrollbar">
            {["all", "pending", "in transit", "delivered"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  filterStatus === tab 
                    ? "bg-slate-900 text-blue-400 border border-slate-800" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Shipments Listing Table */}
          <div className="overflow-x-auto">
            {filteredShipments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm font-medium">
                No active delivery nodes matched this layout state.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="pb-3">Tracking ID</th>
                    <th className="pb-3">Destination</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Weight</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-sm text-slate-300 font-medium">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="group hover:bg-slate-900/10">
                      <td className="py-4 text-white font-mono text-xs">{shipment.id}</td>
                      <td className="py-4">{shipment.destination}</td>
                      <td className="py-4 text-slate-400 text-xs">{shipment.date}</td>
                      <td className="py-4 text-slate-400 text-xs">{shipment.weight}</td>
                      <td className="py-4 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          shipment.status === "Delivered" ? "bg-green-500/10 text-green-400 border border-green-500/10" :
                          shipment.status === "In Transit" ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                        }`}>
                          {shipment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;