import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, UserPlus, Phone, Truck, CheckCircle2, Trash2, Mail, MoreVertical, Edit3, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Track which driver is currently being edited directly inside the table row/card
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineData, setInlineData] = useState({ name: '', email: '', phone: '' });

  // Form data for the registration modal (status defaults to 'Available' automatically)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Available'
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load drivers database');
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^\+?[0-9\-\s]{10,15}$/;
    return phoneRegex.test(phone.trim());
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error('Email address is required');
      return;
    }

    if (!isValidPhoneNumber(formData.phone)) {
      toast.error('Invalid phone format! Use numbers, dashes, or + (e.g. +977 9812345678)');
      return;
    }

    const { error } = await supabase.from('drivers').insert([formData]);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Driver registered successfully');
      closeModal();
      fetchDrivers();
    }
  };

  const startInlineEdit = (driver) => {
    setInlineEditingId(driver.id);
    setInlineData({
      name: driver.name || '',
      email: driver.email || '',
      phone: driver.phone || ''
    });
    setActiveMenuId(null);
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineData({ name: '', email: '', phone: '' });
  };

  const saveInlineEdit = async (id) => {
    if (!inlineData.email.trim()) {
      toast.error('Email address is required');
      return;
    }

    if (!isValidPhoneNumber(inlineData.phone)) {
      toast.error('Invalid phone format! Use numbers, dashes, or + (e.g. +977 9812345678)');
      return;
    }

    const { error } = await supabase
      .from('drivers')
      .update(inlineData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update driver details');
    } else {
      toast.success('Driver updated successfully');
      setInlineEditingId(null);
      fetchDrivers();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: '', email: '', phone: '', status: 'Available' });
  };

  const deleteDriver = async (id) => {
    setActiveMenuId(null);
    if (!window.confirm('Remove this driver from the fleet?')) return;
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete driver');
    } else {
      toast.success('Driver removed from fleet');
      fetchDrivers();
    }
  };

  const totalDrivers = drivers.length;
  const freeDrivers = drivers.filter(d => d.status === 'Available').length;
  const busyDrivers = drivers.filter(d => d.status === 'On Field').length;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="space-y-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#141210] border border-white/15 p-8 shadow-2xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-wider text-white">Fleet Drivers Dispatch</h2>
          <p className="text-sm text-white/60 uppercase tracking-widest mt-2">Manage active personnel, credentials, and live availability</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); closeModal(); setShowModal(true); }}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-4 font-black text-sm uppercase tracking-wider flex items-center gap-3 transition-all cursor-pointer shadow-xl shrink-0"
        >
          <UserPlus className="w-5 h-5" /> Register Driver
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141210] border border-white/15 p-8 shadow-xl">
          <span className="text-xs uppercase tracking-widest text-white/50 block mb-2 font-bold">Total Fleet Personnel</span>
          <span className="text-5xl font-black text-white">{totalDrivers}</span>
        </div>
        <div className="bg-[#141210] border border-white/15 p-8 shadow-xl border-l-8 border-l-green-500">
          <span className="text-xs uppercase tracking-widest text-white/50 block mb-2 font-bold">Available / Free</span>
          <span className="text-5xl font-black text-green-400">{freeDrivers}</span>
        </div>
        <div className="bg-[#141210] border border-white/15 p-8 shadow-xl border-l-8 border-l-yellow-500">
          <span className="text-xs uppercase tracking-widest text-white/50 block mb-2 font-bold">On Field / Busy</span>
          <span className="text-5xl font-black text-yellow-500">{busyDrivers}</span>
        </div>
      </div>

      {/* Drivers List Section */}
      <div className="bg-[#141210] border border-white/15 shadow-2xl w-full">
        {loading ? (
          <div className="p-16 text-center text-yellow-500 font-black uppercase text-sm tracking-widest">Loading drivers registry...</div>
        ) : drivers.length === 0 ? (
          <div className="p-16 text-center text-white/40 font-bold uppercase text-sm tracking-widest">No drivers registered in the database yet.</div>
        ) : (
          <>
            {/* Desktop View Table */}
            <div className="hidden lg:block w-full overflow-visible">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-white/15 bg-black/50 text-xs font-black uppercase tracking-widest text-white/60">
                    <th className="p-6 w-[28%]">Driver Name</th>
                    <th className="p-6 w-[42%]">Contact Information</th>
                    <th className="p-6 w-[18%]">Status</th>
                    <th className="p-6 text-right w-[12%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm font-medium">
                  {drivers.map((driver) => {
                    const isEditing = inlineEditingId === driver.id;

                    return (
                      <tr key={driver.id} className="hover:bg-white/[0.03] transition-colors relative h-28">
                        {/* Name Column */}
                        <td className="p-6 font-bold uppercase text-white text-base align-middle">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={inlineData.name}
                              onChange={(e) => setInlineData({...inlineData, name: e.target.value})}
                              className="w-full bg-black border border-yellow-500 px-3 py-1.5 text-sm text-white uppercase font-bold focus:outline-none"
                              placeholder="Full Name"
                            />
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 flex items-center justify-center font-black text-base shrink-0">
                                {driver.name ? driver.name.charAt(0) : '?'}
                              </div>
                              <span className="truncate" title={driver.name}>{driver.name}</span>
                            </div>
                          )}
                        </td>

                        {/* Contact Info Column (Email & Phone) */}
                        <td className="p-6 align-middle">
                          {isEditing ? (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-yellow-500 shrink-0" />
                                <input 
                                  type="email"
                                  value={inlineData.email}
                                  onChange={(e) => setInlineData({...inlineData, email: e.target.value})}
                                  className="w-full bg-black border border-yellow-500 px-3 py-1.5 text-sm text-white focus:outline-none"
                                  placeholder="Email Address"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-yellow-500 shrink-0" />
                                <input 
                                  type="text"
                                  value={inlineData.phone}
                                  onChange={(e) => setInlineData({...inlineData, phone: e.target.value})}
                                  className="w-full bg-black border border-yellow-500 px-3 py-1.5 text-sm text-white uppercase focus:outline-none"
                                  placeholder="Phone Number"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-yellow-500 shrink-0" />
                                <span className="text-sm text-white/95 truncate">{driver.email || 'No email provided'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-yellow-500 shrink-0" />
                                <span className="text-sm text-white/95 uppercase">{driver.phone}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="p-6 align-middle">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider border ${
                            driver.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {driver.status === 'Available' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Truck className="w-3.5 h-3.5 shrink-0" />}
                            {driver.status || 'Available'}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="p-6 text-right align-middle relative">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => saveInlineEdit(driver.id)}
                                className="p-1.5 bg-green-500 text-black hover:bg-green-400 transition-colors cursor-pointer rounded"
                                title="Save Changes"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>
                              <button 
                                onClick={cancelInlineEdit}
                                className="p-1.5 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer rounded"
                                title="Cancel"
                              >
                                <X className="w-4 h-4 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === driver.id ? null : driver.id);
                                }}
                                className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer inline-flex items-center justify-center rounded"
                                title="Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMenuId === driver.id && (
                                <div onClick={(e) => e.stopPropagation()} className="absolute right-6 top-16 w-40 bg-[#1a1714] border border-white/25 shadow-2xl z-50 py-1.5 text-left">
                                  <button 
                                    onClick={() => startInlineEdit(driver)}
                                    className="w-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-yellow-500 hover:text-black flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> Edit Driver
                                  </button>
                                  <button 
                                    onClick={() => deleteDriver(driver.id)}
                                    className="w-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Driver
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Stacked Cards View */}
            <div className="block lg:hidden divide-y divide-white/10">
              {drivers.map((driver) => {
                const isEditing = inlineEditingId === driver.id;

                return (
                  <div key={driver.id} className="p-5 space-y-3 hover:bg-white/[0.02] relative">
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <div className="w-3/5">
                          <input 
                            type="text"
                            value={inlineData.name}
                            onChange={(e) => setInlineData({...inlineData, name: e.target.value})}
                            className="bg-black border border-yellow-500 px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none w-full"
                            placeholder="Full Name"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 flex items-center justify-center font-black text-sm shrink-0">
                            {driver.name ? driver.name.charAt(0) : '?'}
                          </div>
                          <span className="font-black uppercase text-white text-sm">{driver.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                          driver.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                        }`}>
                          {driver.status || 'Available'}
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => saveInlineEdit(driver.id)}
                              className="p-1.5 bg-green-500 text-black hover:bg-green-400 transition-colors cursor-pointer rounded"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button 
                              onClick={cancelInlineEdit}
                              className="p-1.5 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer rounded"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === driver.id ? null : driver.id);
                            }}
                            className="p-2 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer inline-flex items-center justify-center rounded"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {!isEditing && activeMenuId === driver.id && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute right-5 top-16 w-40 bg-[#1a1714] border border-white/25 shadow-2xl z-50 py-1.5 text-left">
                        <button 
                          onClick={() => startInlineEdit(driver)}
                          className="w-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-yellow-500 hover:text-black flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Driver
                        </button>
                        <button 
                          onClick={() => deleteDriver(driver.id)}
                          className="w-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Driver
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col space-y-2.5 pt-1">
                      {isEditing ? (
                        <>
                          <div className="flex items-center gap-3 bg-black/40 p-3 border border-yellow-500">
                            <Mail className="w-4 h-4 text-yellow-500 shrink-0" />
                            <input 
                              type="email"
                              value={inlineData.email}
                              onChange={(e) => setInlineData({...inlineData, email: e.target.value})}
                              className="w-full bg-black border border-white/20 px-2 py-1.5 text-sm text-white focus:outline-none"
                              placeholder="Email Address"
                            />
                          </div>
                          <div className="flex items-center gap-3 bg-black/40 p-3 border border-yellow-500">
                            <Phone className="w-4 h-4 text-yellow-500 shrink-0" />
                            <input 
                              type="text"
                              value={inlineData.phone}
                              onChange={(e) => setInlineData({...inlineData, phone: e.target.value})}
                              className="w-full bg-black border border-white/20 px-2 py-1.5 text-sm text-white uppercase focus:outline-none"
                              placeholder="Phone Number"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 bg-black/40 p-3 border border-white/10">
                            <Mail className="w-4 h-4 text-yellow-500 shrink-0" />
                            <span className="text-sm text-white">{driver.email || 'No email provided'}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-black/40 p-3 border border-white/10">
                            <Phone className="w-4 h-4 text-yellow-500 shrink-0" />
                            <span className="text-sm text-white uppercase">{driver.phone}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#141210] border border-white/20 w-full max-w-xl p-8 sm:p-10 shadow-2xl relative space-y-6">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-wider text-yellow-500">Register New Driver</h3>
              <p className="text-sm text-white/50 uppercase tracking-widest mt-1">Add driver credentials to the system registry</p>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'Full Name'}
                  className="w-full bg-black border border-white/25 px-5 py-3.5 text-sm text-white uppercase font-bold focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'Email Address'}
                  className="w-full bg-black border border-white/25 px-5 py-3.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">Phone Contact</label>
                <input 
                  type="text"
                  required
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = 'Phone Number'}
                  className="w-full bg-black border border-white/25 px-5 py-3.5 text-sm text-white uppercase font-bold focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="w-1/2 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider py-4 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider py-4 text-xs transition-colors cursor-pointer shadow-xl"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}