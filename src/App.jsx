import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Toaster, toast } from 'sonner';
import { Lock, ShieldCheck, LogOut, FileText, Database, Truck, Navigation, Users, AlertCircle, ArrowUpRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Layout from "./layout/layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import GroundFreight from "./components/GroundFreight";
import GetStarted from "./components/GetStarted";
import ClientQuotes from "./components/ClientQuotes"; 
import AdminShipments from "./components/AdminShipments";
import AdminTracking from "./components/AdminTracking";
import AdminDrivers from "./components/AdminDrivers"; 
import DriverTracker from "./components/DriverTracker"; 
import LegalNotice from "./components/LegalNotice";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ==========================================
// SECURE AUTHENTICATION CHECKER HOOK
// ==========================================
const useAuth = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/verify', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setIsAdminAuthenticated(data.isAuthenticated))
      .catch(() => setIsAdminAuthenticated(false));
  }, []);

  const login = async (password) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAdminAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAdminAuthenticated(false);
    } catch {
      setIsAdminAuthenticated(false);
    }
  };

  return { isAdminAuthenticated, login, logout };
};

// ==========================================
// PROTECTED ROUTE WRAPPER
// ==========================================
function ProtectedAdminRoute({ children }) {
  const { isAdminAuthenticated } = useAuth();

  if (isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#050505] tech-grid text-white flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-xs uppercase tracking-widest text-white/50">Verifying security session...</p>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// ==========================================
// ADMIN LOGIN COMPONENT
// ==========================================
function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(password);
    if (success) {
      toast.success('Successfully authenticated');
      navigate('/admin/dashboard');
    } else {
      setError(true);
      toast.error('Invalid security passkey');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] tech-grid text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#0e0c0b]/90 border border-white/10 p-8 shadow-2xl relative backdrop-blur-xl">
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <Lock className="w-7 h-7 text-black stroke-[2.5]" />
        </div>
        
        <div className="text-center mt-6 mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">Admin Portal</h2>
          <p className="text-xs text-white/50 uppercase tracking-widest mt-1.5 font-mono">JB Logistics Restricted Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/70 mb-2">Security Passkey</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Enter admin password..."
              className="w-full bg-[#050505] border border-white/15 px-4 py-3.5 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all text-xs font-mono"
              required
            />
            {error && <p className="text-red-400 text-[11px] mt-2 uppercase tracking-wide font-bold">Invalid security passkey</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider py-4 transition-all duration-300 shadow-xl shadow-yellow-500/10 cursor-pointer text-xs flex items-center justify-center gap-2 group"
          >
            Authenticate & Access <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-5">
          <Link to="/" className="text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-yellow-400 transition-colors">
            &larr; Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ADMIN DASHBOARD OVERVIEW SUB-VIEW
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
        const quotesRes = await fetch('http://localhost:5000/api/admin/messages', { credentials: 'include' }).catch(() => ({ ok: false }));
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
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#100e0c] to-[#171412] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 blur-[80px] pointer-events-none"></div>
        <span className="text-yellow-500 font-mono text-[11px] font-bold uppercase tracking-widest block mb-1">JB Logistics Command</span>
        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">System Control Center</h3>
        <p className="text-xs text-white/50 uppercase tracking-wider mt-2">Real-time overview of your logistics network and operations</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors"></div>
          <span className="text-[11px] uppercase tracking-widest text-white/50 block mb-2 font-bold">Total Quotes Requested</span>
          <span className="text-5xl font-black text-yellow-500 tracking-tight font-mono">
            {loading ? <span className="animate-pulse">...</span> : stats.totalQuotes}
          </span>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mt-4 pt-4 border-t border-white/5">Awaiting review & auto-responses</p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors"></div>
          <span className="text-[11px] uppercase tracking-widest text-white/50 block mb-2 font-bold">Ongoing Shipments</span>
          <span className="text-5xl font-black text-yellow-500 tracking-tight font-mono">
            {loading ? <span className="animate-pulse">...</span> : stats.ongoingShipments}
          </span>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mt-4 pt-4 border-t border-white/5">In-transit with assigned driver</p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-red-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
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

        {/* Card 4 */}
        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors"></div>
          <span className="text-[11px] uppercase tracking-widest text-white/50 block mb-2 font-bold">Total Active Drivers</span>
          <span className="text-5xl font-black text-yellow-500 tracking-tight font-mono">
            {loading ? <span className="animate-pulse">...</span> : stats.activeDrivers}
          </span>
          <p className="text-[11px] text-white/40 uppercase tracking-wider mt-4 pt-4 border-t border-white/5">Registered drivers in roster</p>
        </div>

        {/* Card 5 */}
        <div className="bg-[#0e0c0b]/90 border border-white/10 p-6 relative overflow-hidden group hover:border-green-500/50 transition-all duration-300 shadow-xl backdrop-blur-sm">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors"></div>
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
// ADMIN DASHBOARD CONTAINER & SIDEBAR
// ==========================================
function AdminDashboardContainer() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutAction = async () => {
    await logout();
    toast.info('Logged out securely');
    navigate('/admin/login');
  };

  const currentPath = location.pathname;
  const isOverviewActive = currentPath === '/admin/dashboard' || currentPath === '/admin/dashboard/';

  return (
    <div className="min-h-screen bg-[#050505] tech-grid text-white flex flex-col md:flex-row">
      {/* Sidebar */}
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

            <NavLink 
              to="/admin/dashboard/quotes" 
              className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                isActive 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-yellow-500" /> Quotes & Messages
            </NavLink>

            <NavLink 
              to="/admin/dashboard/shipments" 
              className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                isActive 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <Truck className="w-4 h-4 text-yellow-500" /> Active Shipments
            </NavLink>

            <NavLink 
              to="/admin/dashboard/drivers" 
              className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                isActive 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <Users className="w-4 h-4 text-yellow-500" /> Drivers Dispatch
            </NavLink>

            <NavLink 
              to="/admin/dashboard/tracking" 
              className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                isActive 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <Navigation className="w-4 h-4 text-yellow-500" /> Live Tracking
            </NavLink>
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
            onClick={handleLogoutAction}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 py-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all border border-red-500/20 cursor-pointer shadow-lg"
          >
            <LogOut className="w-4 h-4" /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto bg-transparent">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/quotes" element={<ClientQuotes />} />
          <Route path="/shipments" element={<AdminShipments />} />
          <Route path="/drivers" element={<AdminDrivers />} />
          <Route path="/tracking" element={<AdminTracking />} />
        </Routes>
      </main>
    </div>
  );
}

// ==========================================
// MAIN APP ROUTER
// ==========================================
export default function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      
      {/* Global CSS Style injection for the subtle patterned background */}
      <style>{`
        .tech-grid {
          background-image: 
            radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 24px 24px, 48px 48px, 48px 48px;
          background-position: 0 0, 0 0, 0 0;
        }
      `}</style>

      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard/*" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboardContainer />
            </ProtectedAdminRoute>
          } 
        />
        
        <Route path="/driver-portal" element={<DriverTracker />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Auth />} />
          <Route path="ground-freight" element={<GroundFreight />} />
          <Route path="get-started" element={<GetStarted />} />
          <Route path="privacy-policy" element={<LegalNotice />} />
        </Route>
      </Routes>
    </>
  );
}