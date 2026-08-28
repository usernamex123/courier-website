import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import DriverHeader from './DriverHeader';
import { toast } from 'sonner';
import { 
  QrCode, 
  ChevronRight, 
  X, 
  Loader2, 
  Search,
  Menu,
  Bell,
  Truck,
  LayoutDashboard,
  Package,
  Scan,
  User
} from 'lucide-react';
import DriverSidebar from './DriverSidebar';

// Safe Supabase Initializer
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export default function DriverScanShipments() {
  const navigate = useNavigate();

  // Driver Authentication State
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

  const scannerRef = useRef(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize fully reliable built-in Html5QrcodeScanner on mount
  useEffect(() => {
    let isMounted = true;
    let scannerInstance = null;

    const loadAndInitScanner = async () => {
      if (!window.Html5QrcodeScanner) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      if (!isMounted) return;

      try {
        scannerInstance = new window.Html5QrcodeScanner(
          "inline-scanner-container",
          { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true
          },
          false
        );

        scannerInstance.render(
          (decodedText) => {
            if (decodedText) {
              toast.success(`Scanned: ${decodedText}`);
              if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
              }
              handleLookupShipment(decodedText);
            }
          },
          (error) => {
            // Suppress continuous frame scan noise
          }
        );
        scannerRef.current = scannerInstance;
      } catch (err) {
        console.error("Built-in scanner failed to initialize:", err);
        toast.error("Could not start camera scanner. Use manual entry below.");
      }
    };

    loadAndInitScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  // Handle lookup by scanned or typed tracking number and redirect securely
  const handleLookupShipment = async (trackingNum) => {
    const query = trackingNum || manualInput;
    if (!query.trim()) {
      toast.error('Please enter a tracking number');
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    try {
      const cleanQuery = query.trim();

      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .or(`tracking_number.ilike.%${cleanQuery}%,id.eq.${cleanQuery}`)
        .limit(1);

      if (error) throw error;

      let trackingToOpen = cleanQuery;
      if (data && data.length > 0) {
        trackingToOpen = data[0].tracking_number;
      } else {
        toast.warning('Exact shipment match not found. Proceeding with scanned code.');
      }

      setShowManualModal(false);
      setManualInput('');
      
      navigate(`/driver-portal/shipments?openUpdate=${encodeURIComponent(trackingToOpen)}`);
    } catch (err) {
      console.error('Lookup shipment error:', err);
      toast.error('Error searching shipment');
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden md:flex">
        <DriverSidebar activePage="scan" />
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-28 md:pb-6">
        
        {/* ================= DESKTOP HEADER ================= */}
        <div className="hidden md:block">
          <DriverHeader 
            title="Scan Shipments 📱" 
            subtitle="Scan QR codes or look up tracking numbers to update statuses." 
          />
        </div>

        {/* ================= MOBILE APP BAR HEADER ================= */}
        <header className="md:hidden flex items-center justify-between px-6 pt-6 pb-3 bg-[#f8fafc]">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs active:scale-95 transition-transform cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-base font-black text-slate-900 tracking-tight">
            Scan Shipment
          </h1>

          <div className="w-10"></div>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-w-xl w-full mx-auto">
          
          {/* ================= BUILT-IN INLINE CAMERA SCANNER ================= */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm overflow-hidden">
            <div id="inline-scanner-container" className="w-full overflow-hidden rounded-2xl"></div>
          </div>

          {/* ================= OR DIVIDER ================= */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* ================= MANUAL INPUT BUTTON ================= */}
          <button 
            onClick={() => setShowManualModal(true)}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-slate-900 text-sm">Enter Tracking Number</h4>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
      </main>

      {/* ================= FIXED MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 flex justify-between items-center z-50 shadow-lg">
        <button onClick={() => navigate('/driver-portal')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        <button onClick={() => navigate('/driver-portal/shipments')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">Shipments</span>
        </button>

        <div className="relative -top-5">
          <button onClick={() => navigate('/driver-portal/scan')} className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-lg shadow-amber-400/40 flex items-center justify-center border-4 border-[#f8fafc] transition-transform active:scale-95 cursor-pointer">
            <Scan className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button onClick={() => toast.info('No new notifications')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Notifications</span>
        </button>

        <button onClick={() => navigate('/driver-portal/profile')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
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
                <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Dashboard', path: '/driver-portal' },
                  { label: 'My Shipments', path: '/driver-portal/shipments' },
                  { label: 'Scan Shipment', path: '/driver-portal/scan' },
                  { label: 'Profile', path: '/driver-portal/profile' },
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
                onClick={() => { localStorage.clear(); navigate('/'); }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* ================= MANUAL ENTRY MODAL ================= */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">Enter Tracking Number</h3>
                <p className="text-xs text-slate-400">Type waybill ID to lookup and update</p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="e.g. SHP-004, SHP-001" 
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupShipment()}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleLookupShipment()}
                  disabled={loadingSearch}
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loadingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Shipment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}