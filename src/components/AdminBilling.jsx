import React, { useEffect, useState } from "react";
import { Plus, Search, Download, FileText, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `http://${window.location.hostname || 'localhost'}:5000`;
};
const API_URL = getApiUrl();

const STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];
const FIELDS = [
  { name: "invoice_number", label: "Invoice Number", required: true },
  { name: "customer_name", label: "Customer Name", required: true },
  { name: "amount", label: "Amount", type: "number", required: true },
  { name: "tax_amount", label: "Tax Amount", type: "number" },
  { name: "total", label: "Total", type: "number" },
  { name: "status", label: "Status", type: "select", options: STATUSES },
  { name: "issue_date", label: "Issue Date", type: "date" },
  { name: "due_date", label: "Due Date", type: "date" },
  { name: "payment_method", label: "Payment Method", type: "select", options: ["Credit Card", "Debit Card", "Bank Transfer", "PayPal", "Stripe", "Digital Wallet"] },
];

// --- Inline UI Components ---

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let colors = "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "paid") colors = "bg-green-50 text-green-700 border-green-200";
  if (s === "sent") colors = "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "draft") colors = "bg-gray-100 text-gray-600 border-gray-200";
  if (s === "overdue") colors = "bg-rose-50 text-rose-700 border-rose-200";
  if (s === "cancelled") colors = "bg-amber-50 text-amber-800 border-amber-200";
  
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
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">Delete Invoice</button>
      </div>
    </div>
  </div>
);

const BulkActionBar = ({ count, onClear, children }) => {
  if (!count) return null;
  return (
    <div className="bg-gray-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-fadeIn">
      <div className="flex items-center gap-2">
        <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-md font-mono">{count}</span>
        <span className="text-xs font-bold uppercase tracking-wider">Invoices Selected</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button onClick={onClear} className="text-xs font-bold text-gray-400 hover:text-white px-2 py-1 transition-colors">Clear</button>
      </div>
    </div>
  );
};

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
      
      const res = await fetch(`${API_URL}/api/admin/billing${idStr}`, {
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
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{initial ? 'Edit' : 'New'} {title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.name} className={f.name === 'customer_name' || f.name === 'invoice_number' ? 'col-span-2' : 'col-span-1'}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm capitalize"
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    required={f.required}
                  >
                    <option value="">Select {f.label}</option>
                    {f.options.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
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

export default function AdminBilling() {
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
      const res = await fetch(`${API_URL}/api/admin/billing`, { credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.invoices || []);
    } catch (err) {
      toast.error("Failed to fetch billing records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((inv) => {
    const q = query.toLowerCase();
    const mq = !q || (inv.invoice_number || "").toLowerCase().includes(q) || (inv.customer_name || "").toLowerCase().includes(q);
    const mf = filter === "all" || inv.status === filter;
    return mq && mf;
  });

  const totalRev = items.reduce((s, i) => s + (i.total || i.amount || 0), 0);
  const paid = items.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || i.amount || 0), 0);
  const overdue = items.filter((i) => i.status === "overdue").reduce((s, i) => s + (i.total || i.amount || 0), 0);

  const toggle = (id) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i._id || i.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((i) => i._id || i.id)));

  const handleDelete = async () => {
    try {
      const id = deleting._id || deleting.id;
      await fetch(`${API_URL}/api/admin/billing/${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success("Invoice deleted successfully");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error("Failed to delete invoice");
    }
  };

  const bulkStatus = async (status) => {
    if (!selected.size) return;
    try {
      await Promise.all([...selected].map(id => 
        fetch(`${API_URL}/api/admin/billing/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status })
        })
      ));
      toast.success(`${selected.size} invoices updated to ${status}`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error("Bulk status update failed");
    }
  };

  const bulkDownload = () => {
    const rows = filtered.filter((i) => selected.has(i._id || i.id));
    if (!rows.length) return;
    const headers = ["Invoice #", "Customer", "Issue Date", "Due Date", "Method", "Status", "Amount", "Total"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(","), ...rows.map((r) => [r.invoice_number, r.customer_name, r.issue_date, r.due_date, r.payment_method, r.status, r.amount, r.total].map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `invoices_${rows.length}_selected.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} invoices exported as CSV`);
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    try {
      await Promise.all([...selected].map((id) => 
        fetch(`${API_URL}/api/admin/billing/${id}`, { method: 'DELETE', credentials: 'include' })
      ));
      toast.success(`${selected.size} invoices deleted successfully`);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error("Bulk delete failed");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Billed</div>
          <div className="text-3xl font-black font-mono text-gray-900 mt-2">${totalRev.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Collected</div>
          <div className="text-3xl font-black font-mono text-green-600 mt-2">${paid.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Overdue</div>
          <div className="text-3xl font-black font-mono text-rose-600 mt-2">${overdue.toLocaleString()}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-300 px-4 py-2.5 w-full sm:w-85 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search invoices by number or customer..." 
              className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400" 
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="py-2.5 px-4 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm capitalize font-medium"
          >
            <option value="all">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <button 
          className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2" 
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <select onChange={(e) => e.target.value && bulkStatus(e.target.value)} value="" className="py-1.5 px-3 rounded-lg bg-white/10 text-white text-xs font-bold border border-white/20 outline-none capitalize">
          <option value="" className="text-gray-900">Update status…</option>
          {STATUSES.map((s) => <option key={s} value={s} className="text-gray-900 capitalize">{s}</option>)}
        </select>
        <button onClick={bulkDownload} className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors">
          <Download className="w-3.5 h-3.5" /> Download CSV
        </button>
        <button onClick={bulkDelete} className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Delete Selected
        </button>
      </BulkActionBar>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50/50 text-[10px] uppercase font-bold tracking-wider">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-yellow-500 cursor-pointer" />
              </th>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Issue Date</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-16 text-gray-500">Loading billing data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-16 text-gray-500">No invoices found matching criteria.</td></tr>
            ) : (
              filtered.map((inv) => {
                const id = inv._id || inv.id;
                const isSelected = selected.has(id);
                return (
                  <tr key={id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors ${isSelected ? "bg-yellow-50/40" : ""}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(id)} className="w-4 h-4 rounded accent-yellow-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-yellow-600 shrink-0" /> {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-medium">{inv.customer_name}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs font-mono">{inv.issue_date || "—"}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs font-mono">{inv.due_date || "—"}</td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs">{inv.payment_method || "—"}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3.5 text-right font-black font-mono text-gray-900">${(inv.total || inv.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditing(inv); setShowForm(true); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-yellow-800 transition-colors" title="Edit Invoice">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleting(inv)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors" title="Delete Invoice">
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

      {showForm && (
        <EntityFormModal 
          title="Invoice" 
          fields={FIELDS} 
          initial={editing} 
          onClose={() => setShowForm(false)} 
          onSaved={() => { setShowForm(false); load(); }} 
        />
      )}
      
      {deleting && (
        <ConfirmDialog 
          message={`Are you sure you want to delete invoice ${deleting.invoice_number}? This action cannot be undone.`} 
          onConfirm={handleDelete} 
          onClose={() => setDeleting(null)} 
        />
      )}
    </div>
  );
}