import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Radar, Navigation, MapPin, Loader2, User, Package, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:34px;height:34px;">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-50"></span>
    <span class="absolute rounded-full bg-yellow-500 border-2 border-white shadow-lg flex items-center justify-center text-black font-bold" style="inset:6px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16l-4-4M14 8l-6 6"/><circle cx="18" cy="6" r="3"/><path d="M21 12a9 9 0 0 1-9 9"/><path d="M3 12a9 9 0 0 1 9-9"/></svg>
    </span>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function Recenter({ position, zoom }) {
  const map = useMap();
  useEffect(() => { 
    if (position) map.flyTo(position, zoom, { duration: 1.2 }); 
  }, [position, zoom, map]);
  return null;
}

// Default center set to Kathmandu, Nepal
const DEFAULT_CENTER = [27.7172, 85.3240];

// Helper to resolve coordinates from either "lat, lng" string or text address via Nominatim geocoding
const resolveCoordinates = async (locStr) => {
  if (!locStr) return null;
  
  // 1. Try parsing as direct numeric coordinates ("lat, lng")
  const parts = locStr.split(',').map(p => parseFloat(p.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }

  // 2. If it's a text address/location name, geocode it using OpenStreetMap Nominatim
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locStr)}&limit=1`, {
      headers: { 'User-Agent': 'AdminTrackingApp/1.0' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (err) {
    console.error("Geocoding lookup error:", err);
  }

  return null;
};

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let colors = "bg-gray-100 text-gray-700 border-gray-200";
  if (["delivered", "picked_up", "confirmed"].includes(s)) colors = "bg-green-50 text-green-700 border-green-200";
  if (["in_transit", "out_for_delivery", "at_origin_facility", "at_destination_facility"].includes(s)) colors = "bg-blue-50 text-blue-700 border-blue-200";
  if (["delayed", "failed_delivery", "damaged", "lost", "cancelled"].includes(s)) colors = "bg-red-50 text-red-700 border-red-200";
  
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${colors}`}>
      {status?.replace(/_/g, ' ') || 'UNKNOWN'}
    </span>
  );
};

export default function AdminTracking() {
  const [drivers, setDrivers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverEvents, setDriverEvents] = useState([]);
  const [position, setPosition] = useState(null);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);

  // Load distinct driver names (created_by) for suggestions
  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('created_by')
        .not('created_by', 'is', null);

      if (error) throw error;
      
      const uniqueDrivers = [...new Set((data || []).map(d => d.created_by))].filter(Boolean);
      setDrivers(uniqueDrivers);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch drivers list");
    }
  };

  useEffect(() => { 
    loadDrivers(); 
  }, []);

  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('tracking_events')
        .select(`
          *,
          shipments (
            id,
            tracking_number,
            origin,
            destination,
            service_type,
            current_status
          )
        `)
        .ilike('created_by', trimmed)
        .order('event_time', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error(`No tracking records found for driver "${trimmed}"`);
        setSelectedDriver(null);
        setDriverEvents([]);
        setPosition(null);
        setSearching(false);
        return;
      }

      setSelectedDriver(trimmed);
      setDriverEvents(data);

      // Resolve coordinates for the latest valid location (supports both lat/lng and text addresses)
      let foundCoord = null;
      for (const ev of data) {
        if (ev.location) {
          const coords = await resolveCoordinates(ev.location);
          if (coords) {
            foundCoord = coords;
            break;
          }
        }
      }

      if (foundCoord) {
        setPosition(foundCoord);
        toast.success(`Location resolved for driver ${trimmed}`);
      } else {
        setPosition(DEFAULT_CENTER);
        toast.info(`Driver ${trimmed} found, but location could not be mapped.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while searching for driver.");
    } finally {
      setSearching(false);
    }
  };

  const latestEvent = driverEvents[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center">
              <Radar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Driver GPS Tracking</h2>
              <p className="text-xs text-gray-500">Track driver locations based on their shipment update logs</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
            {drivers.length} Active Drivers
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-300 px-4 py-2.5 flex-1 min-w-65 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              list="driver-suggestions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter driver name (e.g. driver123)..."
              className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400"
              autoComplete="off"
            />
            <datalist id="driver-suggestions">
              {drivers.map((drv) => <option key={drv} value={drv} />)}
            </datalist>
          </div>
          <button 
            type="submit" 
            disabled={searching} 
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60 transition-all shadow-sm cursor-pointer"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />} 
            {searching ? "Locating..." : "Track Driver"}
          </button>
        </form>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="h-[68vh] min-h-[420px] w-full relative z-0">
            <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom className="h-full w-full" ref={mapRef}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {position && (
                <>
                  <Recenter position={position} zoom={14} />
                  <Marker position={position} icon={driverIcon}>
                    <Popup>
                      <div className="space-y-1.5 p-1 font-sans">
                        <strong className="text-gray-900 text-sm font-bold block flex items-center gap-1.5">
                          <User size={14} className="text-yellow-600" /> {selectedDriver}
                        </strong>
                        <div className="text-xs text-gray-600">
                          Latest Shipment: <span className="font-mono font-semibold">{latestEvent?.shipments?.tracking_number || '—'}</span>
                        </div>
                        {latestEvent?.location && (
                          <div className="text-xs text-gray-500">
                            Location: <span className="font-medium text-gray-800">{latestEvent.location}</span>
                          </div>
                        )}
                        <div className="text-xs text-green-600 font-bold flex items-center gap-1 pt-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> Last Recorded Location
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Sidebar Status Info & History */}
        <div className="space-y-4">
          {selectedDriver ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-base truncate">{selectedDriver}</h3>
                    <p className="text-xs text-gray-500">{driverEvents.length} total shipment updates</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">Latest Location</span>
                    <span className="text-xs text-gray-900 font-bold truncate max-w-[140px]" title={latestEvent?.location}>{latestEvent?.location || "None recorded"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">Latest Update Time</span>
                    <span className="text-xs text-gray-900 font-medium">
                      {latestEvent?.event_time ? new Date(latestEvent.event_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—"}
                    </span>
                  </div>
                </div>

                {/* Driver Update History Stream */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Driver Activity Stream</h4>
                  <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                    {driverEvents.length > 0 ? (
                      driverEvents.map((ev) => (
                        <div key={ev.id} className="p-3 rounded-xl border border-gray-100 bg-white text-xs space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-600">{ev.shipments?.tracking_number || 'Shipment'}</span>
                            <StatusBadge status={ev.status} />
                          </div>
                          {ev.location && (
                            <div className="text-gray-600 flex items-center gap-1 text-[11px]">
                              <MapPin size={11} className="text-gray-400 shrink-0" /> 
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                          {ev.description && (
                            <p className="text-gray-500 italic text-[11px]">{ev.description}</p>
                          )}
                          <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-50">
                            <span>{ev.event_time ? new Date(ev.event_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-4">No update events found.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                <span className="relative flex h-3.5 w-3.5 shrink-0">
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide">Driver Tracked Successfully</div>
                  <div className="text-[11px] text-green-600 font-medium">Displaying last position logged by {selectedDriver}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm flex flex-col items-center justify-center h-full min-h-[360px]">
              <div className="w-14 h-14 rounded-2xl bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-3">
                <Radar className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">No Driver Selected</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-[220px]">Enter or select a driver name above (e.g. driver123) to view their latest GPS telemetry and history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}