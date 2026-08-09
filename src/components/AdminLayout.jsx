import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Users, Truck, Building2, Wallet, 
  GitBranch, BarChart3, MessageSquare, Navigation, Settings, 
  Bell, Search, ChevronDown, LogOut, Menu, X, ShieldAlert 
} from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Shipments', icon: Package, path: '/admin/shipments' },
    { label: 'Customers', icon: Users, path: '/admin/customers' },
    { label: 'Drivers', icon: Truck, path: '/admin/drivers' },
    { label: 'Fleet', icon: Navigation, path: '/admin/fleet' },
    { label: 'Warehouses', icon: Building2, path: '/admin/warehouses' },
    { label: 'Billing & Finance', icon: Wallet, path: '/admin/billing' },
    { label: 'Branches', icon: GitBranch, path: '/admin/branches' },
    { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
    { label: 'Quotes & Messages', icon: MessageSquare, path: '/admin/messages' },
    { label: 'Live Tracking', icon: ShieldAlert, path: '/admin/tracking' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar for Desktop & Mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center font-black text-gray-900 shadow-sm">JB</span>
            <span className="font-black tracking-tight text-lg text-gray-900">Logistics</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-amber-400 text-gray-900 shadow-sm font-black' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                {item.label}
              </button>
            );
          })}

          <div className="pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={() => navigate('/back-to-site')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              &larr; Back to Site
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50 px-6 flex items-center justify-between overflow-visible">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-black uppercase tracking-widest text-gray-900">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4 overflow-visible">
            {/* Notification Bell with Properly Anchored Dropdown */}
            <div className="relative overflow-visible" ref={dropdownRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors relative cursor-pointer shadow-sm"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-fadeIn">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Incoming Inquiries & Follow-ups</h3>
                    <span className="text-[10px] font-bold text-gray-400">0 New</span>
                  </div>

                  <div className="p-3 bg-white">
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="SEARCH MESSAGES..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-400 text-gray-900 uppercase"
                      />
                    </div>

                    <div className="py-12 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">No client messages received yet.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}