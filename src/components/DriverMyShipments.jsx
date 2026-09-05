import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import DriverHeader from './DriverHeader';
import PrintableLabel from '../label/PrintableLabel';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search,
  RefreshCw,
  CheckCircle2,
  Loader2,
  ChevronRight,
  X,
  Menu,
  Bell,
  Truck,
  LayoutDashboard,
  Scan,
  User,
  Printer,
  CheckSquare,
  Square
} from 'lucide-react';
import DriverSidebar from './DriverSidebar';

const STATUS_FLOW = ['assigned', 'in_transit', 'out_for_delivery', 'delivered'];

const getClevelandTimestamp = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type) => parts.find(p => p.type === type)?.value;
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const nyDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const diffMinutes = Math.round((nyDate - utcDate) / 60000);
  const absDiff = Math.abs(diffMinutes);
  const offsetSign = diffMinutes >= 0 ? '+' : '-';
  const offsetHours = String(Math.floor(absDiff / 60)).padStart(2, '0');
  const offsetMins = String(absDiff % 60).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetSign}${offsetHours}:${offsetMins}`;
};

const getDriverAreaName = async () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('Cleveland, OH');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`, {
            headers: { 'User-Agent': 'LogisticsDriverPortal/1.0' }
          });
          const data = await response.json();
          if (data && data.address) {
            const area = data.address.suburb || data.address.neighbourhood || data.address.city_district || '';
            const city = data.address.city || data.address.town || data.address.village || data.address.state || '';
            const locationString = [area, city].filter(Boolean).join(', ');
            resolve(locationString || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
            resolve(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (err) {
          console.warn('Reverse geocoding lookup failed:', err);
          resolve(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      (err) => {
        console.warn('GPS location retrieval error:', err);
        resolve('Cleveland, OH');
      },
      { timeout: 8000, maximumAge: 30000, enableHighAccuracy: true }
    );
  });
};

export default function DriverMyShipments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [driver] = useState(() => {
    try {
      const savedDriverData = localStorage.getItem('driver_data') || localStorage.getItem('driver_session');
      if (savedDriverData) {
        return JSON.parse(savedDriverData);
      }
    } catch (e) {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedShipments, setSelectedShipments] = useState([]);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  
  const [printedShipments, setPrintedShipments] = useState(() => {
    try {
      const saved = localStorage.getItem('printed_shipments');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [activeModalShipment, setActiveModalShipment] = useState(null);
  const [activePrintShipment, setActivePrintShipment] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const shipmentTrackingToUpdate = searchParams.get('openUpdate');
    if (shipmentTrackingToUpdate && shipments.length > 0) {
      const target = shipments.find(s => s.tracking_number === shipmentTrackingToUpdate);
      if (target) {
        setActiveModalShipment(target);
        searchParams.delete('openUpdate');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, shipments, setSearchParams]);
  
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

  const activeDriverId = driver?.driver_id || (driver?.id?.startsWith('DRV-') ? driver.id : null) || driver?.id;

  useEffect(() => {
    if (activeDriverId) {
      fetchShipments();
    }
  }, [activeDriverId]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('driver_id', activeDriverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
      setSelectedShipments([]);
    } catch (err) {
      console.error('Error fetching shipments:', err);
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (shipment, newStatus) => {
    setUpdatingStatus(true);
    try {
      const dbStatus = newStatus.toLowerCase().replace(/ /g, '_');
      const trackingNumber = shipment.tracking_number;

      toast.loading('Fetching live GPS location...', { id: 'gps-toast' });
      const currentAreaName = await getDriverAreaName();
      toast.dismiss('gps-toast');

      const { data: updatedRows, error: updateError } = await supabase
        .from('shipments')
        .update({ 
          current_status: dbStatus,
          status: dbStatus 
        })
        .eq('id', shipment.id)
        .select();

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Database update failed: No matching shipment found or RLS policy blocked the update.');
      }

      const clevelandTimestamp = getClevelandTimestamp();
      const { error: eventError } = await supabase
        .from('tracking_events')
        .insert({
          shipment_id: shipment.id,
          customer_user_id: shipment.customer_user_id || null,
          status: dbStatus,
          location: currentAreaName,
          description: `Status updated to ${newStatus} by driver from ${currentAreaName}`,
          event_time: clevelandTimestamp,
          created_by: driver?.name || activeDriverId
        });

      if (eventError) {
        console.error('Failed to record tracking event:', eventError);
      }

      setShipments(prev => prev.map(s => s.tracking_number === trackingNumber ? { ...s, current_status: dbStatus, status: dbStatus } : s));
      toast.success(`Updated status to ${newStatus} (${currentAreaName})`);
      setActiveModalShipment(null);
    } catch (err) {
      console.error('Status update error:', err);
      toast.dismiss('gps-toast');
      toast.error(err.message || 'Failed to update shipment status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBulkVerify = () => {
    if (!selectedShipments || selectedShipments.length === 0) {
      toast.error('Please select at least one shipment to verify.');
      return;
    }
    localStorage.setItem('verify_queue', JSON.stringify(selectedShipments));
    navigate('/driver-portal/scan?mode=verify');
  };

  const handleBulkUpdate = () => {
    if (!selectedShipments || selectedShipments.length === 0) return;
    setBulkUpdateModalOpen(true);
  };

  const executeBulkStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const dbStatus = newStatus.toLowerCase().replace(/ /g, '_');
      
      toast.loading('Fetching live GPS location for bulk update...', { id: 'gps-toast' });
      const currentAreaName = await getDriverAreaName();
      toast.dismiss('gps-toast');

      const clevelandTimestamp = getClevelandTimestamp();

      for (const shipmentId of selectedShipments) {
        const shipment = shipments.find(s => s.id === shipmentId);
        if (!shipment) continue;

        const { error: updateError } = await supabase
          .from('shipments')
          .update({ 
            current_status: dbStatus,
            status: dbStatus 
          })
          .eq('id', shipment.id);

        if (updateError) {
          console.error(`Failed to update shipment ${shipment.tracking_number}:`, updateError);
          continue;
        }

        await supabase
          .from('tracking_events')
          .insert({
            shipment_id: shipment.id,
            customer_user_id: shipment.customer_user_id || null,
            status: dbStatus,
            location: currentAreaName,
            description: `Status updated to ${newStatus} by driver from ${currentAreaName}`,
            event_time: clevelandTimestamp,
            created_by: driver?.name || activeDriverId
          });
      }

      setShipments(prev => prev.map(s => {
        if (selectedShipments.includes(s.id)) {
          return { ...s, current_status: dbStatus, status: dbStatus };
        }
        return s;
      }));

      toast.success(`Successfully updated ${selectedShipments.length} shipment(s) to ${newStatus} (${currentAreaName})`);
      setSelectedShipments([]);
      setBulkUpdateModalOpen(false);
    } catch (err) {
      console.error('Bulk status update error:', err);
      toast.dismiss('gps-toast');
      toast.error(err.message || 'Failed to perform bulk shipment status update');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleSelectShipment = (id) => {
    setSelectedShipments(prev => 
      (prev || []).includes(id) ? (prev || []).filter(item => item !== id) : [...(prev || []), id]
    );
  };

  const toggleSelectAll = () => {
    if ((selectedShipments || []).length === filteredShipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(filteredShipments.map(s => s.id));
    }
  };

  const handleExecutePrint = () => {
    if (!activePrintShipment) return;
    const trackingNum = activePrintShipment.tracking_number;

    if (printedShipments.includes(trackingNum)) {
      toast.error('This label has already been printed.');
      setActivePrintShipment(null);
      return;
    }

    window.print();

    const updated = [...printedShipments, trackingNum];
    setPrintedShipments(updated);
    try {
      localStorage.setItem('printed_shipments', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist printed state:', e);
    }

    toast.success('Label printed successfully and locked against re-printing.');
    setActivePrintShipment(null);
  };

  const filteredShipments = shipments.filter(s => {
    const currentStatus = (s.current_status || s.status || "").toLowerCase();
    const matchesSearch = 
      (s.tracking_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.destination || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.recipient_name || s.client_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'Pending') {
      matchesStatus = currentStatus === 'assigned' || currentStatus === 'pending';
    } else if (statusFilter !== 'All') {
      matchesStatus = currentStatus === statusFilter.toLowerCase().replace(/ /g, '_');
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    let colors = "bg-amber-50 text-amber-700 border-amber-200";
    let dotColor = "bg-amber-500";
    
    if (s === "delivered") {
      colors = "bg-emerald-50 text-emerald-700 border-emerald-200";
      dotColor = "bg-emerald-500";
    } else if (s === "in_transit" || s === "out_for_delivery") {
      colors = "bg-blue-50 text-blue-700 border-blue-200";
      dotColor = "bg-blue-500";
    }

    const displayLabel = status ? status.replace(/_/g, ' ') : 'Assigned';

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
        <span className="capitalize">{displayLabel}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex">
      
      <div className="hidden md:flex">
        <DriverSidebar activePage="shipments" />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 md:pb-6">
        
        <div className="hidden md:block">
          <DriverHeader 
            title="My Shipments" 
            subtitle="" 
          />
        </div>

        <header className="md:hidden flex items-center justify-between px-6 pt-6 pb-3 bg-[#f8fafc]">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs active:scale-95 transition-transform cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-base font-black text-slate-900 tracking-tight">
            My Shipments
          </h1>

          <div className="w-10"></div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tracking number" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 transition-colors placeholder:font-semibold placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {['All', 'Pending', 'In Transit', 'Delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-amber-400 text-slate-900 shadow-sm shadow-amber-400/20' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

          </div>

          {/* ================= MOBILE SHIPMENT CARD VIEW (Visible on Mobile) ================= */}
          <div className="md:hidden space-y-3">
            {!loading && filteredShipments.length > 0 && (
              <div className="flex items-center justify-between px-2 pt-1 pb-1 text-xs font-bold text-slate-500">
                <button 
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 cursor-pointer hover:text-slate-800"
                >
                  {filteredShipments.length > 0 && (selectedShipments || []).length === filteredShipments.length ? (
                    <CheckSquare className="w-4 h-4 text-amber-600 fill-amber-100" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>Select All ({filteredShipments.length})</span>
                </button>
                {selectedShipments.length > 0 && (
                  <span className="text-amber-600 font-black">{selectedShipments.length} selected</span>
                )}
              </div>
            )}

            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No shipments assigned</h4>
              </div>
            ) : (
              filteredShipments.map((s) => {
                const currentStatus = s.current_status || s.status || 'Assigned';
                const clientName = s.recipient_name || s.client_name || 'Client Name';
                const formattedDate = s.created_at 
                  ? new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) 
                  : '—';
                const isAlreadyPrinted = printedShipments.includes(s.tracking_number);
                const isSelected = (selectedShipments || []).includes(s.id);

                return (
                  <div 
                    key={s.id || s.tracking_number} 
                    className={`bg-white p-4 rounded-2xl border shadow-xs space-y-3 transition-colors ${isSelected ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => toggleSelectShipment(s.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer flex items-center pt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600 fill-amber-100" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="space-y-1">
                          <span className="font-black text-slate-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200/80 font-mono inline-block text-xs">
                            {s.tracking_number}
                          </span>
                          <div className="font-bold text-slate-800 text-xs pt-1">{clientName}</div>
                        </div>
                      </div>
                      <div>{getStatusBadge(currentStatus)}</div>
                    </div>

                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span className="text-slate-400 font-semibold">Route:</span> {s.origin || 'Kathmandu'} → {s.destination}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 font-mono font-semibold">{formattedDate}</span>
                      <div className="flex items-center gap-2">
                        {isAlreadyPrinted ? (
                          <span className="px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-[10px] inline-flex items-center gap-1 border border-slate-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Printed
                          </span>
                        ) : (
                          <button 
                            onClick={() => setActivePrintShipment(s)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all inline-flex items-center gap-1 shadow-2xs border border-slate-200 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print
                          </button>
                        )}
                        <button 
                          onClick={() => setActiveModalShipment(s)}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-extrabold transition-all inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          Update <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ================= DESKTOP SHIPMENT TABLE ================= */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white transition-all">
              {(selectedShipments || []).length > 0 ? (
                <div className="flex items-center gap-4 w-full justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-900 text-xs font-black flex items-center justify-center">
                      {selectedShipments.length}
                    </span>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Shipment(s) Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkVerify}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verify</span>
                    </button>
                    <button
                      onClick={handleBulkUpdate}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 tracking-tight">Shipment Directory</h3>
                  </div>
                  <button onClick={fetchShipments} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
                  </button>
                </>
              )}
            </div>

            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No shipments assigned</h4>
                <p className="text-xs font-semibold text-slate-500"></p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase font-black tracking-wider bg-slate-50/50">
                      <th className="py-3.5 pl-6 pr-2 w-10">
                        <button 
                          onClick={toggleSelectAll}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer flex items-center"
                        >
                          {filteredShipments.length > 0 && (selectedShipments || []).length === filteredShipments.length ? (
                            <CheckSquare className="w-4 h-4 text-amber-600 fill-amber-100" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3.5 px-6">Shipment</th>
                      <th className="py-3.5 px-6">Route</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Pickup Date</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {filteredShipments.map((s) => {
                      const currentStatus = s.current_status || s.status || 'Assigned';
                      const clientName = s.recipient_name || s.client_name || 'Client Name';
                      const formattedDate = s.created_at 
                        ? new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) 
                        : '—';
                      const formattedTime = s.created_at 
                        ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : '—';
                      const isAlreadyPrinted = printedShipments.includes(s.tracking_number);
                      const isSelected = (selectedShipments || []).includes(s.id);

                      return (
                        <tr 
                          key={s.id || s.tracking_number} 
                          className={`hover:bg-slate-50/60 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}
                        >
                          <td className="py-4 pl-6 pr-2">
                            <button 
                              onClick={() => toggleSelectShipment(s.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer flex items-center"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-600 fill-amber-100" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-6 space-y-1">
                            <span className="font-black text-slate-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200/80 font-mono inline-block text-xs">
                              {s.tracking_number}
                            </span>
                            <div className="font-bold text-slate-800 pl-0.5">{clientName}</div>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {s.origin || 'Kathmandu'} → {s.destination}
                          </td>
                          <td className="py-4 px-6">
                            {getStatusBadge(currentStatus)}
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-slate-700">
                            <div>{formattedDate}</div>
                            <div className="text-[10px] font-semibold text-slate-400">{formattedTime}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isAlreadyPrinted ? (
                                <span className="px-3 h-9 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs inline-flex items-center gap-1 border border-slate-200 cursor-not-allowed select-none">
                                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                                  <span>Printed</span>
                                </span>
                              ) : (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActivePrintShipment(s); }}
                                  className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all inline-flex items-center justify-center shadow-xs cursor-pointer border border-slate-200"
                                  title="Print Label"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button 
                                onClick={() => setActiveModalShipment(s)}
                                className="w-9 h-9 bg-slate-100 hover:bg-amber-400 hover:text-slate-900 text-slate-700 rounded-xl font-bold transition-all inline-flex items-center justify-center shadow-xs cursor-pointer border border-slate-200"
                                title="Update Status"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ================= MOBILE BULK ACTION FLOATING BAR ================= */}
      {selectedShipments.length > 0 && (
        <div className="md:hidden fixed bottom-20 inset-x-4 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl z-50 flex items-center justify-between border border-slate-700 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-900 text-xs font-black flex items-center justify-center">
              {selectedShipments.length}
            </span>
            <span className="text-xs font-bold">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkVerify}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Verify
            </button>
            <button
              onClick={handleBulkUpdate}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
            >
              Update
            </button>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 flex justify-between items-center z-50 shadow-lg">
        <button 
          onClick={() => navigate('/driver-portal')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        <button 
          onClick={() => navigate('/driver-portal/shipments')}
          className="flex flex-col items-center gap-1 text-amber-500 cursor-pointer"
        >
          <Package className="w-5 h-5 fill-amber-100" />
          <span className="text-[10px] font-black">Shipments</span>
        </button>

        <div className="relative -top-5">
          <button 
            onClick={() => navigate('/driver-portal/scan')}
            className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-lg shadow-amber-400/40 flex items-center justify-center border-4 border-[#f8fafc] transition-transform active:scale-95 cursor-pointer"
          >
            <Scan className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button 
          onClick={() => toast.info('No new notifications')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Notifications</span>
        </button>

        <button 
          onClick={() => navigate('/driver-portal/profile')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>

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
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                >
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
                onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {activeModalShipment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight">Update Shipment Status</h3>
                <p className="text-xs font-bold font-mono text-amber-600 mt-0.5">{activeModalShipment.tracking_number}</p>
              </div>
              <button 
                onClick={() => setActiveModalShipment(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-slate-500 tracking-wider block">Select New Event Status</label>
              
              {[
                { label: 'Assigned', dbKey: 'assigned' },
                { label: 'In Transit', dbKey: 'in_transit' },
                { label: 'Out for Delivery', dbKey: 'out_for_delivery' },
                { label: 'Delivered', dbKey: 'delivered' },
              ].map((item) => {
                const currentDbStatus = (activeModalShipment.current_status || activeModalShipment.status || 'assigned').toLowerCase();
                const currentIndex = STATUS_FLOW.indexOf(currentDbStatus);
                const itemIndex = STATUS_FLOW.indexOf(item.dbKey);

                const isPast = itemIndex < currentIndex;
                const isCurrent = itemIndex === currentIndex;

                return (
                  <button
                    key={item.label}
                    disabled={updatingStatus || isPast}
                    onClick={() => handleStatusUpdate(activeModalShipment, item.label)}
                    className={`w-full p-3.5 rounded-2xl border text-left font-bold text-xs flex items-center justify-between transition-all ${
                      isPast 
                        ? 'bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed opacity-80' 
                        : isCurrent 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md cursor-default' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 cursor-pointer'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${isPast ? 'bg-slate-300' : isCurrent ? 'bg-amber-400' : 'bg-slate-400'}`}></span>
                      {item.label}
                    </span>

                    {isPast && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    )}
                    {isCurrent && (
                      <span className="px-2.5 py-1 bg-amber-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalShipment(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {bulkUpdateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight">Bulk Update Status</h3>
                <p className="text-xs font-bold text-amber-600 mt-0.5">Applying to {(selectedShipments || []).length} selected shipment(s)</p>
              </div>
              <button 
                onClick={() => setBulkUpdateModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-slate-500 tracking-wider block">Select New Event Status</label>
              
              {[
                { label: 'Assigned', dbKey: 'assigned' },
                { label: 'In Transit', dbKey: 'in_transit' },
                { label: 'Out for Delivery', dbKey: 'out_for_delivery' },
                { label: 'Delivered', dbKey: 'delivered' },
              ].map((item) => {
                const selectedObjs = shipments.filter(s => (selectedShipments || []).includes(s.id));
                const indices = selectedObjs.map(s => STATUS_FLOW.indexOf((s.current_status || s.status || 'assigned').toLowerCase())).filter(i => i !== -1);
                const benchmarkIndex = indices.length > 0 ? Math.min(...indices) : 0;
                const itemIndex = STATUS_FLOW.indexOf(item.dbKey);

                const isPast = itemIndex < benchmarkIndex;
                const isCurrent = itemIndex === benchmarkIndex;

                return (
                  <button
                    key={item.label}
                    disabled={updatingStatus}
                    onClick={() => executeBulkStatusUpdate(item.label)}
                    className={`w-full p-3.5 rounded-2xl border text-left font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md' 
                        : isPast
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${isPast ? 'bg-slate-400' : isCurrent ? 'bg-amber-400' : 'bg-slate-400'}`}></span>
                      {item.label}
                    </span>

                    {isPast && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    )}
                    {isCurrent && (
                      <span className="px-2.5 py-1 bg-amber-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setBulkUpdateModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {activePrintShipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] flex flex-col print:m-0 print:p-0 print:max-h-none print:max-w-none print:shadow-none print:border-none print:h-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 shrink-0 print:hidden">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight">Shipping Label</h3>
                <p className="text-xs font-bold font-mono text-amber-600 mt-0.5">{activePrintShipment.tracking_number}</p>
              </div>
              <button 
                onClick={() => setActivePrintShipment(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-2 flex justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200 print:bg-white print:p-0 print:border-none print:overflow-visible">
              <PrintableLabel shipment={activePrintShipment} />
            </div>

            <div className="pt-2 flex justify-end gap-3 shrink-0 print:hidden">
              <button
                onClick={() => setActivePrintShipment(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePrint}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: auto;
            margin: 0mm;
          }
          body, html {
            height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          div.fixed.inset-0, div.fixed.inset-0 * {
            visibility: visible;
          }
          div.fixed.inset-0 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            background: white !important;
            backdrop-filter: none !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}} />

    </div>
  );
}