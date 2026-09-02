import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import DriverHeader from './DriverHeader';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  QrCode, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Truck,
  Loader2,
  Menu,
  Bell,
  ChevronRight,
  Scan,
  LayoutDashboard,
  User,
  X
} from 'lucide-react';
import DriverSidebar from './DriverSidebar';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

export default function DriverDashboard() {
  const navigate = useNavigate();
  const watchIdRef = useRef(null);

  // Driver Authentication State loaded strictly from session storage with backend cookie fallback
  const [driver, setDriver] = useState(() => {
    try {
      const savedDriverData = localStorage.getItem('driver_data') || localStorage.getItem('driver_session');
      if (savedDriverData) {
        return JSON.parse(savedDriverData);
      }
    } catch (e) {
      // Silent catch
    }
    return null;
  });

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setCoords] = useState(null);
  const [, setTrackingActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Security Verification & Backend Session Sync
  useEffect(() => {
    const verifyDriverAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let hasLocalData = localStorage.getItem('driver_data') || localStorage.getItem('driver_session');
        
        if (!session && !hasLocalData) {
          // Validate Express session cookie via backend profile endpoint
          try {
            const res = await fetch(`${API_URL}/api/driver/profile`, {
              credentials: 'include'
            });
            if (res.ok) {
              const data = await res.json();
              if (data && (data.driver || data.user)) {
                const driverObj = data.driver || data.user;
                localStorage.setItem('driver_data', JSON.stringify(driverObj));
                setDriver(driverObj);
                hasLocalData = true;
              }
            }
          } catch (backendErr) {
            // Backend session check failed
          }
        }

        if (!session && !hasLocalData) {
          toast.error('Unauthorized access. Please log in as a driver.');
          navigate('/');
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      }
    };
    verifyDriverAuth();
  }, [navigate]);

  const activeDriverId = driver?.driver_id || (driver?.id?.startsWith('DRV-') ? driver.id : null) || driver?.id;

  // Fetch shipments and handle GPS tracking cleanup via useRef
  useEffect(() => {
    if (activeDriverId) {
      fetchDriverShipments();
    }
    startGpsTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [activeDriverId]);

  const fetchDriverShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('driver_id', activeDriverId);

      if (error) throw error;
      setShipments(data || []);
    } catch (err) {
      console.error('Error fetching shipments:', err);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const startGpsTracking = () => {
    if (!navigator.geolocation) return;
    setTrackingActive(true);
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        if (activeDriverId) {
          try {
            await supabase
              .from('driver_profiles')
              .update({ lat: latitude, lng: longitude, last_updated: new Date().toISOString() })
              .eq('id', activeDriverId);
          } catch (err) {
            // Silently handle GPS update errors if offline
          }
        }
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true }
    );
    watchIdRef.current = id;
  };

  const counts = {
    assigned: shipments.filter(s => (s.current_status || s.status || '').toLowerCase() !== 'delivered').length,
    inTransit: shipments.filter(s => {
      const st = (s.current_status || s.status || '').toLowerCase();
      return st === 'in_transit' || st === 'out_for_delivery';
    }).length,
    deliveredToday: shipments.filter(s => (s.current_status || s.status || '').toLowerCase() === 'delivered').length,
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch(s) {
      case 'assigned':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Assigned</span>;
      case 'in_transit':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>In Transit</span>;
      case 'out_for_delivery':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>Out for Delivery</span>;
      case 'delivered':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Delivered</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">{status.replace(/_/g, ' ')}</span>;
    }
  };

  const driverName = driver?.name || 'Driver';
  const currentTask = shipments.find(s => (s.current_status || s.status || '').toLowerCase() !== 'delivered') || shipments[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex">
      
      <div className="hidden md:flex">
        <DriverSidebar activePage="dashboard" />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-28 md:pb-6">

        <div className="hidden md:block">
          <DriverHeader 
            title={`Good morning, ${driverName}`} 
            subtitle="Here's what's happening with your deliveries today." 
          />
        </div>

        <header className="md:hidden flex items-center justify-between px-6 pt-6 pb-3 bg-[#f8fafc]">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs active:scale-95 transition-transform cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-base font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>

          <div className="w-10"></div>
        </header>

        <div className="md:hidden px-6 py-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Good morning, {driverName} 👋
          </h2>
          <p className="text-xs font-medium text-slate-500">Here's what's happening with your deliveries today.</p>
        </div>

        <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          <div className="bg-amber-400 rounded-3xl p-4 md:p-6 shadow-sm grid grid-cols-3 gap-2 md:gap-6 relative overflow-hidden">
            
            <div className="flex flex-col justify-between space-y-3 md:space-y-4 border-r border-amber-500/40 pr-2 md:pr-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white shadow-xs text-slate-900 flex items-center justify-center">
                <Package className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{counts.assigned}</div>
                <div className="text-[11px] md:text-sm font-black text-slate-900 mt-0.5 md:mt-1">Assigned Shipments</div>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-3 md:space-y-4 border-r border-amber-500/40 px-2 md:px-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white shadow-xs text-slate-900 flex items-center justify-center">
                <Truck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{counts.inTransit}</div>
                <div className="text-[11px] md:text-sm font-black text-slate-900 mt-0.5 md:mt-1">In Transit</div>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-3 md:space-y-4 pl-2 md:pl-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white shadow-xs text-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{counts.deliveredToday}</div>
                <div className="text-[11px] md:text-sm font-black text-slate-900 mt-0.5 md:mt-1">Delivered Today</div>
              </div>
            </div>

          </div>

          {currentTask && (
            <div className="md:hidden bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-slate-900">Current Task</h3>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {currentTask.status || currentTask.current_status}
                </span>
              </div>

              <div 
                onClick={() => navigate(`/driver-portal/shipments?openUpdate=${currentTask.tracking_number}`)}
                className="flex items-start gap-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 cursor-pointer hover:border-amber-400 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                  <Package className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-black text-slate-900 text-sm">Shipment #{currentTask.tracking_number}</h4>
                  <div className="text-[11px] font-medium text-slate-500">
                    <span>Pick up from</span>
                    <p className="font-bold text-slate-800 truncate">{currentTask.origin || 'Kathmandu'}</p>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 pt-0.5">
                    <span>Deliver to</span>
                    <p className="font-bold text-slate-800 truncate">{currentTask.client_address || currentTask.destination}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 self-center" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button 
                  onClick={() => navigate(`/driver-portal/shipments?openUpdate=${currentTask.tracking_number}`)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-slate-600" />
                  <span>View Details</span>
                </button>
                <button 
                  onClick={() => navigate('/driver-portal/scan')}
                  className="py-3 px-4 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-2xl text-xs font-black transition-all shadow-xs shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan Shipment</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">Today's Shipments</h3>
                  <p className="text-xs font-bold text-slate-400"></p>
                </div>
                <button 
                  onClick={() => navigate('/driver-portal/shipments')}
                  className="md:hidden text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : shipments.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  No shipments assigned for today.
                </div>
              ) : (
                <div className="space-y-3">
                  {shipments.slice(0, 4).map((s, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => navigate(`/driver-portal/shipments?openUpdate=${s.tracking_number}`)}
                      className="p-4 rounded-2xl border border-slate-100 hover:border-amber-400 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all cursor-pointer group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xs text-slate-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200/80 font-mono">
                            {s.tracking_number}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{s.origin || 'Kathmandu'} → {s.destination}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-3 pl-0.5">
                          <span>{s.client_name || s.recipient_name || 'Client Name'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400 truncate"><MapPin className="w-3 h-3 text-amber-500 shrink-0" /> {s.client_address || s.destination}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs font-mono font-bold text-slate-500">{s.time || '09:30 AM'}</span>
                        {getStatusBadge(s.current_status || s.status || 'Assigned')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="font-black text-lg text-slate-900 tracking-tight">Quick Actions</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <a href="/driver-portal/scan" className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-300 transition-all text-left space-y-2 group block">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Scan Shipment</h4>
                      <p className="text-[10px] font-bold text-slate-400">Scan QR / Barcode</p>
                    </div>
                  </a>

                  <a href="/driver-portal/shipments" className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-300 transition-all text-left space-y-2 group block">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Manual Update</h4>
                      <p className="text-[10px] font-bold text-slate-400">Update status</p>
                    </div>
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 flex justify-between items-center z-50 shadow-lg">
        
        <button 
          onClick={() => navigate('/driver-portal')}
          className="flex flex-col items-center gap-1 text-amber-500 cursor-pointer"
        >
          <LayoutDashboard className="w-5 h-5 fill-amber-100" />
          <span className="text-[10px] font-black">Dashboard</span>
        </button>

        <button 
          onClick={() => navigate('/driver-portal/shipments')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">Shipments</span>
        </button>

        <div className="relative -top-5">
          <button 
            onClick={() => navigate('/driver-portal/scan')}
            className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-lg shadow-amber-400/40 flex items-center justify-center border-4 border-[#f8fafc] transition-transform active:scale-95 cursor-pointer"
          >
            <Scan className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button 
          onClick={() => toast.info('No new notifications')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Notifications</span>
        </button>

        <button 
          onClick={() => navigate('/driver-portal/profile')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>

      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex animate-in fade-in duration-200">
          <div className="bg-white w-72 h-full shadow-2xl p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-slate-900" />
                  </div>
                  <span className="font-black text-base text-slate-900">JB Logistics</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Dashboard', path: '/driver-portal' },
                  { label: 'My Shipments', path: '/driver-portal/shipments' },
                  { label: 'Scan Shipment', path: '/driver-portal/scan' },
                  { label: 'Profile Settings', path: '/driver-portal/profile' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { 
                      setMobileMenuOpen(false); 
                      navigate(item.path); 
                    }}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  localStorage.removeItem('driver_data');
                  localStorage.removeItem('driver_session');
                  navigate('/');
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

    </div>
  );
}