import React, { useEffect, useState } from "react";
import { Plus, Search, MapPin, User, Box, Pencil, Trash2, X, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `http://${window.location.hostname || 'localhost'}:5000`;
};
const API_URL = getApiUrl();

const FIELDS = [
  { name: "name", label: "Warehouse Name", required: true },
  { name: "code", label: "Warehouse Code", required: true },
  { name: "location", label: "Location" },
  { name: "city", label: "City", required: true },
  { name: "country", label: "Country" },
  { name: "capacity_sqm", label: "Capacity (sqm)", type: "number" },
  { name: "used_sqm", label: "Used (sqm)", type: "number" },
  { name: "manager", label: "Manager" },
  { name: "status", label: "Status", type: "select", options: ["operational", "maintenance", "full", "closed"] },
  { name: "type", label: "Type", type: "select", options: ["Dry", "Cold Storage", "Bonded", "Hazardous", "Distribution"] },
];

// --- Inline UI Components ---

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let colors = "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "operational") colors = "bg-green-50 text-green-700 border-green-200";
  if (s === "maintenance" || s === "closed") colors = "bg-amber-50 text-amber-800 border-amber-200";
  if (s === "full") colors = "bg-rose-50 text-rose-700 border-rose-200";
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${colors}`}>
      {status?.replace('_', ' ') || 'UNKNOWN'}
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
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">Delete Warehouse</button>
      </div>
    </div>
  </div>
);

const EntityFormModal = ({ title, fields, initial, onClose, onSaved }) => {
  const [formData, setFormData] = useState(initial || {});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = initial ? 'PUT' : 'POST';
      const id = initial ? (initial._id || initial.id) : '';
      const idStr = id ? `/${id}` : '';
      
      const res = await fetch(`${API_URL}/api/admin/warehouses${idStr}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(`${title} ${initial ? 'updated' : 'added'} successfully`);
        onSaved();
      } else {
        toast.error(`Failed to save ${title.toLowerCase()}`);
      }
    } catch (err) {
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{initial ? 'Edit' : 'Add'} {title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.name} className={f.name === 'name' || f.name === 'location' ? 'col-span-2' : 'col-span-1'}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    required={f.required}
                  >
                    <option value="">Select {f.label}</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    required={f.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2 shadow-sm">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save {title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function AdminWarehouses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/warehouses`, { credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.warehouses || []);
    } catch (err) {
      toast.error("Failed to fetch warehouses data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((w) => { 
    const q = query.toLowerCase(); 
    return !q || (w.name || "").toLowerCase().includes(q) || (w.city || "").toLowerCase().includes(q); 
  });

  const stats = { 
    total: items.length, 
    operational: items.filter((w) => w.status === "operational").length, 
    maintenance: items.filter((w) => w.status === "maintenance" || w.status === "closed").length 
  };

  const handleDelete = async () => {
    try {
      const id = deleting._id || deleting.id;
      await fetch(`${API_URL}/api/admin/warehouses/${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success("Warehouse deleted successfully");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error("Failed to delete warehouse");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Warehouses</div>
          <div className="text-3xl font-black font-mono text-gray-900 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Operational</div>
          <div className="text-3xl font-black font-mono text-green-600 mt-2">{stats.operational}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Maintenance / Closed</div>
          <div className="text-3xl font-black font-mono text-amber-600 mt-2">{stats.maintenance}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-300 px-4 py-2.5 w-full sm:w-80 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search warehouses by name or city..." 
            className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400" 
          />
        </div>
        <button 
          className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2" 
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-16 text-gray-500 font-sans">
            <Loader2 className="w-6 h-6 text-yellow-600 animate-spin mx-auto mb-2" />
            Loading warehouses...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-500 font-sans">
            No warehouses found matching criteria.
          </div>
        ) : (
          filtered.map((w) => {
            const usage = w.capacity_sqm ? Math.min(100, Math.round((w.used_sqm || 0) / w.capacity_sqm * 100)) : 0;
            return (
              <div key={w._id || w.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200 inline-block mb-1">{w.code}</div>
                      <h3 className="font-bold text-gray-900 text-base">{w.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={w.status} />
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100 mb-4">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" /> 
                      <span className="truncate">{w.city || "—"}, {w.country || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-gray-400 shrink-0" /> 
                      <span className="truncate">Mgr: <strong className="text-gray-900">{w.manager || "Unassigned"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Box className="w-4 h-4 text-gray-400 shrink-0" /> 
                      <span>{w.type || "Standard"} · <strong className="font-mono text-gray-900">{(w.capacity_sqm || 0).toLocaleString()} sqm</strong></span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-gray-500 uppercase tracking-wider text-[10px]">Capacity Used</span>
                    <span className="font-mono text-gray-900">{usage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      className={`h-full rounded-full transition-all ${usage > 85 ? "bg-rose-500" : usage > 60 ? "bg-amber-500" : "bg-green-500"}`} 
                      style={{ width: `${usage}%` }} 
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-gray-100">
                    <button onClick={() => { setEditing(w); setShowForm(true); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-yellow-800 transition-colors" title="Edit Warehouse">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleting(w)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors" title="Delete Warehouse">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <EntityFormModal 
          title="Warehouse" 
          fields={FIELDS} 
          initial={editing} 
          onClose={() => setShowForm(false)} 
          onSaved={() => { setShowForm(false); load(); }} 
        />
      )}
      
      {deleting && (
        <ConfirmDialog 
          message={`Are you sure you want to delete warehouse ${deleting.name}? This action cannot be undone.`} 
          onConfirm={handleDelete} 
          onClose={() => setDeleting(null)} 
        />
      )}
    </div>
  );
}