import React, { useState, useEffect } from "react";
import { Users, UserCheck, Truck, UserX, Search, ChevronLeft, ChevronRight, Loader2, Plus, X, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'https://courier-backend-5f6r.onrender.com';

export default function AdminDrivers() {
  const [loading, setLoading] = useState(true);
  const [driversList, setDriversList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    phone: "", 
    email: "", 
    password: "", 
    license_number: "", 
    license_type: "CDL Class A", 
    vehicle_assigned: "", 
    vehicle_model: "", 
    status: "Active", 
    current_trip: "Available" 
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDriversList(Array.isArray(data) ? data : data.drivers || []);
    } catch (err) {
      console.error("Failed to load drivers:", err);
      toast.error("Failed to load drivers from backend server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ 
      name: "", 
      phone: "", 
      email: "", 
      password: "", 
      license_number: "", 
      license_type: "CDL Class A", 
      vehicle_assigned: "", 
      vehicle_model: "", 
      status: "Active", 
      current_trip: "Available" 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d) => {
    setEditingId(d.id);
    setFormData({ 
      name: d.name || "", 
      phone: d.phone || "", 
      email: d.email || "", 
      password: "", 
      license_number: d.license_number || "", 
      license_type: d.license_type || "CDL Class A", 
      vehicle_assigned: d.vehicle_assigned || "", 
      vehicle_model: d.vehicle_model || "", 
      status: d.status || "Active", 
      current_trip: d.current_trip || "Available" 
    });
    setIsModalOpen(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.license_number) return toast.error("Fill required fields.");
    if (!editingId && (!formData.email || !formData.password)) {
      return toast.error("Email and Password are required to create a driver login account.");
    }

    setSubmitting(true);
    try {
      const endpoint = editingId ? `/api/admin/drivers/${editingId}` : '/api/admin/drivers';
      const url = `${API_URL}${endpoint}`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Operation failed");
      }

      toast.success(editingId ? "Driver updated successfully!" : "Driver created successfully!");
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteDriver = async () => {
    if (!driverToDelete) return;
    const id = driverToDelete.id;
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Failed to delete driver");

      setDriversList(driversList.filter(d => d.id !== id));
      toast.success("Driver deleted successfully");
    } catch (e) {
      toast.error(e.message || "Delete failed");
    } finally {
      setDriverToDelete(null);
    }
  };

  const totalDrivers = driversList.length;
  const activeCount = driversList.filter(d => String(d.status).toLowerCase() === 'active').length;
  const onTripCount = driversList.filter(d => String(d.current_trip || '').toLowerCase().includes('trip')).length;
  const inactiveCount = totalDrivers - activeCount;

  const filtered = driversList.filter(d => {
    const s = searchQuery.toLowerCase();
    const matchSearch = (d.name?.toLowerCase().includes(s) || d.phone?.toLowerCase().includes(s) || d.license_number?.toLowerCase().includes(s) || d.email?.toLowerCase().includes(s));
    const matchStatus = statusFilter === 'all' || String(d.status).toLowerCase() === statusFilter;
    const matchLicense = licenseFilter === 'all' || String(d.license_type || '').toLowerCase().includes(licenseFilter.toLowerCase());
    return matchSearch && matchStatus && matchLicense;
  }).sort((a, b) => sortBy === 'name-asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || ''));

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex flex-col items-center justify-center py-24 text-amber-600 gap-3 font-bold uppercase text-xs w-full"><Loader2 className="w-8 h-8 animate-spin" />Loading Drivers...</div>;

  return (
    <div className="w-full space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Users className="w-5 h-5 text-amber-600" />Drivers Management</h2>
          <p className="text-xs text-gray-500 mt-0.5"></p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer">
          <Plus className="w-4 h-4 stroke-[3]" /><span>Add Driver</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Drivers", count: totalDrivers, icon: Users, bg: "bg-amber-100", text: "text-amber-600" },
          { title: "Active Drivers", count: activeCount, icon: UserCheck, bg: "bg-green-100", text: "text-green-600" },
          { title: "On Trip", count: onTripCount, icon: Truck, bg: "bg-blue-100", text: "text-blue-600" },
          { title: "Inactive Drivers", count: inactiveCount, icon: UserX, bg: "bg-purple-100", text: "text-purple-600" }
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{c.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{c.count}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center`}><c.icon className="w-5 h-5" /></div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search drivers..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500" />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider flex-1 sm:flex-none">
            <option value="all">Status: All</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          <select value={licenseFilter} onChange={e => { setLicenseFilter(e.target.value); setCurrentPage(1); }} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider flex-1 sm:flex-none">
            <option value="all">License Type</option><option value="CDL Class A">CDL Class A</option><option value="CDL Class B">CDL Class B</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider flex-1 sm:flex-none">
            <option value="name-asc">Name A-Z</option><option value="name-desc">Name Z-A</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* MOBILE CARD VIEW */}
        <div className="lg:hidden space-y-3 p-4">
          {paginated.length === 0 ? (
            <div className="text-center py-16 text-gray-400 font-bold"><Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />No drivers found</div>
          ) : (
            paginated.map(d => {
              const active = String(d.status).toLowerCase() === 'active';
              const trip = d.current_trip || 'Available';
              const onTrip = String(trip).toLowerCase().includes('trip');
              return (
                <div key={d.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 cursor-pointer hover:text-amber-600" onClick={() => openEditModal(d)}>{d.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 border-t border-gray-200/60 pt-2">
                    <div>
                      <span className="text-gray-400 block uppercase font-bold text-[9px]">Contact</span>
                      <span className="font-medium text-gray-800">{d.phone}</span>
                      <div className="text-gray-500 text-[10px] truncate">{d.email || '—'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 block uppercase font-bold text-[9px]">License</span>
                      <span className="font-medium text-gray-800">{d.license_number}</span>
                      <div className="text-gray-500 text-[10px]">{d.license_type}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 border-t border-gray-200/60 pt-2">
                    <div>
                      <span className="text-gray-400 block uppercase font-bold text-[9px]">Vehicle</span>
                      <span className="font-medium text-gray-800">{d.vehicle_assigned || 'Unassigned'}</span>
                      <div className="text-gray-500 text-[10px]">{d.vehicle_model || '—'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 block uppercase font-bold text-[9px]">Trip Status</span>
                      <span className="flex items-center gap-1.5 font-bold text-gray-800 mt-0.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${onTrip ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>{trip}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/60">
                    <button onClick={() => openEditModal(d)} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold uppercase">Edit</button>
                    <button onClick={() => setDriverToDelete(d)} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold uppercase flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3.5 px-6">Driver</th><th className="py-3.5 px-6">Contact</th><th className="py-3.5 px-6">License</th><th className="py-3.5 px-6">Vehicle</th><th className="py-3.5 px-6">Status</th><th className="py-3.5 px-6">Trip</th><th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-900 font-semibold">
              {paginated.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-16 text-gray-400 font-bold"><Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />No drivers found</td></tr>
              ) : (
                paginated.map(d => {
                  const active = String(d.status).toLowerCase() === 'active';
                  const trip = d.current_trip || 'Available';
                  const onTrip = String(trip).toLowerCase().includes('trip');
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60">
                      <td className="py-4 px-6 font-bold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors" onClick={() => openEditModal(d)}>{d.name}</td>
                      <td className="py-4 px-6 text-gray-900"><div>{d.phone}</div><div className="text-gray-600 text-[11px] font-medium">{d.email || '—'}</div></td>
                      <td className="py-4 px-6 text-gray-900"><div>{d.license_number}</div><div className="text-gray-600 text-[11px] font-medium">{d.license_type}</div></td>
                      <td className="py-4 px-6 text-gray-900"><div>{d.vehicle_assigned || 'Unassigned'}</div><div className="text-gray-600 text-[11px] font-medium">{d.vehicle_model || '—'}</div></td>
                      <td className="py-4 px-6"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{active ? 'Active' : 'Inactive'}</span></td>
                      <td className="py-4 px-6"><div className="flex items-center gap-1.5 font-bold"><span className={`w-2 h-2 rounded-full ${onTrip ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>{trip}</div></td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => setDriverToDelete(d)} className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-100 ml-auto cursor-pointer" title="Delete Driver">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 px-6 border-t border-gray-100">
          <p className="text-xs text-gray-700 font-bold uppercase tracking-wider">Showing {filtered.length ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer ${currentPage === p ? 'bg-amber-500 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{editingId ? "Edit Driver" : "Add Driver & Login"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Name *</label><input required placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500" /></div>
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone *</label><input required placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500" /></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email {editingId ? "" : "*"}</label>
                  <input type="email" required={!editingId} placeholder="driver@jblogistics.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500" />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password * (Min 6 chars)</label>
                    <input type="password" required placeholder="At least 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">License # *</label><input required placeholder="License" value={formData.license_number} onChange={e => setFormData({ ...formData, license_number: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500" /></div>
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">License Type</label><select value={formData.license_type} onChange={e => setFormData({ ...formData, license_type: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 uppercase"><option value="CDL Class A">CDL Class A</option><option value="CDL Class B">CDL Class B</option></select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vehicle Assigned</label><input placeholder="Truck #14" value={formData.vehicle_assigned} onChange={e => setFormData({ ...formData, vehicle_assigned: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500" /></div>
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vehicle Model</label><input placeholder="Model" value={formData.vehicle_model} onChange={e => setFormData({ ...formData, vehicle_model: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs font-bold uppercase cursor-pointer">Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  {editingId ? "Update Driver" : "Create Account & Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {driverToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Delete Driver</h3>
              <p className="text-xs text-gray-500 font-medium">Are you sure you want to delete <strong className="text-gray-900">{driverToDelete.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDriverToDelete(null)} className="w-full rounded-xl text-xs font-bold uppercase cursor-pointer">Cancel</Button>
              <Button type="button" onClick={confirmDeleteDriver} className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}