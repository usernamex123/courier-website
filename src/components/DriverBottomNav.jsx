import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Scan, Bell, User } from 'lucide-react';

export default function DriverBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 flex justify-between items-center z-50 shadow-lg">
      
      {/* Tab 1: Dashboard */}
      <button 
        onClick={() => navigate('/driver-portal')}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          currentPath.includes('/dashboard') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 ${currentPath.includes('/dashboard') ? 'fill-amber-100' : ''}`} />
        <span className="text-[10px] font-black">Dashboard</span>
      </button>

      {/* Tab 2: Shipments */}
      <button 
        onClick={() => navigate('/driver-portal/shipments')}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          currentPath.includes('/shipments') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <Package className={`w-5 h-5 ${currentPath.includes('/shipments') ? 'fill-amber-100' : ''}`} />
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
        onClick={() => navigate('/driver-portal/notifications')}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          currentPath.includes('/notifications') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <Bell className="w-5 h-5" />
        <span className="text-[10px] font-bold">Notifications</span>
      </button>

      {/* Tab 5: Profile */}
      <button 
        onClick={() => navigate('/driver-portal/profile')}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          currentPath.includes('/profile') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-bold">Profile</span>
      </button>

    </nav>
  );
}