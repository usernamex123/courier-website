import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation, Routes, Route, NavLink } from 'react-router-dom';
import { 
  Loader2, LogOut, LayoutDashboard, Package, Users, Truck, 
  Car, Warehouse, FileText, BarChart3, Building2, Settings, ChevronLeft, Menu, Bell, 
  RefreshCw, Search, Mail, Clock, Trash2, ExternalLink, ChevronUp, ChevronDown, ChevronRight,
  Wallet, CreditCard 
} from 'lucide-react';
import { toast } from 'sonner';

// Import your central singleton Supabase instance from src/lib/supabaseClient.js using correct relative path
import { supabase } from '../lib/supabaseClient';

// Import your admin view components
import AdminOverview from "./AdminDashboard";
import AdminShipments from "./AdminShipments";
import AdminCustomers from "./AdminCustomers";
import AdminDrivers from "./AdminDrivers";
import AdminBilling from "./AdminBilling";
import ClientQuotes from "./ClientQuotes";
import AdminTracking from "./AdminTracking";
import AdminVehicles from "./AdminVehicles";
import AdminWarehouses from "./AdminWarehouses";
import AdminReports from "./AdminReports";

// Import Finance Sub-components
import AdminFinanceOverview from "./AdminFinanceOverview";
import AdminFinanceInvoices from "./AdminFinanceInvoices";
import AdminFinancePayments from "./AdminFinancePayments";

// Placeholder components for other items if not created yet
const AdminBranches = () => <div className="p-6 text-gray-900"><h2 className="text-xl font-bold">Branches Management</h2></div>;
const AdminSettings = () => <div className="p-6 text-gray-900"><h2 className="text-xl font-bold">Admin Settings</h2></div>;

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:5000`;
};

const API_URL = getApiUrl();

// Helper to fetch with Express session cookies attached automatically
export const authenticatedFetch = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include'
  });
};

// ==========================================
// 1. ADMIN ROUTE GUARDS
// ==========================================
export default function AdminRoute() {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/session`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setAuthorized(data && data.authenticated);
      })
      .catch(() => {
        setAuthorized(false);
      });
  }, []);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-yellow-600 font-bold text-xs uppercase gap-2">
        <Loader2 className="w-6 h-6 animate-spin" /> Verifying Security...
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

export function GuestOnlyRoute() {
  return <Outlet />;
}

// ==========================================
// 2. ADMIN SIDEBAR COMPONENT
// ==========================================
const topNavItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/dashboard/shipments", label: "Shipments", icon: Package },
  { to: "/admin/dashboard/customers", label: "Customers", icon: Users },
  { to: "/admin/dashboard/drivers", label: "Drivers", icon: Truck },
  { to: "/admin/dashboard/vehicles", label: "Fleet", icon: Car },
  { to: "/admin/dashboard/warehouses", label: "Warehouses", icon: Warehouse },
];

const financeSubItems = [
  { to: "/admin/dashboard/finance/overview", label: "Overview", icon: BarChart3 },
  { to: "/admin/dashboard/finance/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/dashboard/finance/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/dashboard/finance/reports", label: "Reports", icon: BarChart3 },
];

const bottomNavItems = [
  { to: "/admin/dashboard/branches", label: "Branches", icon: Building2 },
  { to: "/admin/dashboard/quotes", label: "Quotes & Messages", icon: FileText },
  { to: "/admin/dashboard/tracking", label: "Live Tracking", icon: FileText },
  { to: "/admin/dashboard/settings", label: "Settings", icon: Settings },
];

function AdminSidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isFinanceActive = location.pathname.startsWith('/admin/dashboard/finance');
  const [financeOpen, setFinanceOpen] = useState(isFinanceActive);

  // Keep accordion open if a finance subpage is active
  useEffect(() => {
    if (isFinanceActive) {
      setFinanceOpen(true);
    }
  }, [isFinanceActive]);

  // Terminate session and clear credentials when returning to site
  const handleBackToSite = async (e) => {
    e.preventDefault();
    try {
      await supabase.auth.signOut();
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {});
      localStorage.clear();
      onClose();
      navigate('/');
    } catch (err) {
      console.error("Error signing out:", err);
      navigate('/');
    }
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside 
        style={{ width: '256px', minWidth: '256px', maxWidth: '256px' }}
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-gray-300 border-r border-slate-800 flex flex-col justify-between transition-transform shadow-xl ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div>
          <div className="h-16 flex items-center px-5 border-b border-slate-800 font-bold text-lg shrink-0">
            <span className="text-yellow-400">JB</span>
            <span className="text-white ml-1.5">Logistics</span>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 max-h-[calc(100dvh-120px)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            {/* Top Navigation Items */}
            {topNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? "bg-yellow-500 text-black font-black shadow-sm" : "text-gray-300 hover:bg-slate-800 hover:text-white"}`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" /> {item.label}
              </NavLink>
            ))}

            {/* Finance Accordion */}
            <div className="pt-1">
              <button
                onClick={() => setFinanceOpen(!financeOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  isFinanceActive 
                    ? "bg-yellow-500 text-black font-black shadow-sm" 
                    : "text-gray-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>Finance</span>
                </div>
                {financeOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
              </button>

              {financeOpen && (
                <div className="pl-4 pr-1 py-1.5 space-y-1 mt-1 border-l-2 border-yellow-500 ml-3">
                  {financeSubItems.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                          isActive 
                            ? "bg-yellow-500 text-black font-black" 
                            : "text-gray-400 hover:bg-slate-800 hover:text-white"
                        }`
                      }
                    >
                      <sub.icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{sub.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Navigation Items */}
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? "bg-yellow-500 text-black font-black shadow-sm" : "text-gray-300 hover:bg-slate-800 hover:text-white"}`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" /> {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900/50">
          <button 
            onClick={handleBackToSite}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white font-medium cursor-pointer text-left"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Site
          </button>
        </div>
      </aside>
    </>
  );
}

// ==========================================
// 3. NOTIFICATION BANNER / QUOTES DROPDOWN
// ==========================================
function NotificationQuotesBanner({ isOpen, onClose }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchMessages = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch(`${API_URL}/api/admin/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch messages (${res.status}): ${errorText || 'Unauthorized'}`);
      }

      const resData = await res.json();
      const messageList = Array.isArray(resData) ? resData : (resData.data || resData.messages || []);
      setQuotes(messageList);
    } catch (err) {
      console.error('Failed to load quotes:', err);
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const { data, error: sbErr } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!sbErr && data) {
          setQuotes(data);
          setError(null);
        } else {
          setError(err.message || 'Error communicating with server');
        }
      } else {
        setError(err.message || 'Failed to load client messages');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  const handleDeleteMessage = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    setDeletingId(id);
    const token = localStorage.getItem('admin_token');

    try {
      await fetch(`${API_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      }).catch(() => null);

      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        await supabase.from('messages').delete().eq('id', id);
      }

      setQuotes(prev => prev.filter(q => q.id !== id));
      toast.success('Message deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    const name = q.client_name || q.name || '';
    const message = q.message || q.service || q.content || '';
    const email = q.email || '';
    const query = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      message.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
    );
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 md:w-[480px] bg-white border border-gray-200 shadow-2xl z-50 rounded-2xl overflow-hidden max-h-[80vh] flex flex-col animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50 border-b border-gray-200 p-4 shrink-0">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Client Quotes & Messages</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Incoming inquiries & follow-ups</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 rounded-lg shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-yellow-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={onClose}
            className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Search Bar Toolbar */}
      <div className="p-3 bg-gray-50/50 border-b border-gray-200 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 pl-10 pr-4 py-2 text-gray-900 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-gray-400 rounded-xl shadow-sm"
          />
        </div>
      </div>

      {/* Scrollable List Container */}
      <div className="overflow-y-auto p-3 space-y-2.5 flex-grow max-h-[45vh] bg-white">
        {loading ? (
          <div className="flex justify-center items-center py-10 text-yellow-600 font-black tracking-wider uppercase text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading messages...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 font-bold uppercase tracking-wider text-xs flex items-center justify-between rounded-xl">
            <span>Error: {error}</span>
            <button onClick={() => fetchMessages()} className="underline hover:text-red-800 cursor-pointer">Retry</button>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs font-black uppercase tracking-widest">
            {searchTerm ? 'No messages match search.' : 'No client messages received yet.'}
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const id = quote.id || Math.random();
            const isExpanded = expandedId === id;
            const isDeleting = deletingId === id;
            const clientName = quote.client_name || quote.name || 'Unnamed Client';
            const clientEmail = quote.email || 'No email provided';
            const messageContent = quote.message || quote.service || quote.content || 'No message content.';
            const timestamp = quote.created_at ? new Date(quote.created_at).toLocaleString() : 'Recently';

            const gmailLink = clientEmail !== 'No email provided' 
              ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(`Inquiry Follow-up: JB Logistics`)}`
              : '#';

            return (
              <div 
                key={id}
                className="bg-white border border-gray-200 rounded-xl transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md"
              >
                <div 
                  onClick={() => toggleExpand(id)}
                  className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 font-black text-xs flex items-center justify-center shrink-0 uppercase rounded-lg">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs uppercase tracking-wider text-gray-900 truncate">{clientName}</span>
                        {quote.service && (
                          <span className="hidden sm:inline-block text-[9px] bg-yellow-50 text-yellow-800 px-1.5 py-0.5 border border-yellow-200 font-bold uppercase tracking-wider rounded">
                            {quote.service}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-600 font-medium tracking-wide block truncate mt-0.5">
                        {messageContent}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[10px] text-gray-400 hidden md:inline-block font-mono">{timestamp}</span>
                    <button 
                      onClick={(e) => handleDeleteMessage(e, id)}
                      disabled={isDeleting}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer rounded"
                      title="Delete Message"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-yellow-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3.5 py-3 bg-gray-50 border-t border-gray-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-yellow-600" />
                        {clientEmail !== 'No email provided' ? (
                          <a 
                            href={gmailLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()} 
                            className="text-yellow-700 hover:text-yellow-800 font-mono text-[11px] font-bold flex items-center gap-1.5 hover:underline"
                          >
                            <span>{clientEmail}</span>
                            <span className="inline-flex items-center gap-1 text-[9px] bg-yellow-100 px-1.5 py-0.5 border border-yellow-300 uppercase tracking-wider text-yellow-800 rounded">
                              Gmail <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </a>
                        ) : (
                          <span className="font-mono text-gray-500 text-[11px]">{clientEmail}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{timestamp}</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Message Body</span>
                      <p className="text-xs text-gray-800 font-medium tracking-wide whitespace-pre-wrap leading-relaxed">
                        {messageContent}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. ADMIN TOPBAR COMPONENT
// ==========================================
function AdminTopbar({ onMenuClick, title, onToggleNotifications, notificationOpen }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 gap-4 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-600 hover:text-gray-900 cursor-pointer">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base md:text-lg font-bold text-gray-900 uppercase tracking-wider">{title}</h1>
      </div>

      <div className="flex items-center gap-3 relative">
        <button 
          onClick={onToggleNotifications}
          className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${notificationOpen ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}
          title="Client Quotes & Messages"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        </button>

        <NotificationQuotesBanner 
          isOpen={notificationOpen} 
          onClose={onToggleNotifications} 
        />
      </div>
    </header>
  );
}

// ==========================================
// 5. ADMIN DASHBOARD CONTAINER & LAYOUT
// ==========================================
export function AdminDashboardContainer() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    const allNavItems = [...topNavItems, ...financeSubItems, ...bottomNavItems];
    const currentItem = allNavItems.find(item => item.to === path || (item.end === false && path.startsWith(item.to)));
    return currentItem ? currentItem.label : "Admin Portal";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex relative">
      <AdminSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="flex-grow flex flex-col min-w-0 lg:pl-64">
        <AdminTopbar 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getPageTitle()} 
          onToggleNotifications={() => setNotificationOpen(!notificationOpen)}
          notificationOpen={notificationOpen}
        />

        <main className="flex-grow p-6 md:p-10 overflow-y-auto bg-transparent">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="shipments" element={<AdminShipments />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="vehicles" element={<AdminVehicles />} />
            <Route path="warehouses" element={<AdminWarehouses />} />
            
            {/* Finance Sub-routes */}
            <Route path="finance/overview" element={<AdminFinanceOverview />} />
            <Route path="finance/invoices" element={<AdminFinanceInvoices />} />
            <Route path="finance/payments" element={<AdminFinancePayments />} />
            <Route path="finance/reports" element={<AdminReports />} />

            <Route path="branches" element={<AdminBranches />} />
            <Route path="quotes" element={<ClientQuotes />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}