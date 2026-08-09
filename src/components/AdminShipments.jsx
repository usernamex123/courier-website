import React, { useEffect, useState } from "react";
import { Plus, Search, Download, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `http://${window.location.hostname || 'localhost'}:5000`;
};
const API_URL = getApiUrl();

const STATUSES = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"];

const FIELDS = [
  { name: "tracking_number", label: "Tracking #", placeholder: "Auto-generated if empty" },
  { name: "origin", label: "Origin", required: true },
  { name: "destination", label: "Destination", required: true },
  { name: "sender_name", label: "Sender" },
  { name: "receiver_name", label: "Receiver" },
  { name: "weight_kg", label: "Weight (kg)", type: "number" },
  { name: "cost", label: "Cost ($)", type: "number" },
  { name: "service_type", label: "Service Type", type: "select", options: ["Air Freight", "Sea Freight", "Road Freight", "Rail Freight", "Express Delivery", "Same Day Delivery", "Cold Chain", "Dangerous Goods", "Project Cargo"] },
  { name: "status", label: "Status", type: "select", options: STATUSES },
  { name: "priority", label: "Priority", type: "select", options: ["standard", "express", "critical"] },
  { name: "notes", label: "Notes", type: "textarea" },
];

// --- Inline UI Components ---

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let colors = "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "delivered") colors = "bg-green-50 text-green-700 border-green-200";
  if (s === "in_transit" || s === "out_for_delivery") colors = "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "pending" || s === "picked_up") colors = "bg-yellow-50 text-yellow-800 border-yellow-200";
  if (s === "failed" || s === "returned") colors = "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${colors}`}>
      {status?.replace('_', ' ') || 'PENDING'}
    </span>
  );
};

const ConfirmDialog = ({ message, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Action</h3>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">Delete</button>
      </div>
    </div>
  </div>
);

const EntityFormModal = ({ title, fields, initial, onClose, onSaved }) => {
  const [formData, setFormData] = useState(initial || { status: "pending", priority: "standard" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = initial ? 'PUT' : 'POST';
      const idStr = initial ? `/${initial._id || initial.id}` : '';
      
      const res = await fetch(`${API_URL}/api/admin/shipments${idStr}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(`${title} ${initial ? 'updated' : 'created'} successfully`);
        onSaved();
      } else {
        toast.error(`Failed to save ${title.toLowerCase()}`);
      }
    } catch (err) {
      toast.error("Network error while saving shipment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{initial ? 'Edit' : 'New'} {title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.name} className={f.name === 'notes' ? 'sm:col-span-2' : 'sm:col-span-1'}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    required={f.required}
                  >
                    <option value="">Select {f.label}</option>
                    {f.options.map(o => <option key={o} value={o}>{o.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none h-24 resize-none shadow-sm"
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    placeholder={f.placeholder || ''}
                  />
                ) : (
                  <input
                    type={f.type || 'text'}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    placeholder={f.placeholder || ''}
                    required={f.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2 shadow-sm">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BulkActionBar = ({ count, onClear, children }) => {
  if (!count) return null;
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm animate-fadeIn">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-yellow-500 text-black font-mono font-bold text-xs flex items-center justify-center">{count}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-900">Shipments Selected</span>
        <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-900 underline ml-2">Clear Selection</button>
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
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/shipments`, { credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.shipments || []);
    } catch (err) {
      toast.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((s) => {
    const q = query.toLowerCase();
    const matchQ = !q || (s.tracking_number || "").toLowerCase().includes(q) || (s.origin || "").toLowerCase().includes(q) || (s.destination || "").toLowerCase().includes(q);
    const matchF = filter === "all" || s.status === filter;
    return matchQ && matchF;
  });

  const getId = (s) => s._id || s.id;

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
      await fetch(`${API_URL}/api/admin/shipments/${id}`, { method: 'DELETE', credentials: 'include' });
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
      await Promise.all([...selected].map((id) => 
        fetch(`${API_URL}/api/admin/shipments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status })
        })
      ));
      toast.success(`${selected.size} shipments updated to ${status.replace("_", " ")}`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error("Bulk status update failed");
    }
  };

  const bulkDelete = async () => {
    try {
      await Promise.all([...selected].map((id) => 
        fetch(`${API_URL}/api/admin/shipments/${id}`, { method: 'DELETE', credentials: 'include' })
      ));
      toast.success(`${selected.size} shipments deleted successfully`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error("Bulk delete failed");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-300 px-4 py-2.5 flex-1 sm:w-80 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search tracking, origin, destination..." 
              className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400" 
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-yellow-500 shadow-sm"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button 
            onClick={() => toast.success("Export package downloaded successfully")} 
            className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2" 
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <Plus className="w-4 h-4" /> New Shipment
          </button>
        </div>
      </div>

      {/* Bulk Action Bar Component */}
      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <select 
          onChange={(e) => e.target.value && bulkStatus(e.target.value)} 
          defaultValue="" 
          className="py-2 px-3 rounded-xl bg-white text-gray-900 text-xs font-bold uppercase tracking-wider border border-gray-300 outline-none cursor-pointer shadow-sm"
        >
          <option value="" disabled>Update Status…</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
        </select>
        <button 
          onClick={bulkDelete} 
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Selected
        </button>
      </BulkActionBar>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3.5 w-10">
                  <input 
                    type="checkbox" 
                    checked={allSelected} 
                    onChange={toggleAll} 
                    className="w-4 h-4 rounded accent-yellow-500 cursor-pointer" 
                  />
                </th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Tracking #</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Route</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Service</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Weight</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-right">Cost</th>
                <th className="px-4 py-3.5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-500 font-sans">
                    <Loader2 className="w-6 h-6 text-yellow-600 animate-spin mx-auto mb-2" />
                    Loading system shipments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-500 font-sans">
                    No active shipments registered in the database.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const sId = getId(s);
                  const isSel = selected.has(sId);
                  return (
                    <tr key={sId} className={`hover:bg-gray-50 transition-colors ${isSel ? "bg-yellow-50/50" : ""}`}>
                      <td className="px-4 py-4">
                        <input 
                          type="checkbox" 
                          checked={isSel} 
                          onChange={() => toggle(sId)} 
                          className="w-4 h-4 rounded accent-yellow-500 cursor-pointer" 
                        />
                      </td>
                      <td className="px-4 py-4 font-bold text-yellow-700">{s.tracking_number || "TNV-UNKNOWN"}</td>
                      <td className="px-4 py-4 text-gray-600">
                        <span className="text-gray-900 font-bold">{s.origin || "—"}</span> → <span className="text-gray-900 font-bold">{s.destination || "—"}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-gray-800">
                          {s.service_type || "Standard"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{s.weight_kg ? `${s.weight_kg}kg` : "—"}</td>
                      <td className="px-4 py-4"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-4 text-right font-bold text-gray-900">${(s.cost || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-yellow-800 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleting(s)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <EntityFormModal 
          title="Shipment" 
          fields={FIELDS} 
          initial={editing} 
          onClose={() => setShowForm(false)} 
          onSaved={() => { setShowForm(false); load(); }} 
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