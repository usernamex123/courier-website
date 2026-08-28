import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import DriverHeader from './DriverHeader';
import { toast } from 'sonner';
import { 
  X, 
  Loader2, 
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
    } catch (e) {}
    return {
      id: '71d98695-b0be-411a-9cc4-82aaca27bb31',
      driver_id: 'DRV-119147',
      name: 'Sparsh Limbu',
      status: 'On Field',
    };
  });

  const scannerInstanceRef = useRef(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize core Html5Qrcode engine with explicit focus constraints to prevent blur
  useEffect(() => {
    let isMounted = true;

    const initScanner = async () => {
      if (!window.Html5Qrcode) {
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
        const scannerId = "clean-qr-viewport";
        if (document.getElementById(scannerId)) {
          const html5QrCode = new window.Html5Qrcode(scannerId);
          scannerInstanceRef.current = html5QrCode;

          const qrCodeSuccessCallback = (decodedText) => {
            if (decodedText) {
              toast.success(`Scanned: ${decodedText}`);
              stopAndRedirect(decodedText);
            }
          };

          const config = { 
            fps: 20, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          // Force environment camera with continuous autofocus to prevent blurry frames
          const constraints = {
            facingMode: "environment",
            advanced: [{ focusMode: "continuous" }]
          };

          await html5QrCode.start(
            constraints, 
            config, 
            qrCodeSuccessCallback,
            () => {} // Suppress continuous frame scan noise
          );
          setScannerReady(true);
        }
      } catch (err) {
        console.error("Camera failed to start with focus constraints, falling back:", err);
        // Fallback to basic environment camera if advanced constraints fail on specific devices
        try {
          if (scannerInstanceRef.current) {
            await scannerInstanceRef.current.start(
              { facingMode: "environment" },
              { fps: 15, qrbox: { width: 250, height: 250 } },
              (text) => { stopAndRedirect(text); },
              () => {}
            );
            setScannerReady(true);
            return;
          }
        } catch (fallbackErr) {
          console.error("Fallback camera initialization failed:", fallbackErr);
          setCameraError(true);
          setScannerReady(true);
        }
      }
    };

    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const stopAndRedirect = async (code) => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch (e) {}
    }

    try {
      const cleanQuery = code.trim();
      const { data } = await supabase
        .from('shipments')
        .select('*')
        .or(`tracking_number.ilike.%${cleanQuery}%,id.eq.${cleanQuery}`)
        .limit(1);

      let trackingToOpen = cleanQuery;
      if (data && data.length > 0) {
        trackingToOpen = data[0].tracking_number;
      }

      navigate(`/driver-portal/shipments?openUpdate=${encodeURIComponent(trackingToOpen)}`);
    } catch (err) {
      navigate(`/driver-portal/shipments?openUpdate=${encodeURIComponent(code)}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 font-sans flex">
      
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
            subtitle="Align QR code within frame to instantly update status." 
          />
        </div>

        {/* ================= MOBILE APP BAR HEADER ================= */}
        <header className="md:hidden flex items-center justify-between px-6 pt-6 pb-3 bg-neutral-950">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-slate-300 shadow-2xs active:scale-95 transition-transform cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-base font-black text-white tracking-tight">
            Scan Waybill QR
          </h1>

          <div className="w-10"></div>
        </header>

        {/* Content Body - Immersive Full Viewport */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto">
          
          <div className="relative w-full h-[420px] rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl flex items-center justify-center">
            
            {/* Core Viewport Target Element */}
            <div id="clean-qr-viewport" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>

            {/* Loading / Initializing State */}
            {!scannerReady && (
              <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center space-y-3 z-10">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs font-bold text-neutral-400 tracking-wide uppercase">Starting Camera...</p>
              </div>
            )}

            {/* Camera Permission / Error Fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Scan className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white">Camera Access Blocked</h3>
                  <p className="text-xs text-neutral-400">Please enable camera permissions in your browser settings.</p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 rounded-xl text-xs font-black transition-transform active:scale-95 cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Subtle Scanning Reticle Overlay Guide */}
            {scannerReady && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-12 z-20">
                <div className="w-full aspect-square border-2 border-dashed border-amber-400/60 rounded-2xl relative flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-lg"></div>
                </div>
              </div>
            )}

          </div>

          <p className="text-neutral-500 text-xs font-medium text-center mt-4">
            Center the tracking QR code inside the box to redirect automatically.
          </p>

        </div>
      </main>

      {/* ================= FIXED MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 py-2.5 px-6 flex justify-between items-center z-50 shadow-lg">
        <button onClick={() => navigate('/driver-portal')} className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        <button onClick={() => navigate('/driver-portal/shipments')} className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors">
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">Shipments</span>
        </button>

        <div className="relative -top-5">
          <button onClick={() => navigate('/driver-portal/scan')} className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 text-neutral-950 shadow-lg shadow-amber-400/20 flex items-center justify-center border-4 border-neutral-950 transition-transform active:scale-95 cursor-pointer">
            <Scan className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button onClick={() => toast.info('No new notifications')} className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors">
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Notifications</span>
        </button>

        <button onClick={() => navigate('/driver-portal/profile')} className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>

      {/* ================= MOBILE HAMBURGER MENU DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-neutral-950/80 backdrop-blur-xs z-50 flex animate-in fade-in duration-200">
          <div className="bg-neutral-900 border-r border-neutral-800 w-72 h-full shadow-2xl p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-neutral-950" />
                  </div>
                  <span className="font-black text-base text-white">JB Logistics</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400 cursor-pointer">
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
                    className="w-full text-left flex items-center gap-3 p-3 rounded-2xl text-xs font-bold text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <button 
                onClick={() => { localStorage.clear(); navigate('/'); }}
                className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
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