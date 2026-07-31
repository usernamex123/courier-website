import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { Loader2, LogOut, FileText, Database, Truck, Navigation, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import ClientQuotes from "./ClientQuotes"; 
import AdminShipments from "./AdminShipments";
import AdminTracking from "./AdminTracking";
import AdminDrivers from "./AdminDrivers"; 

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@jblogisticsservices.com';

// ==========================================
// 1. SECURE CROSS-DEVICE SERVER AUTH GUARD
// ==========================================
export default function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyServerSession = async () => {
      try {
        const verifyRes = await fetch(`${API_URL}/api/admin/verify`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!verifyRes.ok) {
          if (isMounted) {
            setIsAuthenticated(false);
            setIsChecking(false);
          }
          return;
        }

        const verifyData = await verifyRes.json();
        const userEmail = (verifyData.email || '').toLowerCase();
        
        const isAuthed = verifyData.isAuthenticated === true || verifyData.isAdmin === true;
        const emailMatchesIfProvided = userEmail ? userEmail === ADMIN_EMAIL.toLowerCase() : true;
        
        const finalAuthorization = isAuthed && emailMatchesIfProvided;

        if (isMounted) {
          setIsAuthenticated(finalAuthorization);
          setIsChecking(false);
        }
      } catch (err) {
        console.error("[AdminRoute] Critical network/server error during verification:", err);
        if (isMounted) {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      }
    };

    verifyServerSession();

    return () => { isMounted = false; };
  }, [location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen w-full bg-[#070605] flex items-center justify-center text-white font-['Inter',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-yellow-500" />
          <span className="text-sm font-bold text-stone-400">Verifying secure multi-device session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// ==========================================
// 2. SECURE ADMIN NAVIGATION HANDSHAKE TRIGGER
// ==========================================
export const handleAdminHandshakeNavigation = async (navigate) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 150));

    const verifyRes = await fetch(`${API_URL}/api/admin/verify`, {
      method: 'GET',
      credentials: 'include'
    });

    if (verifyRes.ok) {
      const verifyData = await verifyRes.json();
      const userEmail = (verifyData.email || '').toLowerCase();
      const isAuthed = verifyData.isAuthenticated === true || verifyData.isAdmin === true;
      const emailMatchesIfProvided = userEmail ? userEmail === ADMIN_EMAIL.toLowerCase() : true;

      if (isAuthed && emailMatchesIfProvided) {
        toast.success('Security clearance granted. Entering command center...');
        navigate('/admin/dashboard', { replace: true });
        return;
      }
    }
    
    toast.error('Active admin session not found. Please log in first.');
    navigate('/', { replace: true });
  } catch (err) {
    console.error("Navigation security handshake failed", err);
    toast.error('Failed to verify secure credentials.');
    navigate('/', { replace: true });
  }
};

// ==========================================
// 3. ADMIN LOGIN COMPONENT
// ==========================================
export function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-[#070605] flex items-center justify-center text-white font-['Inter',sans-serif]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-yellow-500" />
        <span className="text-sm font-bold text-stone-400">Initializing secure portal...</span>
      </div>
    </div>
  );
}

// ==========================================
// 4. GUEST ONLY ROUTE COMPONENT
// ==========================================
export function GuestOnlyRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify`, {
          method: 'GET',
          credentials: 'include'
        }).catch(() => ({ ok: false }));
        
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(!!data.isAuthenticated || !!data.user);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen w-full bg-[#070605] flex items-center justify-center text-white font-['Inter',sans-serif]">
        <Loader2 size={32} className="animate-spin text-yellow-500" />
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ==========================================
// 5. ADMIN OVERVIEW SUB-VIEW COMPONENT
// ==========================================
function AdminOverview() {
  const [stats, setStats] = useState({
    totalQuotes: 0,
    activeDrivers: 0,
    driversOnField: 0,
    ongoingShipments: 0,
    unassignedShipments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const quotesRes = await fetch(`${API_URL}/api/admin/messages`, { credentials: 'include' }).catch(() => ({ ok: false }));
        let quotesData = [];
        if (quotesRes.ok) {
          const json = await quotesRes.json();
          quotesData = Array.isArray(json) ? json : (json.data || json.messages || []);
        }

        const { data: driversData } = await supabase.from('drivers').select('*');
        const { data: shipmentsData } = await supabase.from('shipments').select('*');

        const drivers = driversData || [];
        const shipments = shipmentsData || [];

        const totalQuotes = quotesData.length;
        const activeDrivers = drivers.length;
        const driversOnField = drivers.filter(d => d.status === 'On Field').length;

        const ongoingShipments = shipments.filter(s => {
          const isNotCompleted = s.status !== 'Delivered' && s.status !== 'Cancelled';
          const hasDriverAssigned = drivers.some(d => d.assigned_shipment === s.tracking_number);
          const hasDirectDriver = s.driverId || s.driverName || s.assignedDriver;
          return isNotCompleted && (hasDriverAssigned || hasDirectDriver);
        }).length;

        const unassignedShipments = shipments.filter(s => {
          const isNotCompleted = s.status !== 'Delivered' && s.status !== 'Cancelled';
          const hasDriverAssigned = drivers.some(d => d.assigned_shipment === s.tracking_number);
          const hasDirectDriver = s.driverId || s.driverName || s.assignedDriver;
          return isNotCompleted && !hasDriverAssigned && !hasDirectDriver;
        }).length;

        setStats({ totalQuotes, activeDrivers, driversOnField, ongoingShipments, unassignedShipments });
      } catch (err) {
        console.error("Failed to load overview statistics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-r from-[#100e0c] to-[#171412] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 blur-[80px] pointer-events-none"></div>
        <span className="text-yellow-500 font-mono text-[11px] font-bold uppercase tracking-widest block mb-1">JB Logistics Command</span>
        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">System Control Center</h3>
        <p className="text-xs text-white/50 uppercase tracking-wider mt-2">Real-time overview of your logistics network and operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <span className="text-[11px] uppercase tracking-widest text-white/50 block mb-2 font-bold">Total Quotes Requested</span>
          <span className="text-5xl font-black text-yellow-500 tracking-tight font-mono">
            {loading ? <span className="animate-pulse">...</span> : stats.totalQuotes}
          </span>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mt-4 pt-4 border-t border-white/5">Awaiting review & auto-responses</p>
        </div>

        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <span className="text-[11px] uppercase tracking-widest text-white/50 block mb-2 font-bold">Ongoing Shipments</span>
          <span className="text-5xl font-black text-yellow-500 tracking-tight font-mono">
            {loading ? <span className="animate-pulse">...</span> : stats.ongoingShipments}
          </span>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mt-4 pt-4 border-t border-white/5">In-transit with assigned driver</p>
        </div>

        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-red-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <span className="text-[11px] uppercase tracking-widest text-white/50 block mb-2 font-bold">Unassigned Shipments</span>
          <div className="flex items-center justify-between">
            <span className="text-5xl font-black text-red-400 tracking-tight font-mono">
              {loading ? <span className="animate-pulse">...</span> : stats.unassignedShipments}
            </span>
            {stats.unassignedShipments > 0 && (
              <span className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full animate-pulse">
                <AlertCircle className="w-5 h-5" />
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mt-4 pt-4 border-t border-white/5">Active shipments needing dispatch</p>
        </div>

        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <span className="text-[11px] uppercase tracking-widest text-white/50 block mb-2 font-bold">Total Active Drivers</span>
          <span className="text-5xl font-black text-yellow-500 tracking-tight font-mono">
            {loading ? <span className="animate-pulse">...</span> : stats.activeDrivers}
          </span>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mt-4 pt-4 border-t border-white/5">Registered drivers in roster</p>
        </div>

        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-green-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <span className="text-[11px] uppercase tracking-widest text-white/50 block mb-2 font-bold">Drivers on Field</span>
          <span className="text-5xl font-black text-green-400 tracking-tight font-mono">
            {loading ? <span className="animate-pulse">...</span> : stats.driversOnField}
          </span>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mt-4 pt-4 border-t border-white/5">Actively broadcasting GPS location</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. ADMIN DASHBOARD CONTAINER & LAYOUT
// ==========================================
export function AdminDashboardContainer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleExitAction = async () => {
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    toast.info('Exited admin terminal securely');
    navigate('/', { replace: true });
  };

  const currentPath = location.pathname;
  const isOverviewActive = currentPath === '/admin/dashboard' || currentPath === '/admin/dashboard/';

  return (
    <div className="min-h-screen bg-[#050505] tech-grid text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-[#0c0a09] border-r border-white/10 p-6 flex flex-col justify-between shrink-0 shadow-2xl">
        <div className="space-y-8">
          <div className="px-2 pt-2">
            <h1 className="text-2xl font-black uppercase tracking-wider text-yellow-500">JB Logistics</h1>
            <p className="text-[10px] tracking-widest uppercase text-white/40 font-mono mt-1">Admin Operations Terminal</p>
          </div>

          <nav className="space-y-2">
            <Link 
              to="/admin/dashboard" 
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                isOverviewActive 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'bg-transparent text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <Database className="w-4 h-4 text-yellow-500" /> Overview
            </Link>

            <Link 
              to="/admin/dashboard/quotes" 
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                location.pathname.includes('/quotes') 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-yellow-500" /> Quotes & Messages
            </Link>

            <Link 
              to="/admin/dashboard/shipments" 
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                location.pathname.includes('/shipments') 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <Truck className="w-4 h-4 text-yellow-500" /> Active Shipments
            </Link>

            <Link 
              to="/admin/dashboard/drivers" 
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                location.pathname.includes('/drivers') 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <Users className="w-4 h-4 text-yellow-500" /> Drivers Dispatch
            </Link>

            <Link 
              to="/admin/dashboard/tracking" 
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                location.pathname.includes('/tracking') 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <Navigation className="w-4 h-4 text-yellow-500" /> Live Tracking
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="px-2 flex items-center gap-3 bg-[#13100e] p-3 border border-white/5 rounded-lg">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shrink-0"></div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Logged in as</span>
              <span className="text-xs font-bold text-white uppercase tracking-wider truncate block">Administrator</span>
            </div>
          </div>
          
          <button 
            onClick={handleExitAction}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 py-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all border border-red-500/20 cursor-pointer shadow-lg"
          >
            <LogOut className="w-4 h-4" /> Exit to Public Site
          </button>
        </div>
      </aside>

      <main className="flex-grow p-6 md:p-10 overflow-y-auto bg-transparent">
        <Routes>
          <Route path="/admin/dashboard" element={<AdminOverview />} />
          <Route path="/admin/dashboard/quotes" element={<ClientQuotes />} />
          <Route path="/admin/dashboard/shipments" element={<AdminShipments />} />
          <Route path="/admin/dashboard/drivers" element={<AdminDrivers />} />
          <Route path="/admin/dashboard/tracking" element={<AdminTracking />} />
        </Routes>
      </main>
    </div>
  );
}