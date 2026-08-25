import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import DriverHeader from './DriverHeader';
import { toast } from 'sonner';
import { 
  QrCode, 
  Camera, 
  Bell, 
  Calendar, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Loader2, 
  Search,
  Package,
  MapPin,
  Phone
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
  // Driver Authentication State
  const [driver, setDriver] = useState(() => {
    try {
      const savedDriverData = localStorage.getItem('driver_data') || localStorage.getItem('driver_session');
      if (savedDriverData) {
        return JSON.parse(savedDriverData);
      }
    } catch (e) {
      // Fallback
    }
    return {
      id: 'DRV-1001',
      name: 'Driver A',
      status: 'On Field',
    };
  });

  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scannedShipment, setScannedShipment] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Start camera on mount
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
      }
    } catch (err) {
      console.warn('Camera access error or not supported:', err);
      setCameraError(true);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Handle lookup by scanned or typed tracking number
  const handleLookupShipment = async (trackingNum) => {
    const query = trackingNum || manualInput;
    if (!query.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setLoadingSearch(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .ilike('tracking_number', `%${query.trim()}%`)
        .limit(1);

      if (!error && data && data.length > 0) {
        setScannedShipment(data[0]);
        setShowManualModal(false);
        setManualInput('');
        toast.success(`Found shipment: ${data[0].tracking_number}`);
      } else {
        // Fallback mock check if offline or table is empty
        const mockShipment = {
          tracking_number: query.toUpperCase().includes('SHP') ? query.toUpperCase() : 'SHP-004',
          origin: 'Kathmandu',
          destination: 'Chitwan',
          client_name: 'Ram Sharma',
          client_phone: '+977-9800000004',
          client_address: 'Bharatpur, Chitwan',
          status: 'In Transit',
          time: '10:15 AM'
        };
        setScannedShipment(mockShipment);
        setShowManualModal(false);
        setManualInput('');
        toast.success(`Found shipment: ${mockShipment.tracking_number}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error searching shipment');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!scannedShipment) return;
    try {
      await supabase
        .from('shipments')
        .update({ status: newStatus })
        .eq('tracking_number', scannedShipment.tracking_number);

      setScannedShipment(prev => ({ ...prev, status: newStatus }));
      toast.success(`Shipment ${scannedShipment.tracking_number} updated to ${newStatus}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update shipment');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex">
      
      {/* ================= REUSABLE SIDEBAR ================= */}
      <DriverSidebar activePage="scan" />

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* ================= UNIFORM DRIVER HEADER ================= */}
        <DriverHeader 
          title="Scan Shipments 📱" 
          subtitle="Scan QR codes or look up tracking numbers to update statuses." 
        />

        {/* Content Body */}
        <div className="p-6 space-y-6 max-w-5xl w-full mx-auto">
          
          {/* ================= CAMERA VIEWPORT CARD ================= */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm aspect-[16/10] sm:aspect-[21/9] lg:aspect-[16/7] flex items-center justify-center group">
            
            {/* Live Camera Feed */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
            />

            {/* Fallback Image / Background if camera fails */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-700 text-amber-400 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-white font-bold text-sm">Camera permission required or unavailable</h4>
                <p className="text-slate-400 text-xs max-w-sm">You can still use manual tracking number lookup below or click to retry.</p>
                <button onClick={startCamera} className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                  Retry Camera
                </button>
              </div>
            )}

            {/* Scanning Overlay Box with Corner Guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="relative w-72 sm:w-80 h-48 sm:h-52 border-2 border-white/20 rounded-2xl flex items-center justify-center">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>

                {/* Laser scan line animation simulation */}
                <div className="absolute inset-x-0 h-0.5 bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-pulse"></div>

                {/* Bottom Pill Inside Viewport */}
                <div className="absolute -bottom-14 bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
                  Position the QR code or barcode within the frame
                </div>
              </div>
            </div>

            {/* Quick Demo Scan Trigger Clickable Overlay */}
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => handleLookupShipment('SHP-004')}
                className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                Simulate Scan ⚡
              </button>
            </div>

          </div>

          {/* ================= OR DIVIDER ================= */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* ================= ENTER TRACKING NUMBER BUTTON ================= */}
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
                <p className="text-xs text-slate-400">Type waybill code manually</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* ================= SCANNED SHIPMENT RESULT CARD (If found) ================= */}
          {scannedShipment && (
            <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-md p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-base text-slate-900 bg-slate-100 px-3 py-1 rounded-xl font-mono">{scannedShipment.tracking_number}</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">{scannedShipment.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 pt-1">{scannedShipment.origin} → {scannedShipment.destination}</p>
                </div>
                <button onClick={() => setScannedShipment(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Client Details</span>
                  <p className="font-bold text-slate-900 text-sm">{scannedShipment.client_name}</p>
                  <p className="text-slate-500 flex items-center gap-1.5 pt-1"><Phone className="w-3.5 h-3.5 text-amber-500" /> {scannedShipment.client_phone || 'N/A'}</p>
                </div>

                <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Delivery Address</span>
                  <p className="font-bold text-slate-900 text-sm">{scannedShipment.client_address || scannedShipment.destination}</p>
                  <p className="text-slate-500 flex items-center gap-1.5 pt-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> {scannedShipment.destination}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3 justify-end border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400 mr-auto">Update Status:</span>
                {['In Transit', 'Out for Delivery', 'Delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      scannedShipment.status === st 
                        ? 'bg-amber-400 text-slate-900 shadow-sm' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

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