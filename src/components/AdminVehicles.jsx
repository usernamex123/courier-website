import React, { useEffect, useState, useMemo } from "react";
import {
  Plus, Search, Fuel, Gauge, MapPin, Pencil, Trash2, Truck, Bike, Package,
  Snowflake, Container, Truck as TruckIcon, Wrench, Calendar, TrendingUp, Layers, X,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'https://courier-backend-5f6r.onrender.com';

const FIELDS = [
  { name: "registration", label: "Registration Number", required: true },
  { name: "type", label: "Type", type: "select", options: ["Truck", "Van", "Container Truck", "Refrigerated Truck", "Flatbed", "Box Truck", "Motorbike", "Semi-Trailer"], required: true },
  { name: "model", label: "Vehicle Model" },
  { name: "year", label: "Manufacturing Year", type: "number" },
  { name: "capacity_kg", label: "Capacity (kg)", type: "number" },
  { name: "fuel_type", label: "Fuel Type", type: "select", options: ["Diesel", "Petrol", "Electric", "Hybrid"] },
  { name: "status", label: "Status", type: "select", options: ["active", "maintenance", "idle", "retired"] },
  { name: "current_location", label: "Current Location" },
  { name: "mileage_km", label: "Mileage (km)", type: "number" },
  { name: "insurance_expiry", label: "Insurance Expiry", type: "date" },
  { name: "last_service", label: "Last Service Date", type: "date" },
];

const TYPE_ICONS = {
  Truck: Truck,
  Van: TruckIcon,
  "Container Truck": Container,
  "Refrigerated Truck": Snowflake,
  Flatbed: Truck,
  "Box Truck": Package,
  Motorbike: Bike,
  "Semi-Trailer": Truck,
};

const TYPE_COLORS = {
  Truck: "bg-slate-100 text-slate-600",
  Van: "bg-blue-100 text-blue-600",
  "Container Truck": "bg-violet-100 text-violet-600",
  "Refrigerated Truck": "bg-sky-100 text-sky-600",
  Flatbed: "bg-amber-100 text-amber-600",
  "Box Truck": "bg-indigo-100 text-indigo-600",
  Motorbike: "bg-rose-100 text-rose-600",
  "Semi-Trailer": "bg-teal-100 text-teal-600",
};

const FUEL_COLORS = {
  Diesel: "bg-slate-100 text-slate-600",
  Petrol: "bg-amber-100 text-amber-600",
  Electric: "bg-green-100 text-green-600",
  Hybrid: "bg-blue-100 text-blue-600",
};

const STATUS_FILTERS = ["all", "active", "maintenance", "idle", "retired"];
const TYPE_FILTERS = ["all", "Truck", "Van", "Container Truck", "Refrigerated Truck", "Flatbed", "Box Truck", "Motorbike", "Semi-Trailer"];

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
    active: "bg-green-100 text-green-700 border-green-200",
    maintenance: "bg-amber-100 text-amber-700 border-amber-200",
    idle: "bg-slate-100 text-slate-700 border-slate-200",
    retired: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status] || styles.idle}`}>
      {status}
    </span>
  );
}

export default function Vehicles() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/vehicles`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.vehicles || data.items || []);
    } catch {
      setItems([]);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.toLowerCase().trim();
    return items.filter((v) => {
      const matchesSearch = !q || 
        (v.registration || "").toLowerCase().includes(q) || 
        (v.type || "").toLowerCase().includes(q) || 
        (v.model || "").toLowerCase().includes(q) || 
        (v.current_location || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      const matchesType = typeFilter === "all" || v.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, query, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    if (!items) return { total: 0, active: 0, maintenance: 0, capacity: 0 };
    const total = items.length;
    const active = items.filter((v) => v.status === "active").length;
    const maintenance = items.filter((v) => v.status === "maintenance").length;
    const capacity = items.reduce((sum, v) => sum + (Number(v.capacity_kg) || 0), 0);
    return { total, active, maintenance, capacity };
  }, [items]);

  const openAddModal = () => {
    setEditing(null);
    setFormData({
      status: "active",
      type: "Truck",
      fuel_type: "Diesel",
      capacity_kg: 0,
      mileage_km: 0,
    });
    setShowForm(true);
  };

  const openEditModal = (v) => {
    setEditing(v);
    setFormData({ ...v });
    setShowForm(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(editing && editing.id);
      const endpoint = isEdit ? `/api/admin/vehicles/${editing.id}` : "/api/admin/vehicles";
      const url = `${API_URL}${endpoint}`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success(isEdit ? "Vehicle updated successfully" : "Vehicle registered successfully");
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to save vehicle.");
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete vehicle ${v.registration}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/vehicles/${v.id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Vehicle deleted successfully");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (!items) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading vehicles...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Total Fleet" value={stats.total} accent="navy" />
        <StatCard icon={TrendingUp} label="Active" value={stats.active} sub={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of fleet`} accent="green" />
        <StatCard icon={Wrench} label="In Maintenance" value={stats.maintenance} accent="yellow" />
        <StatCard icon={Layers} label="Total Capacity" value={`${(stats.capacity / 1000).toFixed(1)}t`} sub="kg payload" accent="rose" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by registration, model, type, or location…"
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
            <Plus className="w-4 h-4 mr-1" /> Register Vehicle
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-500">{filtered.length} {filtered.length === 1 ? "vehicle" : "vehicles"}</div>

      {/* Vehicle cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No vehicles found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Try adjusting your filters or register a new vehicle.</p>
          <button
            onClick={openAddModal}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-lg inline-flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Register Vehicle
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const TypeIcon = TYPE_ICONS[v.type] || Truck;
            const typeColor = TYPE_COLORS[v.type] || "bg-slate-100 text-slate-600";
            const fuelColor = FUEL_COLORS[v.fuel_type] || "bg-slate-100 text-slate-600";
            const mileageK = ((v.mileage_km || 0) / 1000).toFixed(1);
            return (
              <div key={v.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all group">
                <div className={`h-1.5 ${v.status === "active" ? "bg-green-500" : v.status === "maintenance" ? "bg-amber-500" : v.status === "idle" ? "bg-slate-400" : "bg-slate-300"}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${typeColor}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{v.type} {v.model ? `(${v.model})` : ""}</h3>
                        <div className="text-xs text-yellow-600 font-mono font-semibold mt-0.5 tracking-wide">{v.registration}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditModal(v)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(v)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500 mb-4">
                    {v.year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Year: {v.year}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{Number(v.capacity_kg || 0).toLocaleString()} kg capacity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{mileageK}k km mileage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{v.current_location || "Location not set"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${fuelColor}`}>
                        <Fuel className="w-3 h-3" /> {v.fuel_type}
                      </span>
                    </div>
                    <SimpleStatusBadge status={v.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                {editing ? "Edit Vehicle" : "Register Vehicle"}
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
                        className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25 transition-all cursor-pointer"
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
                        className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25 transition-all"
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
                  {editing ? "Save Changes" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}