import React, { useEffect, useState } from "react";
import { Plus, Search, Fuel, Gauge, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `http://${window.location.hostname || 'localhost'}:5000`;
};
const API_URL = getApiUrl();

const FIELDS = [
  { name: "registration", label: "Registration Number", required: true },
  { name: "type", label: "Type", type: "select", options: ["Truck", "Van", "Container Truck", "Refrigerated Truck", "Flatbed", "Box Truck", "Motorbike", "Semi-Trailer"], required: true },
  { name: "capacity_kg", label: "Capacity (kg)", type: "number" },
  { name: "fuel_type", label: "Fuel Type", type: "select", options: ["Diesel", "Petrol", "Electric", "Hybrid"] },
  { name: "status", label: "Status", type: "select", options: ["active", "maintenance", "idle", "retired"] },
  { name: "current_location", label: "Current Location" },
  { name: "mileage_km", label: "Mileage (km)", type: "number" },
  { name: "insurance_expiry", label: "Insurance Expiry", type: "date" },
  { name: "last_service", label: "Last Service Date", type: "date" },
];

// --- Inline UI Components ---

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let colors = "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "active") colors = "bg-green-50 text-green-700 border-green-200";
  if (s === "maintenance" || s === "retired") colors = "bg-amber-50 text-amber-800 border-amber-200";
  if (s === "idle") colors = "bg-yellow-50 text-yellow-800 border-yellow-200";
  
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
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">Delete Vehicle</button>
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
      
      const res = await fetch(`${API_URL}/api/admin/vehicles${idStr}`, {
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
              <div key={f.name} className={f.name === 'registration' || f.name === 'current_location' ? 'col-span-2' : 'col-span-1'}>
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

export default function AdminVehicles() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/vehicles`, { credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.vehicles || []);
    } catch (err) {
      toast.error("Failed to fetch fleet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((v) => { 
    const q = query.toLowerCase(); 
    return !q || (v.registration || "").toLowerCase().includes(q) || (v.type || "").toLowerCase().includes(q); 
  });

  const stats = { 
    total: items.length, 
    active: items.filter((v) => v.status === "active").length, 
    maintenance: items.filter((v) => v.status === "maintenance").length 
  };

  const handleDelete = async () => {
    try {
      const id = deleting._id || deleting.id;
      await fetch(`${API_URL}/api/admin/vehicles/${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success("Vehicle deleted successfully");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error("Failed to delete vehicle");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Fleet</div>
          <div className="text-3xl font-black font-mono text-gray-900 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active</div>
          <div className="text-3xl font-black font-mono text-green-600 mt-2">{stats.active}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">In Maintenance</div>
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
            placeholder="Search by registration or type..." 
            className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400" 
          />
        </div>
        <button 
          className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2" 
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          <Plus className="w-4 h-4" /> Register Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50/50 text-[10px] uppercase font-bold tracking-wider">
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Fuel</th>
              <th className="px-4 py-3">Mileage</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-500">Loading fleet data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-500">No vehicles found matching criteria.</td></tr>
            ) : (
              filtered.map((v) => (
                <tr key={v._id || v.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-gray-900">{v.registration}</td>
                  <td className="px-4 py-3.5 text-gray-600 font-medium">{v.type}</td>
                  <td className="px-4 py-3.5 text-gray-600 font-mono text-xs">{(v.capacity_kg || 0).toLocaleString()} kg</td>
                  <td className="px-4 py-3.5 text-gray-600"><span className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-yellow-600" /> {v.fuel_type || "—"}</span></td>
                  <td className="px-4 py-3.5 text-gray-600"><span className="flex items-center gap-1.5 font-mono text-xs"><Gauge className="w-3.5 h-3.5 text-yellow-600" /> {((v.mileage_km || 0) / 1000).toFixed(0)}k km</span></td>
                  <td className="px-4 py-3.5 text-gray-600 text-xs">{v.current_location || "—"}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditing(v); setShowForm(true); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-yellow-800 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleting(v)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <EntityFormModal 
          title="Vehicle" 
          fields={FIELDS} 
          initial={editing} 
          onClose={() => setShowForm(false)} 
          onSaved={() => { setShowForm(false); load(); }} 
        />
      )}
      
      {deleting && (
        <ConfirmDialog 
          message={`Are you sure you want to delete vehicle ${deleting.registration}? This action cannot be undone.`} 
          onConfirm={handleDelete} 
          onClose={() => setDeleting(null)} 
        />
      )}
    </div>
  );
}