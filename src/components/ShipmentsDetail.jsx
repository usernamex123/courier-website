import React, { useRef, useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Plus, 
  MapPin, 
  Truck, 
  Box, 
  Ruler, 
  Scale, 
  DollarSign, 
  Printer, 
  CheckCircle2,
  X,
  Calendar,
  Loader2,
  UserCheck
} from "lucide-react";
import PrintableLabel from "../label/PrintableLabel";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

const STATUS_LABELS = {
  created: "Created",
  pending: "Pending",
  assigned: "Assigned",
  confirmed: "Confirmed",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  at_origin_facility: "At Origin Facility",
  in_transit: "In Transit",
  at_destination_facility: "At Destination",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  failed_delivery: "Failed Delivery",
  cancelled: "Cancelled",
  returned: "Returned"
};

// Helper to format date & time strictly in Cleveland, Ohio (EDT / Eastern Time)
const fmtDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York'
  });
};

// Helper to get current date & time formatted for Cleveland, Ohio (America/New_York)
const getClevelandCurrentDateTime = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type) => parts.find(p => p.type === type)?.value;

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  const minute = getPart('minute');

  if (hour === '24') hour = '00';

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export default function ShipmentsDetail({ shipment, onClose, onUpdate }) {
  const labelRef = useRef(null);
  
  // Local state to keep shipment data immediately reactive
  const [currentShipment, setCurrentShipment] = useState(shipment);

  useEffect(() => {
    setCurrentShipment(shipment);
  }, [shipment]);

  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Tracking events states
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Driver assignment states
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [assigningDriverId, setAssigningDriverId] = useState(null);

  // Invoice number state
  const [invoiceNumber, setInvoiceNumber] = useState(shipment?.invoice_number || "");

  // Form states for adding tracking event
  const [eventStatus, setEventStatus] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  
  // Initialize with Cleveland, Ohio current date & time
  const [eventTime, setEventTime] = useState(getClevelandCurrentDateTime());

  const fetchTrackingEvents = async () => {
    if (!currentShipment?.id) return;
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('shipment_id', currentShipment.id)
        .order('event_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrackingEvents(data || []);
    } catch (err) {
      console.error("Error fetching tracking events:", err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchInvoiceNumber = async () => {
    if (!currentShipment?.id) return;
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('shipment_id', currentShipment.id)
        .maybeSingle();

      if (!error && data?.invoice_number) {
        setInvoiceNumber(data.invoice_number);
      }
    } catch (err) {
      console.error("Error fetching invoice number:", err.message);
    }
  };

  const fetchActiveDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .or('status.eq.ACTIVE,status.eq.active,status.eq.Active');

      if (error) throw error;

      // Sort drivers so that the currently assigned driver appears at the top
      const sortedDrivers = [...(data || [])].sort((a, b) => {
        const aId = a.driver_id || a.id;
        const bId = b.driver_id || b.id;
        const isAAssigned = aId === currentShipment?.driver_id;
        const isBAssigned = bId === currentShipment?.driver_id;
        
        if (isAAssigned && !isBAssigned) return -1;
        if (!isAAssigned && isBAssigned) return 1;
        return 0;
      });

      setActiveDrivers(sortedDrivers);
    } catch (err) {
      console.error("Error fetching active drivers:", err.message);
      toast.error("Failed to load active drivers");
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    fetchTrackingEvents();
    fetchInvoiceNumber();
  }, [currentShipment?.id]);

  if (!currentShipment) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'America/New_York'
    });
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && labelRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipping Label - ${currentShipment.tracking_number || ''}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; background: white; display: flex; justify-content: center; align-items: center; min-height: 100dvh; }
            </style>
          </head>
          <body>
            ${labelRef.current.outerHTML}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleAssignDriverSubmit = async (driver) => {
    try {
      setAssigningDriverId(driver.id);
      const driverName = driver.name || driver.full_name || driver.driver_name || driver.first_name || 'Driver';
      
      const selectedDriverId = driver.driver_id || driver.id;
      
      // Update shipment with driver_id and set both status fields to 'assigned'
      const { data, error } = await supabase
        .from('shipments')
        .update({ 
          driver_id: selectedDriverId,
          current_status: 'assigned',
          status: 'assigned'
        })
        .eq('id', currentShipment.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately
      setCurrentShipment(data);

      // Notify parent component so main table updates immediately without reload
      if (typeof onUpdate === 'function' && data) {
        onUpdate(data);
      }

      // Re-sort active drivers list immediately to bring newly assigned driver to top
      setActiveDrivers(prevDrivers => {
        return [...prevDrivers].sort((a, b) => {
          const aId = a.driver_id || a.id;
          const bId = b.driver_id || b.id;
          const isAAssigned = aId === selectedDriverId;
          const isBAssigned = bId === selectedDriverId;
          
          if (isAAssigned && !isBAssigned) return -1;
          if (!isAAssigned && isBAssigned) return 1;
          return 0;
        });
      });

      const isValidUUID = (id) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof id === 'string' && uuidRegex.test(id);
      };

      const customerUserId = isValidUUID(currentShipment.user_id) ? currentShipment.user_id : null;

      await supabase
        .from('tracking_events')
        .insert({
          shipment_id: currentShipment.id,
          customer_user_id: customerUserId,
          status: 'assigned',
          location: currentShipment.origin || 'Facility',
          description: `Driver ${driverName} assigned to shipment.`,
          event_time: new Date().toISOString()
        });

      toast.success(`Driver ${driverName} assigned successfully! Status updated to Assigned.`);
      fetchTrackingEvents();
    } catch (err) {
      console.error("Error assigning driver:", err.message);
      toast.error("Failed to assign driver: " + err.message);
    } finally {
      setAssigningDriverId(null);
    }
  };

  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventStatus) return;

    try {
      setUpdating(true);

      const formattedEventTime = eventTime ? `${eventTime}:00-04:00` : new Date().toISOString();

      const isValidUUID = (id) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof id === 'string' && uuidRegex.test(id);
      };

      const customerUserId = isValidUUID(currentShipment.user_id) ? currentShipment.user_id : null;

      const { error: trackingEventError } = await supabase
        .from('tracking_events')
        .insert({
          shipment_id: currentShipment.id,
          customer_user_id: customerUserId,
          status: eventStatus,
          location: eventLocation,
          description: eventDescription,
          event_time: formattedEventTime
        });

      if (trackingEventError) throw trackingEventError;

      const { data, error: shipmentError } = await supabase
        .from('shipments')
        .update({ 
          current_status: eventStatus,
          status: eventStatus 
        })
        .eq('id', currentShipment.id)
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      setCurrentShipment(data);

      if (typeof onUpdate === 'function' && data) {
        onUpdate(data);
      }

      setIsTrackingModalOpen(false);
      setEventStatus("");
      setEventLocation("");
      setEventDescription("");
      
      fetchTrackingEvents();
      toast.success("Tracking event added successfully!");
    } catch (err) {
      console.error("Error updating tracking event:", err.message);
      alert("Failed to update shipment status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center p-4 sm:p-6 font-sans ${isTrackingModalOpen || isAssignDriverModalOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className="hidden">
        <PrintableLabel ref={labelRef} shipment={currentShipment} />
      </div>

      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto space-y-6 p-6 h-fit">
        
        <div>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Shipments
          </button>
        </div>

        {/* Top Managing Banner */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Managing Shipment</div>
            <div className="text-xl font-extrabold text-gray-900 font-mono tracking-tight">{currentShipment.tracking_number || "—"}</div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                fetchActiveDrivers();
                setIsAssignDriverModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-yellow-400" /> Assign Driver
            </button>
            <button 
              onClick={() => {
                setEventTime(getClevelandCurrentDateTime());
                setIsTrackingModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Tracking Event
            </button>
          </div>
        </div>

        {/* Tracking & Invoice Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Tracking Number Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Tracking Number</div>
              <div className="text-lg font-bold text-gray-900 font-mono">{currentShipment.tracking_number || "—"}</div>
              <div className="text-xs text-gray-500 mt-0.5">Ref: {currentShipment.reference_number || currentShipment.ref || "JBS-2026-00013"}</div>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-200">
                {STATUS_LABELS[currentShipment.current_status] || currentShipment.current_status?.replace('_', ' ') || 'Created'}
              </span>
            </div>
          </div>

          {/* Invoice Number Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Invoice Number</div>
              <div className="text-lg font-bold text-gray-900 font-mono">{invoiceNumber || "—"}</div>
              <div className="text-xs text-gray-500 mt-0.5">Payment: <span className="capitalize">{currentShipment.payment_status || "Unpaid"}</span></div>
            </div>
          </div>

        </div>

        {/* Route & Core Info Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <span className="flex items-center gap-1 text-amber-600"><MapPin className="w-4 h-4" /></span>
              <span>{currentShipment.origin || "Damak"}</span>
              <span className="text-gray-400">→</span>
              <span className="flex items-center gap-1 text-amber-600"><MapPin className="w-4 h-4" /></span>
              <span>{currentShipment.destination || "Damak"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/60">
              <Truck className="w-4 h-4 text-amber-600" /> {currentShipment.service_type || "Standard"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Est. Delivery</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(currentShipment.est_delivery_date || new Date(Date.now() + 5*86400000))}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Delivered</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(currentShipment.delivered_date)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Payment</div>
              <div className="font-bold text-gray-900 mt-1 capitalize">{currentShipment.payment_status || "Unpaid"}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Created</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(currentShipment.created_at)}</div>
            </div>
          </div>
        </div>

        {/* Sender & Recipient Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3">Sender</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-900">{currentShipment.sender_name || "Sparsh Limbu"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-gray-900">{currentShipment.sender_phone || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Address</span>
                <span className="font-semibold text-gray-900">{currentShipment.sender_address || currentShipment.origin || "Damak"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3">Recipient</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-900">{currentShipment.recipient_name || "Sparsh Limbu"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-gray-900 font-mono">{currentShipment.recipient_phone || "0000000000"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Address</span>
                <span className="font-semibold text-gray-900">{currentShipment.recipient_address || currentShipment.destination || "Damak"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase">Documents</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrintLabel}
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Label
            </button>
          </div>
        </div>

        {/* Tracking Timeline Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase">Tracking Timeline</h3>
          <div className="space-y-4 pt-2">
            {loadingEvents ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
              </div>
            ) : trackingEvents.length === 0 ? (
              <div className="text-xs text-gray-500 py-2">No tracking events recorded yet. Click "Add Tracking Event" to log status updates.</div>
            ) : (
              trackingEvents.map((ev, index) => {
                const isLatest = index === 0;
                const eventDate = ev.event_time || ev.created_at;
                return (
                  <div key={ev.id} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${isLatest ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 text-sm">
                          {STATUS_LABELS[ev.status] || ev.status?.replace('_', ' ') || 'Update'}
                        </div>
                        {isLatest && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800">Latest</span>
                        )}
                      </div>
                      {ev.location && (
                        <div className="text-xs font-semibold text-gray-700 mt-0.5">
                          Location: {ev.location}
                        </div>
                      )}
                      {ev.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {ev.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {fmtDateTime(eventDate)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Assign Driver Modal */}
      {isAssignDriverModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden p-6 sm:p-8 space-y-6 my-auto animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Assign Active Driver</h2>
                <p className="text-xs font-mono text-gray-500 mt-0.5">Select a driver for shipment {currentShipment.tracking_number}</p>
              </div>
              <button 
                onClick={() => setIsAssignDriverModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {loadingDrivers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                </div>
              ) : activeDrivers.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  No active drivers found with status <span className="font-semibold text-gray-800">Active</span>.
                </div>
              ) : (
                activeDrivers.map((driver) => {
                  const driverName = driver.name || driver.full_name || driver.driver_name || driver.first_name || 'Driver';
                  const vehicleInfo = driver.vehicle_assigned || driver.vehicle_model || driver.vehicle || 'Standard Unit';
                  const driverIdentifier = driver.driver_id || driver.id;
                  const isAssigned = driverIdentifier === currentShipment.driver_id;

                  return (
                    <div 
                      key={driver.id} 
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all gap-4 ${isAssigned ? 'border-green-300 bg-green-50/25 shadow-sm' : 'border-gray-200 hover:border-yellow-400 bg-gray-50/50'}`}
                    >
                      <div className="space-y-1">
                        <div className="font-extrabold text-gray-900 text-base flex items-center gap-2.5">
                          <span>{driverName}</span>
                          <span className="text-[10px] font-mono bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full uppercase font-bold">
                            {driver.status || 'Active'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-mono">
                          <span>ID: <strong className="text-gray-700">{driver.driver_id || driver.id.substring(0, 8)}</strong></span>
                          <span>&bull;</span>
                          <span>Vehicle: <strong className="text-gray-800">{vehicleInfo}</strong></span>
                          {driver.license_plate && (
                            <>
                              <span>&bull;</span>
                              <span>Plate: <strong className="text-gray-800">{driver.license_plate}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      {isAssigned ? (
                        <div className="w-full sm:w-auto px-4 py-2 bg-green-100 text-green-800 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 border border-green-200 shadow-xs">
                          <CheckCircle2 className="w-4 h-4 text-green-600" /> Assigned
                        </div>
                      ) : (
                        <button
                          disabled={assigningDriverId === driver.id}
                          onClick={() => handleAssignDriverSubmit(driver)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {assigningDriverId === driver.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Assign Driver
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setIsAssignDriverModalOpen(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Tracking Event Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden p-6 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Add Tracking Event</h2>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{currentShipment.tracking_number}</p>
              </div>
              <button 
                onClick={() => setIsTrackingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase">Status *</label>
                <div className="relative">
                  <select 
                    value={eventStatus}
                    onChange={(e) => setEventStatus(e.target.value)}
                    required
                    className="w-full appearance-none bg-gray-50/50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent cursor-pointer"
                  >
                    <option value="" disabled>Select status...</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="at_origin_facility">At Origin Facility</option>
                    <option value="in_transit">In Transit</option>
                    <option value="at_destination_facility">At Destination</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="delayed">Delayed</option>
                    <option value="failed_delivery">Failed Delivery</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase">Location</label>
                <input 
                  type="text"
                  placeholder="e.g. Cleveland, OH"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Optional details..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" /> Event Time (Cleveland, OH / EDT)
                </label>
                <input 
                  type="datetime-local"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  required
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsTrackingModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updating}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Event
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}