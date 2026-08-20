import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, Clock, CheckCircle2, Loader2, AlertCircle, MapPin, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const STATUS_ORDER = [
  'shipment_created', 
  'picked_up', 
  'at_origin_facility', 
  'in_transit', 
  'at_destination_facility', 
  'out_for_delivery', 
  'delivered'
];

const MILESTONES = [
  { key: 'shipment_created', title: 'Shipment Created', defaultDesc: 'Your shipment has been created.' },
  { key: 'picked_up', title: 'Picked Up', defaultDesc: 'Your shipment has been picked up.' },
  { key: 'at_origin_facility', title: 'At Origin Facility', defaultDesc: 'Package arrived at origin facility.' },
  { key: 'in_transit', title: 'In Transit', defaultDesc: 'Your shipment is on the way.' },
  { key: 'at_destination_facility', title: 'At Destination Facility', defaultDesc: 'Package arrived at destination facility.' },
  { key: 'out_for_delivery', title: 'Out for Delivery', defaultDesc: 'Your shipment is out for delivery.' },
  { key: 'delivered', title: 'Delivered', defaultDesc: 'Your shipment has been delivered.' }
];

// Helper to normalize status strings
const normalizeStatus = (str) => {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[\s_-]+/g, '_');
};

export default function ShipmentTracker() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    const trimmed = trackingNumber.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    setError(null);
    setShipment(null);
    setTrackingEvents([]);

    try {
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .ilike('tracking_number', trimmed)
        .single();

      if (shipmentError || !shipmentData) {
        setError("No shipment found with this tracking number.");
        setLoading(false);
        return;
      }

      setShipment(shipmentData);

      const { data: eventsData, error: eventsError } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('shipment_id', shipmentData.id)
        .order('event_time', { ascending: true });

      if (!eventsError && eventsData) {
        setTrackingEvents(eventsData);
      }

    } catch (err) {
      setError("An error occurred while tracking. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmtDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      timeZone: 'America/New_York' 
    });
  };

  // Formats date and time strictly in Cleveland, Ohio (EDT / Eastern Time)
  const fmtDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const datePart = d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      timeZone: 'America/New_York' 
    });
    const timePart = d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true, 
      timeZone: 'America/New_York' 
    });
    return `${datePart} ${timePart}`;
  };

  return (
    <div className="w-full bg-[#f3f6fb] py-16 px-6 relative z-30 font-sans">
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-xl">
        
        {/* Header & Centered Search Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-black text-[#0f172a] tracking-tight mb-2">
            Track Your Shipment
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Enter your tracking number to get real-time updates on your shipment
          </p>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row sm:items-center bg-transparent sm:bg-white sm:border sm:border-gray-200 sm:rounded-xl sm:p-1.5 sm:shadow-sm gap-3 sm:gap-0">
            {/* Input Wrapper - white block on mobile, transparent/integrated on desktop */}
            <div className="flex items-center bg-white border border-gray-200 sm:border-none rounded-xl sm:rounded-none p-1 sm:p-0 flex-1 shadow-sm sm:shadow-none">
              <div className="pl-3 sm:pl-4 text-gray-400 flex items-center">
                <Package size={20} />
              </div>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number (e.g. JB000000000)"
                className="bg-transparent text-gray-900 placeholder-gray-400 px-3 sm:px-4 py-3 sm:py-2.5 outline-none w-full sm:flex-1 text-sm font-medium min-w-0"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold px-7 py-3.5 sm:py-3 rounded-xl sm:rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shrink-0 cursor-pointer text-sm shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {searched && (
          <div className="pt-6 border-t border-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#0f172a]" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm max-w-xl mx-auto">
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
            ) : shipment ? (
              <div className="space-y-6">
                
                {/* Top Horizontal Details Summary Bar */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center text-xs sm:text-sm">
                  
                  <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                    <span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">Tracking Number</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-gray-900 text-base">{shipment.tracking_number}</span>
                      <button 
                        onClick={() => handleCopy(shipment.tracking_number)} 
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                        title="Copy tracking number"
                      >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        {shipment.current_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">Service Type</span>
                    <span className="font-semibold text-gray-800">{shipment.service_type || 'Standard'}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">Shipment Date</span>
                    <span className="font-semibold text-gray-800">{fmtDate(shipment.created_at)}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">Estimated Delivery</span>
                    <span className="font-semibold text-gray-800">{fmtDate(shipment.estimated_delivery)}</span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 lg:col-span-1">
                    <span className="text-gray-400 font-medium block text-[11px] uppercase tracking-wider mb-0.5">Origin / Destination</span>
                    <div className="font-semibold text-gray-800 truncate">{shipment.origin || 'Kathmandu, Nepal'}</div>
                    <div className="text-gray-500 text-xs truncate">{shipment.destination || 'Pokhara, Nepal'}</div>
                  </div>

                </div>

                {/* Vertical Milestone Checklist Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="divide-y divide-gray-100">
                    {MILESTONES.map((milestone, index) => {
                      const matchedEvent = trackingEvents.find(ev => normalizeStatus(ev.status) === milestone.key);
                      const currentStatusKey = normalizeStatus(shipment.current_status);
                      
                      const currentIndex = STATUS_ORDER.indexOf(currentStatusKey);
                      const milestoneIndex = STATUS_ORDER.indexOf(milestone.key);

                      const isCurrent = milestone.key === currentStatusKey;
                      const isCompleted = (currentIndex !== -1 && milestoneIndex < currentIndex) || Boolean(matchedEvent && !isCurrent);
                      const isLast = index === MILESTONES.length - 1;

                      let displayTimestamp = null;
                      if (matchedEvent) {
                        displayTimestamp = matchedEvent.event_time || matchedEvent.created_at;
                      } else if (milestone.key === 'shipment_created') {
                        displayTimestamp = shipment.created_at;
                      }

                      let nodeBg = 'bg-gray-200 text-gray-400 border-gray-300';
                      let titleColor = 'text-gray-400';
                      let descColor = 'text-gray-400';
                      let lineColor = 'bg-gray-200';
                      let IconComponent = Clock;

                      if (isCurrent) {
                        nodeBg = 'bg-blue-600 text-white border-blue-600 shadow-sm';
                        titleColor = 'text-blue-600 font-bold';
                        descColor = 'text-gray-700';
                        lineColor = 'bg-gray-200';
                        IconComponent = milestone.key.includes('transit') || milestone.key.includes('facility') ? Truck : Package;
                      } else if (isCompleted) {
                        nodeBg = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
                        titleColor = 'text-gray-900 font-bold';
                        descColor = 'text-gray-600';
                        lineColor = 'bg-emerald-500';
                        IconComponent = CheckCircle2;
                      }

                      return (
                        <div key={milestone.key} className="flex items-center px-6 py-5 hover:bg-gray-50/50 transition-colors relative">
                          
                          {/* Left Column: Timeline Icon + Title & Description */}
                          <div className="flex items-center gap-4 flex-1 min-w-0 relative">
                            {!isLast && (
                              <div className={`absolute left-5 top-10 w-0.5 h-full -ml-px ${lineColor}`}></div>
                            )}

                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 z-10 ${nodeBg}`}>
                              <IconComponent size={18} />
                            </div>
                            
                            <div className="min-w-0">
                              <h4 className={`text-sm ${titleColor}`}>{milestone.title}</h4>
                              <p className={`text-xs mt-0.5 truncate ${descColor}`}>
                                {matchedEvent?.description || milestone.defaultDesc}
                              </p>
                            </div>
                          </div>

                          {/* Middle Column: Timestamp */}
                          <div className="w-48 text-right hidden sm:block shrink-0 px-4">
                            <span className="text-xs font-medium text-gray-700">
                              {displayTimestamp ? fmtDateTime(displayTimestamp) : '—'}
                            </span>
                          </div>

                          {/* Right Column: Location */}
                          <div className="w-56 text-right hidden md:block shrink-0 pl-4">
                            {matchedEvent?.location ? (
                              <span className="text-xs font-medium text-gray-700 flex items-center justify-end gap-1">
                                <MapPin size={12} className="text-gray-400" /> {matchedEvent.location}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
}