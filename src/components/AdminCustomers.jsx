import React, { useEffect, useState } from "react";
import { Plus, Search, Mail, Phone, Building2, Pencil, Trash2, X, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `http://${window.location.hostname || 'localhost'}:5000`;
};
const API_URL = getApiUrl();

const INDUSTRIES = ["E-commerce", "Manufacturing", "Healthcare", "Pharmaceuticals", "Agriculture", "Automotive", "Retail", "FMCG", "Electronics", "Construction", "Government", "Oil & Gas", "Mining", "Textile", "Food & Beverage"];

const FIELDS = [
  { name: "company_name", label: "Company Name", required: true },
  { name: "contact_name", label: "Contact Name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone" },
  { name: "address", label: "Address" },
  { name: "city", label: "City" },
  { name: "country", label: "Country" },
  { name: "industry", label: "Industry", type: "select", options: INDUSTRIES },
  { name: "tier", label: "Tier", type: "select", options: ["Bronze", "Silver", "Gold", "Platinum"] },
  { name: "status", label: "Status", type: "select", options: ["active", "inactive", "pending"] },
  { name: "credit_limit", label: "Credit Limit ($)", type: "number" },
  { name: "total_revenue", label: "Total Revenue ($)", type: "number" },
  { name: "total_shipments", label: "Total Shipments", type: "number" },
];

const tierColors = { 
  Bronze: "bg-amber-50 text-amber-800 border-amber-200", 
  Silver: "bg-gray-100 text-gray-800 border-gray-200", 
  Gold: "bg-yellow-50 text-yellow-800 border-yellow-200", 
  Platinum: "bg-purple-50 text-purple-800 border-purple-200" 
};

// --- Inline UI Components ---

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let colors = "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "active") colors = "bg-green-50 text-green-700 border-green-200";
  if (s === "pending") colors = "bg-yellow-50 text-yellow-800 border-yellow-200";
  if (s === "inactive") colors = "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${colors}`}>
      {status || 'ACTIVE'}
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
  const [formData, setFormData] = useState(initial || { status: "active", tier: "Silver" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = initial ? 'PUT' : 'POST';
      const idStr = initial ? `/${initial._id || initial.id}` : '';
      
      const res = await fetch(`${API_URL}/api/admin/customers${idStr}`, {
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
      toast.error("Network error while saving customer");
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
              <div key={f.name} className={f.name === 'address' ? 'sm:col-span-2' : 'sm:col-span-1'}>
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
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function AdminCustomers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/customers`, { credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.customers || []);
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((c) => {
    const q = query.toLowerCase();
    return !q || (c.company_name || "").toLowerCase().includes(q) || (c.contact_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const getId = (c) => c._id || c.id;

  const handleDelete = async () => {
    try {
      const id = getId(deleting);
      await fetch(`${API_URL}/api/admin/customers/${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success("Customer deleted successfully");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-300 px-4 py-2.5 flex-1 sm:w-80 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search customers..." 
            className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400" 
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toast.success("Customers exported successfully")} 
            className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2" 
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-16 text-gray-500 font-sans">
            <Loader2 className="w-6 h-6 text-yellow-600 animate-spin mx-auto mb-2" />
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-500 font-sans">
            No customers registered in the database.
          </div>
        ) : (
          filtered.map((c) => {
            const cId = getId(c);
            return (
              <div key={cId} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-bold text-yellow-700">
                      {(c.company_name || "C")[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{c.company_name}</h3>
                      <p className="text-xs text-gray-500">{c.contact_name}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${tierColors[c.tier] || tierColors.Silver}`}>
                    {c.tier || "Silver"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {c.email}</div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone || "—"}</div>
                  <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-gray-400" /> {c.industry || "General"} · {c.city || "—"}</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-base font-bold text-gray-900">{c.total_shipments || 0}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Shipments</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">${(c.total_revenue || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Revenue</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-yellow-800 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleting(c)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <EntityFormModal 
          title="Customer" 
          fields={FIELDS} 
          initial={editing} 
          onClose={() => setShowForm(false)} 
          onSaved={() => { setShowForm(false); load(); }} 
        />
      )}

      {deleting && (
        <ConfirmDialog 
          message={`Are you sure you want to delete customer ${deleting.company_name}? This operation is permanent.`} 
          onConfirm={handleDelete} 
          onClose={() => setDeleting(null)} 
        />
      )}
    </div>
  );
}