import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import DriverHeader from './DriverHeader';
import { toast } from 'sonner';
import { 
  QrCode, 
  Camera, 
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
  User,
  Flashlight,
  Upload
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

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scanningRef = useRef(false);

  // Start camera on mount for desktop or live preview browsers
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        startBarcodeScanning();
      }
    } catch (err) {
      console.warn('Camera stream restricted in PWA web manifest, falling back to native capture trigger:', err);
      setCameraError(true);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Automatic Native Barcode/QR Scanning Loop (for desktop/supported browsers)
  const startBarcodeScanning = async () => {
    let detector = null;
    if ('BarcodeDetector' in window) {
      try {
        detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a']
        });
      } catch (e) {
        // Fallback
      }
    }

    if (!detector && !window.jsQR) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (err) {
        return;
      }
    }

    scanningRef.current = true;
    const canvasElement = document.createElement('canvas');
    const canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });

    const detectFrame = async () => {
      if (!scanningRef.current || !videoRef.current) return;
      
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          if (detector) {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              scanningRef.current = false;
              toast.success(`Scanned code: ${barcodes[0].rawValue}`);
              handleLookupShipment(barcodes[0].rawValue);
              return;
            }
          } else if (window.jsQR) {
            const video = videoRef.current;
            canvasElement.width = video.videoWidth;
            canvasElement.height = video.videoHeight;
            if (canvasElement.width > 0 && canvasElement.height > 0) {
              canvasContext.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
              const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
              const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
              if (code && code.data) {
                scanningRef.current = false;
                toast.success(`Scanned code: ${code.data}`);
                handleLookupShipment(code.data);
                return;
              }
            }
          }
        } catch (err) {
          // Suppress frame read noise
        }
      }
      if (scanningRef.current) {
        requestAnimationFrame(detectFrame);
      }
    };

    requestAnimationFrame(detectFrame);
  };

  // Handle Native Camera Snapshot Capture (Bypasses PWA Web Manifest constraints)
  const handleNativeCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingSearch(true);
    toast.info('Processing captured code...');

    try {
      if (!window.jsQR) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

          if (code && code.data) {
            toast.success(`Captured: ${code.data}`);
            handleLookupShipment(code.data);
          } else {
            setLoadingSearch(false);
            toast.error('No barcode/QR code detected in photo. Please try again.');
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setLoadingSearch(false);
      toast.error('Failed to process image');
    }
  };

  const toggleFlashlight = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const track = stream.getVideoTracks()[0];
        if (!track) {
          toast.error('No camera track available');
          return;
        }
        const newTorchState = !flashlightOn;
        await track.applyConstraints({ advanced: [{ torch: newTorchState }] });
        setFlashlightOn(newTorchState);
        toast.success(newTorchState ? 'Flashlight enabled' : 'Flashlight disabled');
      } else {
        toast.error('Live camera stream not active. Use native camera button below.');
      }
    } catch (err) {
      toast.info('Flashlight control is handled by your device native camera');
    }
  };

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
      stopCamera();
      
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
        <div className="p-6 space-y-6 max-w-5xl w-full mx-auto">
          
          {/* Hidden Native File Input for Mobile App-Style Camera Snapping */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={handleNativeCapture}
          />

          {/* ================= CAMERA VIEWPORT CARD ================= */}
          <div className="relative rounded-3xl overflow-hidden bg-neutral-950 border border-slate-200 shadow-sm aspect-[4/5] sm:aspect-[21/9] lg:aspect-[16/7] flex items-center justify-center group">
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
            />

            {/* Native Camera Trigger Overlay (Perfect for PWA web manifests) */}
            <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-3xs flex flex-col items-center justify-center text-center p-6 space-y-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingSearch}
                className="px-6 py-4 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-2xl font-black text-sm shadow-xl flex items-center gap-3 transition-transform active:scale-95 cursor-pointer"
              >
                {loadingSearch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <span>Open Native Camera Scanner</span>
              </button>
              <p className="text-white/70 text-xs max-w-xs font-medium">
                Launches your phone camera app to instantly snap and read shipping labels.
              </p>
            </div>

            {/* Flashlight Toggle */}
            <div className="absolute bottom-6 z-10">
              <button 
                onClick={toggleFlashlight}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
                  flashlightOn ? 'bg-amber-400 text-slate-900' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                }`}
                title="Toggle Flashlight"
              >
                <Flashlight className="w-5 h-5" />
              </button>
            </div>

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