import React, { useEffect, useState, useMemo } from "react";
import {
  Plus, Search, MapPin, User, Box, Pencil, Trash2, Warehouse as WarehouseIcon,
  Snowflake, Lock, AlertTriangle, Truck, Building2, Gauge, TrendingUp, Layers, X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'https://courier-backend-5f6r.onrender.com';

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

const TYPE_ICONS = {
  Dry: Box,
  "Cold Storage": Snowflake,
  Bonded: Lock,
  Hazardous: AlertTriangle,
  Distribution: Truck,
};

const TYPE_COLORS = {
  Dry: "bg-slate-100 text-slate-600",
  "Cold Storage": "bg-sky-100 text-sky-600",
  Bonded: "bg-violet-100 text-violet-600",
  Hazardous: "bg-rose-100 text-rose-600",
  Distribution: "bg-amber-100 text-amber-600",
};

const STATUS_FILTERS = ["all", "operational", "maintenance", "full", "closed"];
const TYPE_FILTERS = ["all", "Dry", "Cold Storage", "Bonded", "Hazardous", "Distribution"];

function StatCard({ icon: Icon, label, value, sub, accent }) {
  const accents = {
    navy: "bg-slate-900 text-white",
    yellow: "bg-yellow-400 text-black",
    green: "bg-green-500 text-white",
    rose: "bg-rose-500 text-white",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SimpleStatusBadge({ status }) {
  const styles = {
    operational: "bg-green-100 text-green-700 border-green-200",
    maintenance: "bg-amber-100 text-amber-700 border-amber-200",
    full: "bg-rose-100 text-rose-700 border-rose-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status] || styles.closed}`}>
      {status}
    </span>
  );
}

export default function Warehouses() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/warehouses`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.warehouses || data.items || []);
    } catch {
      setItems([]);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.toLowerCase().trim();
    return items.filter((w) => {
      const matchesSearch = !q || (w.name || "").toLowerCase().includes(q) || (w.code || "").toLowerCase().includes(q) || (w.city || "").toLowerCase().includes(q) || (w.manager || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || w.status === statusFilter;
      const matchesType = typeFilter === "all" || w.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, query, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    if (!items) return { total: 0, operational: 0, capacity: 0, utilization: 0 };
    const total = items.length;
    const operational = items.filter((w) => w.status === "operational").length;
    const capacity = items.reduce((sum, w) => sum + (Number(w.capacity_sqm) || 0), 0);
    const used = items.reduce((sum, w) => sum + (Number(w.used_sqm) || 0), 0);
    const utilization = capacity ? Math.round((used / capacity) * 100) : 0;
    return { total, operational, capacity, utilization };
  }, [items]);

  const openAddModal = () => {
    setEditing(null);
    setFormData({
      status: "operational",
      type: "Dry",
      capacity_sqm: 0,
      used_sqm: 0,
    });
    setShowForm(true);
  };

  const openEditModal = (w) => {
    setEditing(w);
    setFormData({ ...w });
    setShowForm(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(editing && (editing.id || editing._id));
      const id = editing?.id || editing?._id;
      const endpoint = isEdit ? `/api/warehouses/${id}` : "/api/warehouses";
      const url = `${API_URL}${endpoint}`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Save failed");
      setShowForm(false);
      load();
    } catch {
      alert("Failed to save warehouse.");
    }
  };

  const handleDelete = async (w) => {
    if (!window.confirm(`Delete warehouse ${w.name}? This action cannot be undone.`)) return;
    try {
      const id = w.id || w._id;
      const res = await fetch(`${API_URL}/api/warehouses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch {
      alert("Delete failed");
    }
  };

  if (!items) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading warehouses...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={WarehouseIcon} label="Total Warehouses" value={stats.total} accent="navy" />
        <StatCard icon={TrendingUp} label="Operational" value={stats.operational} sub={`${stats.total ? Math.round((stats.operational / stats.total) * 100) : 0}% of fleet`} accent="green" />
        <StatCard icon={Layers} label="Total Capacity" value={`${(stats.capacity / 1000).toFixed(1)}k`} sub="sqm" accent="yellow" />
        <StatCard icon={Gauge} label="Avg Utilization" value={`${stats.utilization}%`} accent={stats.utilization > 85 ? "rose" : "navy"} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, code, city, or manager…"
            className="py-2.5 text-sm outline-none bg-transparent w-full"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 outline-none focus:border-yellow-400 cursor-pointer"
          >
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 outline-none focus:border-yellow-400 cursor-pointer"
          >
            {TYPE_FILTERS.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
          </select>
          <button
            onClick={openAddModal}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2.5 rounded-lg flex items-center shrink-0 text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Warehouse
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-500">{filtered.length} {filtered.length === 1 ? "warehouse" : "warehouses"}</div>

      {/* Warehouse cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <WarehouseIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No warehouses found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Try adjusting your filters or add a new warehouse.</p>
          <button
            onClick={openAddModal}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-lg inline-flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Warehouse
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => {
            const usage = w.capacity_sqm ? Math.min(100, Math.round((Number(w.used_sqm) || 0) / Number(w.capacity_sqm) * 100)) : 0;
            const TypeIcon = TYPE_ICONS[w.type] || Box;
            const typeColor = TYPE_COLORS[w.type] || "bg-slate-100 text-slate-600";
            return (
              <div key={w.id || w._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all group">
                <div className={`h-1.5 ${w.status === "operational" ? "bg-green-500" : w.status === "maintenance" ? "bg-amber-500" : w.status === "full" ? "bg-rose-500" : "bg-slate-300"}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${typeColor}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{w.name}</h3>
                        <div className="text-xs text-yellow-600 font-mono font-medium mt-0.5">{w.code}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditModal(w)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(w)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{[w.location, w.city, w.country].filter(Boolean).join(", ") || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{w.manager || "No manager assigned"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{w.type} · {Number(w.capacity_sqm || 0).toLocaleString()} sqm capacity</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400">Capacity Used</span>
                      <span className="font-semibold text-slate-700">{Number(w.used_sqm || 0).toLocaleString()} / {Number(w.capacity_sqm || 0).toLocaleString()} sqm</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${usage > 85 ? "bg-rose-500" : usage > 60 ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${usage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-semibold text-slate-700">{usage}% utilized</span>
                      <SimpleStatusBadge status={w.status} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2-Column Responsive Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                {editing ? "Edit Warehouse" : "Add Warehouse"}
              </h2>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.map((field) => (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all cursor-pointer"
                      >
                        <option value="" disabled>Select...</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        required={field.required}
                        placeholder={field.label}
                        value={formData[field.name] ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
                          })
                        }
                        className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-sm font-semibold text-black transition-colors shadow-sm cursor-pointer"
                >
                  {editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}