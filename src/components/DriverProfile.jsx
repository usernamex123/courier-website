import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import DriverHeader from './DriverHeader';
import DriverSidebar from './DriverSidebar';
import { toast } from 'sonner';
import { 
  User, 
  Camera, 
  Edit3, 
  Package, 
  Calendar, 
  Save, 
  X, 
  Loader2,
  Lock,
  ChevronRight
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DriverProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);

  const [driver, setDriver] = useState({
    id: '',          
    driver_id: 'DRV-1001',   
    name: 'Loading...',
    email: '',
    phone: '',
    address: 'Kathmandu, Nepal',
    status: 'Active',
    current_trip: 'Available',
    avatar: null,
    totalDeliveries: '0',
    memberSince: '2026 August 23',
    vehicleType: 'Delivery Van',
    plateNumber: '',
    model: '',
    capacity: '500 kg'
  });

  useEffect(() => {
    async function loadDriverProfile() {
      setLoading(true);
      try {
        // 1. Get the authenticated user straight from Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          toast.error('Session expired. Please log in again.');
          navigate('/');
          return;
        }

        // 2. Fetch the corresponding driver profile using the secure Auth UID
        const { data: profileData, error: profileError } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData) {
          toast.error('Driver profile not found.');
          return;
        }

        // 3. Format member since date
        let formattedMemberSince = '2026 August 23';
        if (profileData.created_at) {
          const dateObj = new Date(profileData.created_at);
          if (!isNaN(dateObj.getTime())) {
            formattedMemberSince = `${dateObj.getFullYear()} ${dateObj.toLocaleString('en-US', { month: 'long' })} ${dateObj.getDate()}`;
          }
        }

        // 4. Fetch delivery count for this specific driver ID
        let deliveryCount = '0';
        if (profileData.driver_id) {
          const { count, error: countError } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', profileData.driver_id)
            .eq('current_status', 'delivered');

          if (!countError && count !== null) {
            deliveryCount = count.toString();
          }
        }

        // 5. Populate state cleanly
        setDriver({
          id: profileData.id,
          driver_id: profileData.driver_id || 'DRV-1001',
          name: profileData.name || 'Unknown Driver',
          email: user.email || profileData.email || '',
          phone: profileData.phone || '',
          address: profileData.address || 'Kathmandu, Nepal',
          status: profileData.status || 'Active',
          current_trip: profileData.current_trip || 'Available',
          plateNumber: profileData.license_number || '',
          vehicleType: profileData.vehicle_assigned || 'Delivery Van',
          model: profileData.vehicle_model || '',
          memberSince: formattedMemberSince,
          totalDeliveries: deliveryCount,
          avatar: profileData.avatar || null
        });

      } catch (e) {
        console.error('Error loading profile:', e);
        toast.error('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    }

    loadDriverProfile();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setDriver(prev => ({ ...prev, avatar: base64String }));
        
        if (driver.id) {
          await supabase
            .from('driver_profiles')
            .update({ avatar: base64String })
            .eq('id', driver.id);
        }
        
        toast.success('Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (driver.id) {
        const { error } = await supabase
          .from('driver_profiles')
          .update({
            name: driver.name,
            phone: driver.phone,
            address: driver.address
          })
          .eq('id', driver.id);

        if (error) throw error;
      }

      setIsEditingPersonal(false);
      toast.success('Personal information updated successfully!');
    } catch (err) {
      console.error('Error updating personal info:', err);
      toast.error('Failed to update personal info');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (driver.id) {
        const { error } = await supabase
          .from('driver_profiles')
          .update({
            license_number: driver.plateNumber,
            vehicle_assigned: driver.vehicleType,
            vehicle_model: driver.model
          })
          .eq('id', driver.id);

        if (error) throw error;
      }

      setIsEditingVehicle(false);
      toast.success('Vehicle information updated successfully!');
    } catch (err) {
      console.error('Error updating vehicle info:', err);
      toast.error('Failed to update vehicle info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex">
      <DriverSidebar activePage="profile" />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <DriverHeader 
          title="Driver Profile" 
          subtitle="Manage your personal and vehicle details." 
        />

        <div className="p-6 space-y-6 max-w-6xl w-full mx-auto">
          {loading && driver.name === 'Loading...' ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
                  
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-inner flex items-center justify-center overflow-hidden">
                      {driver.avatar ? (
                        <img 
                          src={driver.avatar} 
                          alt={driver.name} 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                    />

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 w-9 h-9 bg-white hover:bg-slate-50 text-slate-800 rounded-full border border-slate-200 shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                      title="Choose from album or take photo"
                    >
                      <Camera className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-900">{driver.name}</h3>
                    <p className="text-xs font-mono text-slate-500">
                      ID: {driver.driver_id}
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {driver.status}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {driver.current_trip}
                      </span>
                    </div>
                  </div>

                  <div className="w-full pt-4 border-t border-slate-100 space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 px-1">
                      <span className="text-slate-500 flex items-center gap-2"><Package className="w-4 h-4 text-slate-400" /> Total Deliveries</span>
                      <span className="font-bold text-slate-900 font-mono">{driver.totalDeliveries}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-1 border-t border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Member Since</span>
                      <span className="font-bold text-slate-900">{driver.memberSince}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Personal Info Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-base text-slate-900">
                      Personal Information
                    </h3>
                    {!isEditingPersonal ? (
                      <button 
                        onClick={() => setIsEditingPersonal(true)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditingPersonal(false)}
                        className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {!isEditingPersonal ? (
                    <div className="divide-y divide-slate-100 text-xs">
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-slate-500">Full Name</span>
                        <span className="font-bold text-slate-900 text-sm">{driver.name}</span>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-slate-500">Email</span>
                        <span className="font-bold text-slate-900 text-sm">{driver.email || 'Not specified'}</span>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-slate-500">Phone</span>
                        <span className="font-bold text-slate-900 text-sm font-mono">{driver.phone || 'Not specified'}</span>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-slate-500">Address</span>
                        <span className="font-bold text-slate-900 text-sm">{driver.address || 'Not specified'}</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSavePersonal} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-medium">Full Name</label>
                          <input 
                            type="text" 
                            value={driver.name} 
                            onChange={(e) => setDriver({...driver, name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-medium">Email Address (Read-only)</label>
                          <input 
                            type="email" 
                            value={driver.email} 
                            disabled
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-500 font-bold cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-medium">Phone Number</label>
                          <input 
                            type="text" 
                            value={driver.phone} 
                            onChange={(e) => setDriver({...driver, phone: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-medium">Address</label>
                          <input 
                            type="text" 
                            value={driver.address} 
                            onChange={(e) => setDriver({...driver, address: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => setIsEditingPersonal(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Vehicle Info Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-base text-slate-900">
                      Vehicle Information
                    </h3>
                    {!isEditingVehicle ? (
                      <button 
                        onClick={() => setIsEditingVehicle(true)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditingVehicle(false)}
                        className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {!isEditingVehicle ? (
                    <div className="divide-y divide-slate-100 text-xs">
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-slate-500">Vehicle Type (Assigned)</span>
                        <span className="font-bold text-slate-900 text-sm">{driver.vehicleType || 'Not specified'}</span>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-slate-500">License / Plate Number</span>
                        <span className="font-bold text-slate-900 text-sm font-mono">{driver.plateNumber || 'Not specified'}</span>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-slate-500">Vehicle Model</span>
                        <span className="font-bold text-slate-900 text-sm">{driver.model || 'Not specified'}</span>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-slate-500">Capacity</span>
                        <span className="font-bold text-slate-900 text-sm">{driver.capacity}</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-medium">Vehicle Type</label>
                          <input 
                            type="text" 
                            value={driver.vehicleType} 
                            onChange={(e) => setDriver({...driver, vehicleType: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-medium">License / Plate Number</label>
                          <input 
                            type="text" 
                            value={driver.plateNumber} 
                            onChange={(e) => setDriver({...driver, plateNumber: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-medium">Vehicle Model</label>
                          <input 
                            type="text" 
                            value={driver.model} 
                            onChange={(e) => setDriver({...driver, model: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-500 font-medium">Capacity</label>
                          <input 
                            type="text" 
                            value={driver.capacity} 
                            onChange={(e) => setDriver({...driver, capacity: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => setIsEditingVehicle(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Account Settings Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-4">
                    Account Settings
                  </h3>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => toast.message('Password change feature coming soon')}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600">
                          <Lock className="w-4 h-4" />
                        </div>
                        <span>Change Password</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}