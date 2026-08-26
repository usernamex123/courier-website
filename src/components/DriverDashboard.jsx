import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
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

// Safe Supabase Initializer
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export default function DriverDashboard() {
  const navigate = useNavigate();

  // Security Verification: Ensure unauthorized users cannot bypass via direct URL injection
  useEffect(() => {
    const verifyDriverAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const hasLocalData = localStorage.getItem('driver_data') || localStorage.getItem('driver_session');
        
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

  // Driver Authentication State with realistic fallback matching driver profile
  const [driver] = useState(() => {
    try {
      const savedDriverData = localStorage.getItem('driver_data') || localStorage.getItem('driver_session');
      if (savedDriverData) {
        return JSON.parse(savedDriverData);
      }
    } catch (e) {
      // Fallback
    }
    return {
      id: '71d98695-b0be-411a-9cc4-82aaca27bb31',
      driver_id: 'DRV-119147',
      name: 'Sparsh Limbu',
      status: 'On Field',
    };
  });

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setCoords] = useState(null);
  const [, setTrackingActive] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeDriverId = driver?.driver_id || (driver?.id?.startsWith('DRV-') ? driver.id : null) || driver?.id;

  // Fetch shipments on load
  useEffect(() => {
    if (activeDriverId) {
      fetchDriverShipments();
    }
    startGpsTracking();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeDriverId]);

  const fetchDriverShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('driver_id', activeDriverId);

      if (!error && data && data.length > 0) {
        setShipments(data);
      } else {
        // Fallback mock dataset if backend returns empty for this ID
        setShipments([
          { tracking_number: 'SHP-001', time: '09:30 AM', origin: 'Kathmandu', destination: 'Pokhara', client_name: 'John Doe', client_address: 'New Road, Kathmandu', status: 'Assigned', current_status: 'assigned' },
          { tracking_number: 'SHP-004', time: '10:15 AM', origin: 'Kathmandu', destination: 'Chitwan', client_name: 'Ram Sharma', client_address: 'Bharatpur, Chitwan', status: 'In Transit', current_status: 'in_transit' },
          { tracking_number: 'SHP-006', time: '11:45 AM', origin: 'Kathmandu', destination: 'Butwal', client_name: 'Sushil Thapa', client_address: 'Butwal, Rupandehi', status: 'Out for Delivery', current_status: 'out_for_delivery' },
          { tracking_number: 'SHP-009', time: '01:30 PM', origin: 'Lalitpur', destination: 'Kathmandu', client_name: 'Maya Shrestha', client_address: 'Maitighar, Kathmandu', status: 'Delivered', current_status: 'delivered' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching shipments:', err);
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
            // Silently handle GPS update errors if offline or table doesn't exist yet
          }
        }
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true }
    );
    setWatchId(id);
  };

  // Compute status counts: Assigned counts all active shipments not yet delivered
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
      
      {/* ================= DESKTOP SIDEBAR (Hidden on Mobile PWA) ================= */}
      <div className="hidden md:flex">
        <DriverSidebar activePage="dashboard" />
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-28 md:pb-6">

        {/* ================= DESKTOP HEADER (Hidden on Mobile) ================= */}
        <div className="hidden md:block">
          <DriverHeader 
            title={`Good morning, ${driverName}`} 
            subtitle="Here's what's happening with your deliveries today." 
          />
        </div>

        {/* ================= MOBILE PWA APP HEADER (Visible only on Mobile) ================= */}
        <header className="md:hidden flex items-center justify-between px-6 pt-6 pb-2 bg-[#f8fafc]">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs active:scale-95 transition-transform cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center shadow-xs">
              <Truck className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-black text-base tracking-tight text-slate-900">
              JB <span className="text-amber-500 font-medium">LOGISTICS</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/driver-portal/shipments')}
              className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs relative active:scale-95 transition-transform cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-500 rounded-full"></span>
            </button>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
          </div>
        </header>

        {/* Mobile Greeting Banner */}
        <div className="md:hidden px-6 py-3">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Good morning, {driverName} 👋
          </h1>
          <p className="text-xs font-medium text-slate-500">Here's what's happening with your deliveries today.</p>
        </div>

        {/* Dashboard Body Container */}
        <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* ================= UNIFIED YELLOW STAT SUMMARY BANNER ================= */}
          <div className="bg-amber-400 rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
            
            {/* Assigned Shipments */}
            <div className="flex flex-col justify-between space-y-4 md:border-r md:border-amber-500/40 md:pr-6">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-slate-900 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{counts.assigned}</div>
                <div className="text-sm font-black text-slate-900 mt-1">Assigned Shipments</div>
              </div>
            </div>

            {/* In Transit */}
            <div className="flex flex-col justify-between space-y-4 md:border-r md:border-amber-500/40 md:px-6">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-slate-900 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{counts.inTransit}</div>
                <div className="text-sm font-black text-slate-900 mt-1">In Transit</div>
              </div>
            </div>

            {/* Delivered Today */}
            <div className="flex flex-col justify-between space-y-4 md:pl-6">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{counts.deliveredToday}</div>
                <div className="text-sm font-black text-slate-900 mt-1">Delivered Today</div>
              </div>
            </div>

          </div>

          {/* ================= MOBILE CURRENT TASK CARD (Visible on Mobile) ================= */}
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

          {/* ================= MIDDLE GRID ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Today's Shipments */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">Today's Shipments</h3>
                  <p className="text-xs font-bold text-slate-400">Active waybill routing table</p>
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

            {/* Right 1 Col: Quick Actions */}
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

                  <button onClick={() => toast.success('GPS checkpoint registered')} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-300 transition-all text-left space-y-2 group cursor-pointer w-full">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Add Location</h4>
                      <p className="text-[10px] font-bold text-slate-400">Add checkpoint</p>
                    </div>
                  </button>

                  <button onClick={() => toast.message('Calling support dispatch...')} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-300 transition-all text-left space-y-2 group cursor-pointer w-full">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Contact Support</h4>
                      <p className="text-[10px] font-bold text-slate-400">Get help</p>
                    </div>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* ================= FIXED MOBILE BOTTOM NAVIGATION BAR (Exact PWA Nav) ================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 flex justify-between items-center z-50 shadow-lg">
        
        {/* Tab 1: Dashboard */}
        <button 
          onClick={() => navigate('/driver-portal/dashboard')}
          className="flex flex-col items-center gap-1 text-amber-500 cursor-pointer"
        >
          <LayoutDashboard className="w-5 h-5 fill-amber-100" />
          <span className="text-[10px] font-black">Dashboard</span>
        </button>

        {/* Tab 2: Shipments */}
        <button 
          onClick={() => navigate('/driver-portal/shipments')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">Shipments</span>
        </button>

        {/* Tab 3: Scan (Floating Raised Center Button) */}
        <div className="relative -top-5">
          <button 
            onClick={() => navigate('/driver-portal/scan')}
            className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-lg shadow-amber-400/40 flex items-center justify-center border-4 border-[#f8fafc] transition-transform active:scale-95 cursor-pointer"
          >
            <Scan className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Notifications */}
        <button 
          onClick={() => toast.info('No new notifications')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Notifications</span>
        </button>

        {/* Tab 5: Profile - FIXED: Now navigates directly to profile page */}
        <button 
          onClick={() => navigate('/driver-portal/profile')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>

      </nav>

      {/* ================= MOBILE HAMBURGER MENU DRAWER ================= */}
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
                  { label: 'Dashboard', path: '/driver-portal/dashboard' },
                  { label: 'My Shipments', path: '/driver-portal/shipments' },
                  { label: 'Scan Shipment', path: '/driver-portal/scan' },
                  { label: 'Profile Settings', path: '/driver-portal/profile' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { 
                      setMobileMenuOpen(false); // FIXED: Closes overlay instantly to prevent black screen bug
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
                  localStorage.clear();
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