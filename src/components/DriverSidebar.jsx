import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  QrCode, 
  CheckCircle2, 
  Bell, 
  User, 
  LogOut, 
  Truck,
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../supabase';

export default function DriverSidebar({ activePage }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogoutConfirm = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase signout error:', err);
    }
    localStorage.removeItem('driver_data');
    localStorage.removeItem('driver_session');
    setShowLogoutModal(false);
    navigate('/');
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between shrink-0 select-none sticky top-0 h-screen">
        
        {/* Top Brand & Nav */}
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-900 font-black shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 tracking-tight text-lg">JB Logistics</h1>
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Driver Portal</p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 text-xs font-bold">
            <Link 
              to="/driver-portal" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'dashboard' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>

            <Link 
              to="/driver-portal/shipments" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'shipments' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Package className="w-4 h-4" /> My Shipments
            </Link>

            <Link 
              to="/driver-portal/scan" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'scan' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <QrCode className="w-4 h-4" /> Scan Shipment
            </Link>

            <Link 
              to="/driver-portal/completed" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'completed' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <CheckCircle2 className="w-4 h-4" /> Completed
            </Link>

            <Link 
              to="/driver-portal/notifications" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'notifications' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Bell className="w-4 h-4" /> Notifications
              <span className="ml-auto bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">3</span>
            </Link>

            <Link 
              to="/driver-portal/profile" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === 'profile' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <User className="w-4 h-4" /> Profile
            </Link>
          </nav>
        </div>

        {/* Bottom Logout */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setShowLogoutModal(true)} 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 w-full transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Are you sure?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you wanna log out? This will end your session entirely.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}