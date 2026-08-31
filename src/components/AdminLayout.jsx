import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Users, Truck, Building2, Wallet, 
  GitBranch, BarChart3, MessageSquare, Navigation, Settings, 
  Bell, Search, ChevronDown, ChevronRight, LogOut, Menu, X, ShieldAlert,
  FileText, CreditCard, Receipt, DollarSign, ArrowLeftRight
} from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isFinancePath = location.pathname.startsWith('/admin/finance');
  const [financeOpen, setFinanceOpen] = useState(isFinancePath);

  useEffect(() => {
    if (isFinancePath) {
      setFinanceOpen(true);
    }
  }, [location.pathname, isFinancePath]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const topNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Shipments', icon: Package, path: '/admin/shipments' },
    { label: 'Customers', icon: Users, path: '/admin/customers' },
    { label: 'Drivers', icon: Truck, path: '/admin/drivers' },
    { label: 'Fleet', icon: Navigation, path: '/admin/fleet' },
    { label: 'Warehouses', icon: Building2, path: '/admin/warehouses' },
  ];

  const financeSubItems = [
    { label: 'Overview', icon: BarChart3, path: '/admin/finance/overview' },
    { label: 'Invoices', icon: FileText, path: '/admin/finance/invoices' },
    { label: 'Payments', icon: CreditCard, path: '/admin/finance/payments' },
    { label: 'Receivables', icon: Receipt, path: '/admin/finance/receivables' },
    { label: 'Expenses', icon: DollarSign, path: '/admin/finance/expenses' },
    { label: 'Transactions', icon: ArrowLeftRight, path: '/admin/finance/transactions' },
    { label: 'Reports', icon: BarChart3, path: '/admin/finance/reports' },
  ];

  const bottomNavItems = [
    { label: 'Branches', icon: GitBranch, path: '/admin/branches' },
    { label: 'Quotes & Messages', icon: MessageSquare, path: '/admin/messages' },
    { label: 'Live Tracking', icon: ShieldAlert, path: '/admin/tracking' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const getPageTitle = () => {
    const currentPath = location.pathname;
    if (currentPath.includes('shipments')) return 'Shipments';
    if (currentPath.includes('customers')) return 'Customers';
    if (currentPath.includes('drivers')) return 'Drivers';
    if (currentPath.includes('fleet')) return 'Fleet';
    if (currentPath.includes('warehouses')) return 'Warehouses';
    if (currentPath.includes('finance')) return 'Finance Management';
    if (currentPath.includes('branches')) return 'Branches';
    if (currentPath.includes('messages')) return 'Quotes & Messages';
    if (currentPath.includes('tracking')) return 'Live Tracking';
    if (currentPath.includes('settings')) return 'Admin Settings';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 relative">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar - Pinned completely fixed so charts can never affect its width */}
      <aside 
        style={{ width: '288px', minWidth: '288px', maxWidth: '288px' }}
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col h-screen transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center font-black text-gray-900 shadow-sm shrink-0">JB</span>
            <span className="font-black tracking-tight text-lg text-gray-900 truncate">Logistics</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {topNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-w-0 ${
                  isActive 
                    ? 'bg-amber-400 text-gray-900 shadow-sm font-black' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Finance Accordion Menu */}
          <div className="pt-1">
            <button
              onClick={() => setFinanceOpen(!financeOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-w-0 ${
                isFinancePath 
                  ? 'bg-amber-400 text-gray-900 shadow-sm font-black' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Wallet className={`w-4 h-4 shrink-0 ${isFinancePath ? 'text-gray-900' : 'text-gray-500'}`} />
                <span className="truncate">Finance</span>
              </div>
              {financeOpen ? (
                <ChevronDown className="w-4 h-4 shrink-0 ml-2" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0 ml-2" />
              )}
            </button>

            {financeOpen && (
              <div className="pl-4 pr-1 py-1.5 space-y-1 mt-1 border-l-2 border-amber-400 ml-4">
                {financeSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = location.pathname === sub.path;
                  return (
                    <button
                      key={sub.label}
                      onClick={() => {
                        navigate(sub.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-w-0 ${
                        isSubActive
                          ? 'bg-amber-100 text-amber-900 font-black'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-amber-700' : 'text-gray-400'}`} />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-w-0 ${
                  isActive 
                    ? 'bg-amber-400 text-gray-900 shadow-sm font-black' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={() => navigate('/back-to-site')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100 transition-all cursor-pointer min-w-0"
            >
              <span className="shrink-0">&larr;</span>
              <span className="truncate">Back to Site</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area - Offset by lg:pl-72 to sit cleanly beside the fixed sidebar */}
      <div className="lg:pl-[288px] flex flex-col min-h-screen min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 cursor-pointer shrink-0"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 truncate">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-4 overflow-visible shrink-0">
            <div className="relative overflow-visible" ref={dropdownRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors relative cursor-pointer shadow-sm shrink-0"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-[100]">
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

        <main className="p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}