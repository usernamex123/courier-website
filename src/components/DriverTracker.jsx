import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Truck, CheckCircle2, MapPin, Navigation, LogOut, Lock, Package, AlertCircle } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function DriverPortal() {
  // Authentication State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(false);

  // Operational Workflow State
  const [assignedShipment, setAssignedShipment] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // 1. Secure Authentication against Admin Roster
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please enter both your full name and email.');
      return;
    }
    
    setLoading(true);

    try {
      const queryName = fullName.trim();
      const queryEmail = email.trim().toLowerCase();

      // Query database for strict matching
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .ilike('name', queryName)
        .eq('email', queryEmail)
        .maybeSingle();

      if (error || !data) {
        toast.error('Access Denied: Unregistered email or full name.');
        setLoading(false);
        return;
      }

      setDriver(data);
      toast.success(`Welcome back, ${data.name}. Terminal active.`);
      
      // Fetch assigned shipment if already linked
      if (data.assigned_shipment && data.assigned_shipment !== 'None') {
        fetchAssignedShipment(data.assigned_shipment);
      }
    } catch (err) {
      console.error(err);
      toast.error('Authentication verification error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch specific assigned shipment details
  const fetchAssignedShipment = async (trackingNumber) => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .single();

    if (!error && data) {
      setAssignedShipment(data);
      if (driver?.status === 'On Field') {
        startGpsTracking(driver.id);
      }
    } else {
      setAssignedShipment(null);
    }
  };

  // 3. Driver accepts or takes up an assigned task
  const acceptAssignment = async (shipmentNumber) => {
    try {
      // Update driver status & assignment
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ 
          status: 'On Field', 
          assigned_shipment: shipmentNumber 
        })
        .eq('id', driver.id);

      if (driverError) throw driverError;

      // Update shipment status to In Transit
      await supabase
        .from('shipments')
        .update({ status: 'In Transit' })
        .eq('tracking_number', shipmentNumber);

      toast.success(`Shipment #${shipmentNumber} accepted. Dispatch initiated.`);
      
      const updatedDriver = { ...driver, status: 'On Field', assigned_shipment: shipmentNumber };
      setDriver(updatedDriver);
      fetchAssignedShipment(shipmentNumber);
      startGpsTracking(driver.id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept shipment assignment');
    }
  };

  // 4. Complete current delivery task
  const completeDelivery = async () => {
    if (!assignedShipment || !driver) return;

    try {
      // Mark shipment as Delivered
      await supabase
        .from('shipments')
        .update({ status: 'Delivered' })
        .eq('tracking_number', assignedShipment.tracking_number);

      // Reset driver back to Available
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status: 'Available', 
          assigned_shipment: 'None' 
        })
        .eq('id', driver.id);

      if (error) throw error;

      toast.success('Delivery confirmed! Route completed.');
      stopGpsTracking();

      setDriver({ ...driver, status: 'Available', assigned_shipment: 'None' });
      setAssignedShipment(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to close out delivery');
    }
  };

  // 5. Automated GPS Telemetry (Enterprise Tracking Simulator)
  const startGpsTracking = (driverId) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this device.');
      return;
    }

    setTrackingActive(true);
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await supabase
          .from('drivers')
          .update({ 
            lat: latitude, 
            lng: longitude, 
            last_updated: new Date().toISOString() 
          })
          .eq('id', driverId);
      },
      (error) => console.error('GPS Telemetry warning:', error),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
    setWatchId(id);
  };

  const stopGpsTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTrackingActive(false);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  // --- RENDER: Login Gate (If unauthenticated) ---
  if (!driver) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 font-mono">
        <div className="max-w-md w-full bg-[#0e0c0b] border border-white/10 p-8 shadow-2xl relative">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Lock className="w-8 h-8 text-black stroke-[2.5]" />
          </div>
          <div className="text-center mt-6 mb-8">
            <h2 className="text-xl font-black uppercase tracking-wider text-white">Driver Field Portal</h2>
            <p className="text-[11px] text-white/50 uppercase tracking-widest mt-1">Authorized Fleet Personnel Only</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">Full Name</label>
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter registered full name..."
                className="w-full bg-black border border-white/15 px-4 py-3.5 text-white focus:outline-none focus:border-yellow-500 text-xs uppercase font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter registered email..."
                className="w-full bg-black border border-white/15 px-4 py-3.5 text-white focus:outline-none focus:border-yellow-500 text-xs"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider py-4 transition-all shadow-xl cursor-pointer text-xs mt-2"
            >
              {loading ? 'Validating Credentials...' : 'Authenticate & Enter Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: Active Driver Operations View ---
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 font-mono">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Driver Profile Header & Status */}
        <div className="bg-[#0e0c0b] border border-white/10 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
          <div>
            <span className="text-yellow-500 text-[10px] uppercase font-bold tracking-widest">Active Dispatch Unit</span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">{driver.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 border text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${
              driver.status === 'On Field' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${driver.status === 'On Field' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
              {driver.status}
            </div>
            <button 
              onClick={() => { stopGpsTracking(); setDriver(null); setAssignedShipment(null); }}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-colors"
              title="Logout Terminal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assigned Job / Shipment Box */}
        {assignedShipment ? (
          <div className="bg-[#0e0c0b] border border-yellow-500/40 p-6 md:p-8 shadow-2xl space-y-6 relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <span className="text-yellow-500 text-[10px] uppercase tracking-widest block">Active Waybill Assignment</span>
                <h3 className="text-xl font-black uppercase text-white">Shipment #{assignedShipment.tracking_number}</h3>
              </div>
              <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold uppercase">
                {assignedShipment.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-black p-4 border border-white/5 space-y-1">
                <span className="text-white/40 text-[10px] uppercase">Origin Depot</span>
                <p className="font-bold flex items-center gap-2 text-white"><MapPin className="w-4 h-4 text-yellow-500" /> {assignedShipment.origin || 'Main Distribution Hub'}</p>
              </div>
              <div className="bg-black p-4 border border-white/5 space-y-1">
                <span className="text-white/40 text-[10px] uppercase">Destination Delivery</span>
                <p className="font-bold flex items-center gap-2 text-white"><MapPin className="w-4 h-4 text-red-500" /> {assignedShipment.destination}</p>
              </div>
            </div>

            {assignedShipment.client_phone && (
              <div className="bg-black p-4 border border-white/5 text-xs">
                <span className="text-white/40 text-[10px] uppercase block mb-1">Recipient Contact Info</span>
                <p className="font-bold text-white">{assignedShipment.client_name} — {assignedShipment.client_phone}</p>
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={completeDelivery}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-wider py-4 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm & Mark as Delivered
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0e0c0b] border border-white/10 p-8 shadow-2xl text-center space-y-4">
            <Package className="w-12 h-12 text-yellow-500 mx-auto opacity-50" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold uppercase text-white">No Active Job Assigned</h3>
              <p className="text-xs text-white/50">Your terminal is online and awaiting direct dispatch assignment from the admin control panel.</p>
            </div>
            <button 
              onClick={() => fetchAssignedShipment(driver.assigned_shipment)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Check For New Assignment
            </button>
          </div>
        )}

      </div>
    </div>
  );
}