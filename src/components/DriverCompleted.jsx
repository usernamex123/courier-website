import React, { useState, useEffect } from 'react';
import DriverHeader from './DriverHeader';
import DriverSidebar from './DriverSidebar';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  RefreshCw,
  Loader2,
  Eye,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Clock
} from 'lucide-react';

// Import central singleton Supabase instance
import { supabase } from '../lib/supabaseClient';

// Helper to format timestamps strictly in Ohio, Cleveland time (EST/EDT)
const formatClevelandTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date)) return '—';
  
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

export default function DriverCompleted() {
  const navigate = useNavigate();

  // Security Verification: Ensure unauthorized users cannot bypass via direct URL injection
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

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Proof Modal State
  const [selectedProof, setSelectedProof] = useState(null);

  // Determine correct driver identifier string
  const activeDriverId = driver?.driver_id || (driver?.id?.startsWith('DRV-') ? driver.id : null) || driver?.id;

  useEffect(() => {
    if (activeDriverId) {
      fetchDeliveredShipments();
    }
  }, [activeDriverId]);

  const fetchDeliveredShipments = async () => {
    setLoading(true);
    try {
      // Fetch shipments joined with tracking_events for this driver
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          tracking_events (
            id,
            status,
            location,
            description,
            event_time,
            created_at
          )
        `)
        .eq('driver_id', activeDriverId)
        .or('current_status.eq.delivered,status.eq.delivered');

      if (error) throw error;

      // Map and extract exact delivery metadata from tracking_events
      const formattedShipments = (data || []).map(shipment => {
        const deliveryEvent = shipment.tracking_events?.find(e => e.status === 'delivered') || {};
        
        return {
          ...shipment,
          deliveryLocation: deliveryEvent.location || shipment.destination,
          deliveryTime: deliveryEvent.event_time || deliveryEvent.created_at || shipment.updated_at || shipment.created_at,
          deliveryDescription: deliveryEvent.description || 'Delivered successfully'
        };
      });

      // Sort by latest delivery time descending
      formattedShipments.sort((a, b) => new Date(b.deliveryTime) - new Date(a.deliveryTime));

      setShipments(formattedShipments);
    } catch (err) {
      console.error('Error fetching delivered shipments:', err);
      toast.error('Failed to load completed deliveries');
    } finally {
      setLoading(false);
    }
  };

  // Pagination Logic
  const totalItems = shipments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShipments = shipments.slice(startIndex, startIndex + itemsPerPage);

  // Real Statistics calculations
  const totalDeliveredCount = shipments.length;
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthCount = shipments.filter(s => {
    const date = new Date(s.deliveryTime);
    return !isNaN(date) && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex">
      
      {/* ================= SIDEBAR ================= */}
      <DriverSidebar activePage="completed" />

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* ================= HEADER ================= */}
        <DriverHeader 
          title="Completed Deliveries" 
          subtitle="View delivery history and records" 
        />

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* ================= TOP METRICS CARDS (2 Cards Only) ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 1: Total Delivered */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Delivered</p>
                <h3 className="text-2xl font-black text-slate-900">{totalDeliveredCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: This Month */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Month</p>
                <h3 className="text-2xl font-black text-slate-900">{thisMonthCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* ================= DELIVERED SHIPMENTS TABLE / CARD CONTAINER ================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-900 tracking-tight">Delivery History</h3>
              <button 
                onClick={fetchDeliveredShipments} 
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : shipments.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No completed shipments</h4>
                <p className="text-xs font-semibold text-slate-500"></p>
              </div>
            ) : (
              <>
                {/* 1. MOBILE CARD VIEW */}
                <div className="lg:hidden p-4 space-y-3">
                  {currentShipments.map((s) => {
                    const clientName = s.recipient_name || s.client_name || 'Client Name';
                    const formattedDate = formatClevelandTime(s.deliveryTime);

                    return (
                      <div key={s.id || s.tracking_number} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200/80 font-mono text-xs">
                            {s.tracking_number}
                          </span>
                          <button 
                            onClick={() => setSelectedProof(s)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-bold transition-all inline-flex items-center gap-1 border border-slate-200 text-xs shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" /> View
                          </button>
                        </div>
                        <div className="text-xs font-bold text-slate-800">{clientName}</div>
                        <div className="flex justify-between text-xs text-slate-600 border-t border-slate-200/60 pt-2">
                          <span className="text-slate-400 font-medium">Route</span>
                          <span className="font-bold text-slate-900 truncate max-w-[180px]">
                            {s.origin || 'Kathmandu'} → {s.destination}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="text-slate-400 font-medium">Delivered On</span>
                          <span className="font-mono font-bold text-slate-700">{formattedDate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. DESKTOP TABLE VIEW */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase font-black tracking-wider bg-slate-50/50">
                        <th className="py-3.5 px-6">Shipment</th>
                        <th className="py-3.5 px-6">Route</th>
                        <th className="py-3.5 px-6">Delivered On</th>
                        <th className="py-3.5 px-6 text-right">Proof</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {currentShipments.map((s) => {
                        const clientName = s.recipient_name || s.client_name || 'Client Name';
                        const formattedDate = formatClevelandTime(s.deliveryTime);

                        return (
                          <tr key={s.id || s.tracking_number} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-6 space-y-1">
                              <span className="font-black text-slate-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200/80 font-mono inline-block text-xs">
                                {s.tracking_number}
                              </span>
                              <div className="font-bold text-slate-800 pl-0.5">{clientName}</div>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-900">
                              {s.origin || 'Kathmandu'} → {s.destination}
                            </td>
                            <td className="py-4 px-6 font-mono font-bold text-slate-700">
                              {formattedDate}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => setSelectedProof(s)}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer ml-auto border border-slate-200 text-xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ================= PAGINATION FOOTER ================= */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
                  <p className="text-xs font-semibold text-slate-500">
                    Showing <span className="font-bold text-slate-800">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-bold text-slate-800">{totalItems}</span> delivered shipments
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-amber-400 text-slate-900 shadow-xs shadow-amber-400/20'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>
      </main>

      {/* ================= PROOF DETAILS MODAL ================= */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight">Delivery Proof & Details</h3>
                <p className="text-xs font-bold font-mono text-amber-600 mt-0.5">{selectedProof.tracking_number}</p>
              </div>
              <button 
                onClick={() => setSelectedProof(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Recipient:</span>
                  <span className="text-slate-900 font-bold">{selectedProof.recipient_name || selectedProof.client_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Route:</span>
                  <span className="text-slate-900 font-bold">{selectedProof.origin || 'Kathmandu'} → {selectedProof.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Status:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase font-bold">Delivered</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Clock className="w-4 h-4 text-amber-500" /> Timestamp (Ohio Cleveland Time)
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800">
                  {formatClevelandTime(selectedProof.deliveryTime)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <MapPin className="w-4 h-4 text-amber-500" /> GPS Area Name Recorded
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800">
                  {selectedProof.deliveryLocation}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}