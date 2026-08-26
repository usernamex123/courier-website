import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import DriverSidebar from './DriverSidebar';
import DriverHeader from './DriverHeader';
import { 
  Menu, 
  Bell, 
  Truck, 
  Package, 
  Scan, 
  LayoutDashboard, 
  User, 
  X 
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export default function DriverMobileLayout({ children, title, subtitle, activePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Automatically close mobile menu when route changes to prevent overlay bugs
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Security Verification
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

  const [driver] = useState(() => {
    try {
      const savedDriverData = localStorage.getItem('driver_data') || localStorage.getItem('driver_session');
      if (savedDriverData) {
        return JSON.parse(savedDriverData);
      }
    } catch (e) {}
    return {
      name: 'Driver',
      avatar: null
    };
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden md:flex">
        <DriverSidebar activePage={activePage} />
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-28 md:pb-6">

        {/* ================= DESKTOP HEADER ================= */}
        {title && (
          <div className="hidden md:block">
            <DriverHeader title={title} subtitle={subtitle} />
          </div>
        )}

        {/* ================= MOBILE APP HEADER ================= */}
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
            
            {/* Grey Default Avatar Fallback */}
            <div className="relative">
              {driver?.avatar ? (
                <img 
                  src={driver.avatar} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-600 shadow-xs">
                  <User className="w-5 h-5" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
          </div>
        </header>

        {/* Mobile Greeting / Title Banner */}
        {title && (
          <div className="md:hidden px-6 py-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle && <p className="text-xs font-medium text-slate-500">{subtitle}</p>}
          </div>
        )}

        {/* Page Body Content */}
        <div className="p-6 space-y-6 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>

      {/* ================= FIXED MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 flex justify-between items-center z-50 shadow-lg">
        <button 
          onClick={() => navigate('/driver-portal')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            currentPath.includes('/dashboard') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${currentPath.includes('/dashboard') ? 'fill-amber-100' : ''}`} />
          <span className={`text-[10px] ${currentPath.includes('/dashboard') ? 'font-black' : 'font-bold'}`}>Dashboard</span>
        </button>

        <button 
          onClick={() => navigate('/driver-portal/shipments')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            currentPath.includes('/shipments') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Package className={`w-5 h-5 ${currentPath.includes('/shipments') ? 'fill-amber-100' : ''}`} />
          <span className={`text-[10px] ${currentPath.includes('/shipments') ? 'font-black' : 'font-bold'}`}>Shipments</span>
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
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            currentPath.includes('/profile') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <User className={`w-5 h-5 ${currentPath.includes('/profile') ? 'fill-amber-100' : ''}`} />
          <span className={`text-[10px] ${currentPath.includes('/profile') ? 'font-black' : 'font-bold'}`}>Profile</span>
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
                  { label: 'Dashboard', path: '/driver-portal' },
                  { label: 'My Shipments', path: '/driver-portal/shipments' },
                  { label: 'Scan Shipment', path: '/driver-portal/scan' },
                  { label: 'Profile Settings', path: '/driver-portal/profile' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setMobileMenuOpen(false); navigate(item.path); }}
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