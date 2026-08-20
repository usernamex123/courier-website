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
  Loader2
} from "lucide-react";
import PrintableLabel from "../label/PrintableLabel";
import { supabase } from "../lib/supabaseClient";

const STATUS_LABELS = {
  created: "Created",
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
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Tracking events states
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Form states for adding tracking event
  const [eventStatus, setEventStatus] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  
  // Initialize with Cleveland, Ohio current date & time
  const [eventTime, setEventTime] = useState(getClevelandCurrentDateTime());

  const fetchTrackingEvents = async () => {
    if (!shipment?.id) return;
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('shipment_id', shipment.id)
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

  useEffect(() => {
    fetchTrackingEvents();
  }, [shipment?.id]);

  if (!shipment) return null;

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
            <title>Shipping Label - ${shipment.tracking_number || ''}</title>
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

  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventStatus) return;

    try {
      setUpdating(true);

      // Append the Eastern Daylight Time (EDT) offset (-04:00) so Supabase records exact Cleveland time
      const formattedEventTime = eventTime ? `${eventTime}:00-04:00` : new Date().toISOString();

      const isValidUUID = (id) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof id === 'string' && uuidRegex.test(id);
      };

      const customerUserId = isValidUUID(shipment.user_id) ? shipment.user_id : null;

      // 1. Insert distinct event into tracking_events table with Cleveland event_time timestamp
      const { error: trackingEventError } = await supabase
        .from('tracking_events')
        .insert({
          shipment_id: shipment.id,
          customer_user_id: customerUserId,
          status: eventStatus,
          location: eventLocation,
          description: eventDescription,
          event_time: formattedEventTime
        });

      if (trackingEventError) throw trackingEventError;

      // 2. Update shipments table current_status to latest status
      const { data, error: shipmentError } = await supabase
        .from('shipments')
        .update({ current_status: eventStatus })
        .eq('id', shipment.id)
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      if (typeof onUpdate === 'function' && data) {
        onUpdate(data);
      }

      setIsTrackingModalOpen(false);
      setEventStatus("");
      setEventLocation("");
      setEventDescription("");
      
      // Refresh timeline events instantly
      fetchTrackingEvents();
    } catch (err) {
      console.error("Error updating tracking event:", err.message);
      alert("Failed to update shipment status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center p-4 sm:p-6 font-sans ${isTrackingModalOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className="hidden">
        <PrintableLabel ref={labelRef} shipment={shipment} />
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
            <div className="text-xl font-extrabold text-gray-900 font-mono tracking-tight">{shipment.tracking_number || "—"}</div>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Tracking Number Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Tracking Number</div>
            <div className="text-lg font-bold text-gray-900 font-mono">{shipment.tracking_number || "—"}</div>
            <div className="text-xs text-gray-500 mt-0.5">Ref: {shipment.reference_number || shipment.ref || "JBS-2026-00013"}</div>
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
              {STATUS_LABELS[shipment.current_status] || shipment.current_status?.replace('_', ' ') || 'Created'}
            </span>
          </div>
        </div>

        {/* Route & Core Info Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <span className="flex items-center gap-1 text-amber-600"><MapPin className="w-4 h-4" /></span>
              <span>{shipment.origin || "Damak"}</span>
              <span className="text-gray-400">→</span>
              <span className="flex items-center gap-1 text-amber-600"><MapPin className="w-4 h-4" /></span>
              <span>{shipment.destination || "Damak"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/60">
              <Truck className="w-4 h-4 text-amber-600" /> {shipment.service_type || "Standard"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Est. Delivery</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(shipment.est_delivery_date || new Date(Date.now() + 5*86400000))}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Delivered</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(shipment.delivered_date)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Payment</div>
              <div className="font-bold text-gray-900 mt-1 capitalize">{shipment.payment_status || "Unpaid"}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Created</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(shipment.created_at)}</div>
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
                <span className="font-semibold text-gray-900">{shipment.sender_name || "Sparsh Limbu"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-gray-900">{shipment.sender_phone || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Address</span>
                <span className="font-semibold text-gray-900">{shipment.sender_address || shipment.origin || "Damak"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3">Recipient</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-900">{shipment.recipient_name || "Sparsh Limbu"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-gray-900 font-mono">{shipment.recipient_phone || "0000000000"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Address</span>
                <span className="font-semibold text-gray-900">{shipment.recipient_address || shipment.destination || "Damak"}</span>
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

      {/* Add Tracking Event Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden p-6 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Add Tracking Event</h2>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{shipment.tracking_number}</p>
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