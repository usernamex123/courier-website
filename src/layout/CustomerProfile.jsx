import React, { useState } from "react";
import { Loader2, Save } from "lucide-react";

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none bg-white";

export default function CustomerProfile() {
  const [user] = useState({
    full_name: "Sparsh",
    email: "sparsh@example.com",
    role: "customer"
  });

  const [form, setForm] = useState({
    phone: "+977 9800000000",
    company_name: "JB Logistics User",
    contact_name: "Sparsh",
    address: "Damak-5",
    city: "Damak",
    state: "Jhapa",
    postal_code: "57200",
    billing_email: "sparsh@example.com"
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const save = (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    
    // Simulate API save delay safely without base44
    setTimeout(() => {
      setSaving(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 600);
  };

  const Field = ({ label, children, full }) => (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5 font-sans">
      {successMessage && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium shadow-sm">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-2xl font-black text-black">
            {(form.contact_name || user.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-lg">{form.contact_name || "Customer"}</div>
            <div className="text-sm text-slate-500">{form.billing_email || user.email}</div>
            <span className="inline-block mt-1 text-xs font-medium text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full">
              {user.role || "customer"}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input 
              className={inputCls} 
              value={form.contact_name} 
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })} 
            />
          </Field>
          <Field label="Phone">
            <input 
              className={inputCls} 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })} 
            />
          </Field>
          <Field label="Company Name">
            <input 
              className={inputCls} 
              value={form.company_name} 
              onChange={(e) => setForm({ ...form, company_name: e.target.value })} 
            />
          </Field>
          <Field label="Billing Email">
            <input 
              type="email" 
              className={inputCls} 
              value={form.billing_email} 
              onChange={(e) => setForm({ ...form, billing_email: e.target.value })} 
            />
          </Field>
          <Field label="Address" full>
            <input 
              className={inputCls} 
              value={form.address} 
              onChange={(e) => setForm({ ...form, address: e.target.value })} 
            />
          </Field>
          <Field label="City">
            <input 
              className={inputCls} 
              value={form.city} 
              onChange={(e) => setForm({ ...form, city: e.target.value })} 
            />
          </Field>
          <Field label="State">
            <input 
              className={inputCls} 
              value={form.state} 
              onChange={(e) => setForm({ ...form, state: e.target.value })} 
            />
          </Field>
          <Field label="Postal Code">
            <input 
              className={inputCls} 
              value={form.postal_code} 
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })} 
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={saving} 
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}