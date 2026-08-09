import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Navigation, 
  LogOut, 
  Lock, 
  Package, 
  AlertCircle, 
  RefreshCw, 
  Radio, 
  Globe,
  Loader2 
} from 'lucide-react';

// Safe Supabase Initializer
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `http://${hostname}:5000`;
};

const API_URL = getApiUrl();

export default function DriverPortal() {
  // Authentication State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(false);

  // Operational Workflow State
  const [assignedShipment, setAssignedShipment] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [coords, setCoords] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // 0. Auto-login from saved session if available
  useEffect(() => {
    const savedSession = localStorage.getItem('driver_session');
    if (savedSession) {
      try {
        const { name: savedName, email: savedEmail } = JSON.parse(savedSession);
        if (savedName && savedEmail) {
          authenticateDriver(savedName, savedEmail, true);
        }
      } catch (err) {
        localStorage.removeItem('driver_session');
      }
    }
  }, []);

  // 1. Authenticate against Driver Roster
  const authenticateDriver = async (nameInput, emailInput, isAutoLogin = false) => {
    setLoading(true);

    try {
      const queryName = nameInput.trim();
      const queryEmail = emailInput.trim().toLowerCase();

      // Direct Supabase query
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .ilike('name', queryName)
        .eq('email', queryEmail)
        .maybeSingle();

      if (error || !data) {
        // Fallback: Check backend REST API
        const apiRes = await fetch(`${API_URL}/api/admin/drivers`).catch(() => null);
        if (apiRes && apiRes.ok) {
          const allDrivers = await apiRes.json();
          const list = Array.isArray(allDrivers) ? allDrivers : (allDrivers.drivers || []);
          const matched = list.find(d => 
            d.name?.toLowerCase() === queryName.toLowerCase() && 
            d.email?.toLowerCase() === queryEmail
          );

          if (matched) {
            setupAuthenticatedDriver(matched, isAutoLogin);
            return;
          }
        }

        if (!isAutoLogin) toast.error('Access Denied: Unregistered name or email address.');
        localStorage.removeItem('driver_session');
        setLoading(false);
        return;
      }

      setupAuthenticatedDriver(data, isAutoLogin);
    } catch (err) {
      console.error('Authentication Error:', err);
      if (!isAutoLogin) toast.error('Authentication verification error');
    } finally {
      setLoading(false);
    }
  };

  const setupAuthenticatedDriver = (driverData, isAutoLogin) => {
    setDriver(driverData);
    localStorage.setItem('driver_session', JSON.stringify({ name: driverData.name, email: driverData.email }));

    if (!isAutoLogin) {
      toast.success(`Welcome back, ${driverData.name}. Terminal active.`);
    }

    // Check for assigned waybill
    const waybill = driverData.assigned_shipment || driverData.shipment_number;
    if (waybill && waybill !== 'None' && waybill !== 'Unassigned') {
      fetchAssignedShipment(waybill);
    }

    // Auto-start GPS tracking if driver is on field
    if (driverData.status === 'On Field' || driverData.status === 'In Transit') {
      startGpsTracking(driverData.id);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please enter both your full name and email address.');
      return;
    }
    authenticateDriver(fullName, email);
  };

  const handleLogout = () => {
    stopGpsTracking();
    localStorage.removeItem('driver_session');
    setDriver(null);
    setAssignedShipment(null);
    setCoords(null);
    toast.info('Logged out of terminal session');
  };

  // 2. Fetch assigned shipment details
  const fetchAssignedShipment = async (trackingNumber) => {
    if (!trackingNumber || trackingNumber === 'None') return;
    setFetchingJob(true);

    try {
      // 1. Fetch via Supabase
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .maybeSingle();

      if (!error && data) {
        setAssignedShipment(data);
      } else {
        // 2. Fallback REST API
        const res = await fetch(`${API_URL}/api/admin/shipments`).catch(() => null);
        if (res && res.ok) {
          const allShipments = await res.json();
          const list = Array.isArray(allShipments) ? allShipments : (allShipments.shipments || []);
          const found = list.find(s => s.tracking_number === trackingNumber);
          if (found) setAssignedShipment(found);
        }
      }
    } catch (err) {
      console.error('Shipment fetch error:', err);
    } finally {
      setFetchingJob(false);
    }
  };

  // 3. Accept assignment & update status
  const acceptAssignment = async (shipmentNumber) => {
    try {
      // Update Driver status
      await supabase
        .from('drivers')
        .update({ status: 'On Field', assigned_shipment: shipmentNumber })
        .eq('id', driver.id);

      // Update Shipment status
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
      toast.error('Failed to update shipment status');
    }
  };

  // 4. Complete Delivery
  const completeDelivery = async () => {
    if (!assignedShipment || !driver) return;

    try {
      // Mark shipment as Delivered
      await supabase
        .from('shipments')
        .update({ status: 'Delivered' })
        .eq('tracking_number', assignedShipment.tracking_number);

      // Reset driver back to Available
      await supabase
        .from('drivers')
        .update({ status: 'Available', assigned_shipment: 'None' })
        .eq('id', driver.id);

      toast.success('Delivery confirmed! Route completed.');
      stopGpsTracking();

      setDriver({ ...driver, status: 'Available', assigned_shipment: 'None' });
      setAssignedShipment(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete delivery status');
    }
  };

  // 5. Automated GPS Telemetry Tracker
  const startGpsTracking = (driverId) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this device.');
      return;
    }

    setTrackingActive(true);
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        // Update coordinates in database
        await supabase
          .from('drivers')
          .update({ 
            lat: latitude, 
            lng: longitude, 
            last_updated: new Date().toISOString() 
          })
          .eq('id', driverId)
          .catch(() => null);
      },
      (error) => console.warn('GPS Telemetry warning:', error.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
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

  // --- RENDER: Authentication Screen ---
  if (!driver) {
    return (
      <div style={{ fontFamily: 'Inter, monospace' }} className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-12 font-mono">
        <div className="max-w-md w-full bg-[#0e0c0b] border border-white/15 p-8 shadow-2xl relative">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-yellow-500 flex items-center justify-center shadow-xl shadow-yellow-500/20">
            <Lock className="w-8 h-8 text-black stroke-[2.5]" />
          </div>

          <div className="text-center mt-6 mb-8">
            <h2 className="text-2xl font-black uppercase tracking-wider text-white">Driver Portal</h2>
            <p className="text-[11px] text-white/50 uppercase tracking-widest mt-1">Fleet Telemetry & Dispatch Terminal</p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">Full Name</label>
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-black border border-white/20 px-4 py-3.5 text-white focus:outline-none focus:border-yellow-500 text-xs uppercase font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@jblogistics.com"
                className="w-full bg-black border border-white/20 px-4 py-3.5 text-white focus:outline-none focus:border-yellow-500 text-xs"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider py-4 transition-all shadow-xl cursor-pointer text-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Terminal Access...</span>
                </>
              ) : (
                'Authenticate Terminal'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: Active Driver Operations Screen ---
  return (
    <div style={{ fontFamily: 'Inter, monospace' }} className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-mono">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Terminal Header & Status */}
        <div className="bg-[#0e0c0b] border border-white/15 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 text-[10px] uppercase font-bold tracking-widest">Active Fleet Unit</span>
              {trackingActive && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 font-bold uppercase">
                  <Radio className="w-3 h-3 animate-pulse" /> Live GPS Broadcast
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white mt-1">{driver.name}</h1>
            {coords && (
              <p className="text-[11px] text-white/40 font-mono mt-1">
                GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className={`px-3 py-1.5 border text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${
              driver.status === 'On Field' || driver.status === 'In Transit'
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${trackingActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
              {driver.status || 'Available'}
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-colors"
              title="Logout Terminal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assigned Waybill Card */}
        {assignedShipment ? (
          <div className="bg-[#0e0c0b] border border-yellow-500/40 p-6 md:p-8 shadow-2xl space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-yellow-500 text-[10px] uppercase tracking-widest block font-bold">Active Waybill Assignment</span>
                <h3 className="text-xl font-black uppercase text-white font-mono">{assignedShipment.tracking_number}</h3>
              </div>
              <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold uppercase">
                {assignedShipment.status || 'In Transit'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-black/60 p-4 border border-white/10 space-y-1">
                <span className="text-white/40 text-[10px] uppercase font-bold">Origin Location</span>
                <p className="font-bold flex items-center gap-2 text-white">
                  <MapPin className="w-4 h-4 text-yellow-500 shrink-0" /> 
                  <span>{assignedShipment.origin || 'Main Distribution Depot'}</span>
                </p>
              </div>

              <div className="bg-black/60 p-4 border border-white/10 space-y-1">
                <span className="text-white/40 text-[10px] uppercase font-bold">Destination Address</span>
                <p className="font-bold flex items-center gap-2 text-white">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" /> 
                  <span>{assignedShipment.destination || 'Client Destination'}</span>
                </p>
              </div>
            </div>

            {(assignedShipment.client_name || assignedShipment.client_phone) && (
              <div className="bg-black/60 p-4 border border-white/10 text-xs space-y-1">
                <span className="text-white/40 text-[10px] uppercase font-bold block">Recipient Information</span>
                <p className="font-bold text-white">
                  {assignedShipment.client_name || 'Client'} 
                  {assignedShipment.client_phone ? ` — ${assignedShipment.client_phone}` : ''}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-white/10">
              <button 
                onClick={completeDelivery}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-wider py-4 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm & Mark Delivery Complete
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0e0c0b] border border-white/15 p-8 shadow-2xl text-center space-y-5">
            <Package className="w-12 h-12 text-yellow-500 mx-auto opacity-60" />
            
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-black uppercase text-white">No Active Job Assigned</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Your terminal is online and available. Dispatch managers will assign waybills directly to your unit.
              </p>
            </div>

            <button 
              onClick={() => fetchAssignedShipment(driver.assigned_shipment || driver.shipment_number)}
              disabled={fetchingJob}
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer inline-flex items-center gap-2 border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingJob ? 'animate-spin text-yellow-500' : ''}`} />
              <span>{fetchingJob ? 'Checking Dispatch...' : 'Check For Assignments'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}