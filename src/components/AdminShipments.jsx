import React, { useEffect, useState } from "react";
import { Plus, Search, Download, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";
import EntityFormModal, { STATUSES, SERVICES, PAYMENTS } from "./AdminShipments1";
import ShipmentsDetail from "./ShipmentsDetail";

// --- Inline UI Components ---

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let colors = "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "delivered") colors = "bg-green-50 text-green-700 border-green-200";
  if (s === "in_transit" || s === "out_for_delivery") colors = "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "pending" || s === "picked_up" || s === "created") colors = "bg-gray-100 text-gray-800 border-gray-200";
  if (s === "failed" || s === "returned") colors = "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] uppercase font-bold tracking-wider border ${colors}`}>
      {status?.replace('_', ' ') || 'CREATED'}
    </span>
  );
};

const ConfirmDialog = ({ message, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
      <h3 className="text-base font-bold text-gray-900 mb-2">Confirm Action</h3>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">Delete</button>
      </div>
    </div>
  </div>
);

const BulkActionBar = ({ count, onClear, children }) => {
  if (!count) return null;
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm animate-fadeIn">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-yellow-500 text-black font-sans font-bold text-xs flex items-center justify-center">{count}</span>
        <span className="text-sm font-bold uppercase tracking-wider text-gray-900">Shipments Selected</span>
        <button onClick={onClear} className="text-sm text-gray-500 hover:text-gray-900 underline ml-2 cursor-pointer">Clear Selection</button>
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );
};

// --- Main Component ---

export default function AdminShipments() {
  const [items, setItems] = useState([]);
  const [invoicesMap, setInvoicesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);

      // Fetch invoice numbers to map shipment_id -> invoice_number cleanly
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('shipment_id, invoice_number');
      
      if (!invError && invData) {
        const map = {};
        invData.forEach((inv) => {
          if (inv.shipment_id) {
            map[inv.shipment_id] = inv.invoice_number;
          }
        });
        setInvoicesMap(map);
      }
    } catch (err) {
      console.error("Error loading shipments:", err);
      toast.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-shipments-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = items.filter((s) => {
    const q = query.toLowerCase();
    const invNum = (invoicesMap[s.id] || "").toLowerCase();
    const matchQ = !q || 
      (s.tracking_number || "").toLowerCase().includes(q) || 
      invNum.includes(q) ||
      (s.origin || "").toLowerCase().includes(q) || 
      (s.destination || "").toLowerCase().includes(q) || 
      (s.recipient_name || "").toLowerCase().includes(q) ||
      (s.sender_name || "").toLowerCase().includes(q);
    
    const matchStatus = statusFilter === "all" || (s.current_status || "").toLowerCase() === statusFilter.toLowerCase();
    const matchService = serviceFilter === "all" || (s.service_type || "").toLowerCase() === serviceFilter.toLowerCase();
    const matchPayment = paymentFilter === "all" || (s.payment_status || "").toLowerCase() === paymentFilter.toLowerCase();

    return matchQ && matchStatus && matchService && matchPayment;
  });

  const getId = (s) => s.id;

  const toggle = (id) => setSelected((p) => { 
    const n = new Set(p); 
    if (n.has(id)) n.delete(id); 
    else n.add(id); 
    return n; 
  });

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(getId(s)));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((s) => getId(s))));

  const handleDelete = async () => {
    try {
      const id = getId(deleting);
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) throw error;
      toast.success("Shipment deleted successfully");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error("Failed to delete shipment");
    }
  };

  const bulkStatus = async (status) => {
    if (!selected.size) return;
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ current_status: status })
        .in('id', [...selected]);
      if (error) throw error;
      toast.success(`${selected.size} shipments updated to ${status.replace("_", " ")}`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error("Bulk status update failed");
    }
  };

  const bulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('shipments')
        .delete()
        .in('id', [...selected]);
      if (error) throw error;
      toast.success(`${selected.size} shipments deleted successfully`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error("Bulk delete failed");
    }
  };

  const exportCsv = () => {
    const rows = [["Tracking", "Invoice #", "Customer", "Route", "Service", "Status", "Payment", "Price", "Created"]];
    filtered.forEach((s) => rows.push([
      s.tracking_number, 
      invoicesMap[s.id] || "",
      s.recipient_name,
      `${s.origin} -> ${s.destination}`, 
      s.service_type, 
      s.current_status, 
      s.payment_status,
      s.price, 
      s.created_at
    ]));
    const csv = rows.map((r) => r.map((c) => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = "shipments.csv"; 
    a.click(); 
    URL.revokeObjectURL(url);
    toast.success("Shipments exported successfully");
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn font-sans">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-300 px-3.5 py-2.5 flex-1 shadow-sm">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search tracking, invoice #, customer, route..." 
              className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400" 
            />
          </div>

          <div className="flex items-center gap-3 shrink-0 justify-end">
            <button 
              onClick={exportCsv} 
              className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button 
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer" 
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-yellow-500 shadow-sm cursor-pointer font-medium w-full"
          >
            <option value="all">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
          </select>

          <select 
            value={serviceFilter} 
            onChange={(e) => setServiceFilter(e.target.value)} 
            className="bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-yellow-500 shadow-sm cursor-pointer font-medium w-full"
          >
            <option value="all">All Services</option>
            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)} 
            className="bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-yellow-500 shadow-sm cursor-pointer font-medium w-full"
          >
            <option value="all">All Payments</option>
            {PAYMENTS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <select 
          onChange={(e) => e.target.value && bulkStatus(e.target.value)} 
          defaultValue="" 
          className="py-2.5 px-3.5 rounded-xl bg-white text-gray-900 text-sm font-bold uppercase tracking-wider border border-gray-300 outline-none cursor-pointer shadow-sm"
        >
          <option value="" disabled>Update Status…</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
        </select>
        <button 
          onClick={bulkDelete} 
          className="flex items-center gap-2 py-2.5 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Delete Selected
        </button>
      </BulkActionBar>

      {/* ========================================= */}
      {/* 1. MOBILE CARD VIEW */}
      {/* ========================================= */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200">
            <Loader2 className="w-6 h-6 text-yellow-600 animate-spin mx-auto mb-2" />
            Loading shipments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200">
            No active shipments registered in the database.
          </div>
        ) : (
          filtered.map((s) => {
            const sId = getId(s);
            const isSel = selected.has(sId);
            const invoiceNum = invoicesMap[sId];
            const formattedDate = s.created_at 
              ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : "—";
            const routeText = `${s.origin || "—"} → ${s.destination || "—"}`;

            return (
              <div 
                key={sId}
                className={`bg-white border rounded-2xl p-4 shadow-sm transition-all relative ${isSel ? "border-yellow-500 bg-yellow-50/30" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={isSel} 
                      onChange={() => toggle(sId)} 
                      className="w-4 h-4 rounded accent-yellow-500 cursor-pointer" 
                    />
                    <div className="flex flex-col">
                      <span 
                        onClick={() => { setEditing(s); setShowForm(true); }}
                        className="font-bold text-gray-900 text-sm cursor-pointer hover:underline"
                      >
                        {s.tracking_number || "—"}
                      </span>
                      {invoiceNum && (
                        <span className="text-[11px] font-mono text-gray-500 font-medium">
                          {invoiceNum}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={s.current_status} />
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-4 border-t border-b border-gray-100 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Customer</span>
                    <span className="font-semibold text-gray-800">{s.recipient_name || s.client_name || "Customer"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Route</span>
                    <span className="font-medium text-gray-800 truncate max-w-[200px]" title={routeText}>{routeText}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Service / Pay</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{s.service_type || "Standard"}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${s.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100/60 text-amber-800'}`}>
                        {s.payment_status || 'unpaid'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Created</span>
                    <span className="text-gray-500">{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-sm font-black text-gray-900">
                    ${Number(s.price || 0).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewingDetail(s)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    <button 
                      onClick={() => { setEditing(s); setShowForm(true); }}
                      className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================= */}
      {/* 2. DESKTOP TABLE VIEW */}
      {/* ========================================= */}
      <div className="hidden md:block w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
              <th className="px-3.5 py-4 w-10">
                <input 
                  type="checkbox" 
                  checked={allSelected} 
                  onChange={toggleAll} 
                  className="w-4 h-4 rounded accent-yellow-500 cursor-pointer" 
                />
              </th>
              <th className="px-3.5 py-4 font-bold uppercase tracking-wider text-xs w-[14%]">Tracking / Invoice</th>
              <th className="px-3.5 py-4 font-bold uppercase tracking-wider text-xs w-[13%]">Customer</th>
              <th className="px-3.5 py-4 font-bold uppercase tracking-wider text-xs w-[18%]">Route</th>
              <th className="px-3.5 py-4 font-bold uppercase tracking-wider text-xs w-[10%]">Service</th>
              <th className="px-3.5 py-4 font-bold uppercase tracking-wider text-xs w-[11%]">Status</th>
              <th className="px-3.5 py-4 font-bold uppercase tracking-wider text-xs w-[10%]">Payment</th>
              <th className="px-3.5 py-4 font-bold uppercase tracking-wider text-xs text-right w-[9%]">Price</th>
              <th className="px-3.5 py-4 font-bold uppercase tracking-wider text-xs w-[10%]">Created</th>
              <th className="px-3.5 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-20 text-gray-500">
                  <Loader2 className="w-6 h-6 text-yellow-600 animate-spin mx-auto mb-2" />
                  Loading system shipments...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-20 text-gray-500">
                  No active shipments registered in the database.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const sId = getId(s);
                const isSel = selected.has(sId);
                const invoiceNum = invoicesMap[sId];
                const formattedDate = s.created_at 
                  ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : "—";
                const routeText = `${s.origin || "—"} → ${s.destination || "—"}`;

                return (
                  <tr 
                    key={sId} 
                    className={`hover:bg-gray-50/80 transition-colors group ${isSel ? "bg-yellow-50/50" : ""}`}
                  >
                    <td className="px-3.5 py-4.5" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSel} 
                        onChange={() => toggle(sId)} 
                        className="w-4 h-4 rounded accent-yellow-500 cursor-pointer" 
                      />
                    </td>
                    <td 
                      className="px-3.5 py-4.5 truncate cursor-pointer" 
                      onClick={() => { setEditing(s); setShowForm(true); }}
                      title="Click to edit"
                    >
                      <div className="font-semibold text-gray-900 hover:underline">
                        {s.tracking_number || "—"}
                      </div>
                      {invoiceNum && (
                        <div className="text-[11px] font-mono text-gray-500 font-medium mt-0.5">
                          {invoiceNum}
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-4.5 text-gray-700 font-medium truncate" title={s.recipient_name || s.client_name || "Customer"}>
                      {s.recipient_name || s.client_name || "Customer"}
                    </td>
                    <td className="px-3.5 py-4.5 text-gray-600 truncate" title={routeText}>
                      {routeText}
                    </td>
                    <td className="px-3.5 py-4.5 text-gray-700 font-medium truncate" title={s.service_type || "Standard"}>
                      {s.service_type || "Standard"}
                    </td>
                    <td className="px-3.5 py-4.5 truncate">
                      <StatusBadge status={s.current_status} />
                    </td>
                    <td className="px-3.5 py-4.5 truncate">
                      <span className={`text-[11px] uppercase font-bold px-2 py-0.5 rounded ${s.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100/60 text-amber-800'}`}>
                        {s.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-3.5 py-4.5 text-right font-semibold text-gray-900 truncate">
                      ${Number(s.price || 0).toFixed(2)}
                    </td>
                    <td className="px-3.5 py-4.5 text-gray-500 text-xs truncate" title={formattedDate}>
                      {formattedDate}
                    </td>
                    <td 
                      className="px-3.5 py-4.5 text-right cursor-pointer"
                      onClick={() => setViewingDetail(s)}
                    >
                      <div className="text-amber-600 group-hover:translate-x-0.5 transition-transform flex justify-end items-center w-full h-full">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <EntityFormModal 
          title="Shipment" 
          initial={editing} 
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }} 
          onSaved={() => { 
            setShowForm(false); 
            setEditing(null);
            load(); 
          }} 
        />
      )}

      {viewingDetail && (
        <ShipmentsDetail 
          shipment={viewingDetail} 
          onClose={() => setViewingDetail(null)} 
          onUpdate={(updatedShipment) => {
            setItems((prev) => prev.map((s) => s.id === updatedShipment.id ? updatedShipment : s));
            setViewingDetail(updatedShipment);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog 
          message={`Are you sure you want to delete shipment ${deleting.tracking_number}? This operation is permanent.`} 
          onConfirm={handleDelete} 
          onClose={() => setDeleting(null)} 
        />
      )}
    </div>
  );
}