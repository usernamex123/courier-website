import React, { useEffect, useState, useMemo } from "react";
import { Plus, Search, Mail, Phone, Building2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'https://courier-backend-5f6r.onrender.com';

const INDUSTRIES = [
  "E-commerce", "Manufacturing", "Healthcare", "Pharmaceuticals", "Agriculture",
  "Automotive", "Retail", "FMCG", "Electronics", "Construction", "Government",
  "Oil & Gas", "Mining", "Textile", "Food & Beverage"
];

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
  Bronze: "bg-amber-100 text-amber-700",
  Silver: "bg-gray-200 text-gray-700",
  Gold: "bg-yellow-100 text-yellow-700",
  Platinum: "bg-purple-100 text-purple-700"
};

function SimpleStatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700 border-green-200",
    inactive: "bg-slate-100 text-slate-700 border-slate-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status] || styles.inactive}`}>
      {status}
    </span>
  );
}

export default function Customers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/customers`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.customers || data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((c) => {
      const matchesQuery =
        !q ||
        (c.company_name || "").toLowerCase().includes(q) ||
        (c.contact_name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();
      const matchesTier = tierFilter === "all" || c.tier === tierFilter;
      return matchesQuery && matchesStatus && matchesTier;
    });
  }, [items, query, statusFilter, tierFilter]);

  const openAddModal = () => {
    setEditing(null);
    setFormData({
      status: "active",
      tier: "Silver",
      industry: INDUSTRIES[0],
      credit_limit: 0,
      total_revenue: 0,
      total_shipments: 0,
    });
    setShowForm(true);
  };

  const openEditModal = (c) => {
    setEditing(c);
    setFormData({ ...c });
    setShowForm(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(editing && (editing.id || editing._id));
      const id = editing?.id || editing?._id;
      const endpoint = isEdit ? `/api/customers/${id}` : "/api/customers";
      const url = `${API_URL}${endpoint}`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success(isEdit ? "Customer updated" : "Customer created");
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const id = deleting.id || deleting._id;
      const res = await fetch(`${API_URL}/api/customers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Customer deleted");
      setDeleting(null);
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers..."
              className="py-2 text-sm outline-none bg-transparent w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">Tier: All</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </select>
        </div>
        <button
          onClick={openAddModal}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-xl inline-flex items-center text-sm cursor-pointer transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Customer
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            No customers found.
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id || c._id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-sm">
                    {(c.company_name || c.contact_name || "C")[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{c.company_name || c.contact_name}</h3>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </div>
                </div>
                <SimpleStatusBadge status={c.status} />
              </div>

              <div className="space-y-1 text-xs text-slate-500 mb-4">
                <div className="font-medium text-slate-700">{c.company_name ? c.contact_name : c.industry}</div>
                <div>{[c.city, c.country].filter(Boolean).join(", ") || c.address || "—"}</div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400">Shipments</div>
                  <div className="text-sm font-bold text-slate-900">{c.total_shipments || 0}</div>
                </div>
                <div>
                  <div className="text-slate-400">Total Spent</div>
                  <div className="text-sm font-bold text-slate-900">${Number(c.total_revenue || 0).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                {editing ? "Edit Customer" : "Add Customer"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
                        className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-yellow-400 transition-all cursor-pointer"
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
                        className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-yellow-400 transition-all"
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

      {deleting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Customer</h3>
            <p className="text-sm text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{deleting.company_name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}