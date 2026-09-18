import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Radar, Navigation, MapPin, Loader2, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || 'https://courier-backend-5f6r.onrender.com';

// Custom circular user avatar pin icon
const driverIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:0;background:#fde047;border-radius:50%;border:3px solid #ffffff;box-shadow:0 10px 15px -3px rgba(0,0,0,0.15);"></div>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:1;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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

export default function AdminTracking() {
  const [driversList, setDriversList] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverEvents, setDriverEvents] = useState([]);
  const [position, setPosition] = useState(null);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);

  // Load drivers from backend API route /api/admin/drivers (matching AdminDrivers.jsx)
  const loadDrivers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const drivers = Array.isArray(data) ? data : data.drivers || [];
      setDriversList(drivers);
    } catch (err) {
      console.error("Failed to load drivers from backend:", err);
      toast.error("Failed to load drivers from backend server");
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
      // 1. Fetch tracking events for the driver from Supabase
      const { data: eventsData, error: eventsError } = await supabase
        .from('tracking_events')
        .select(`
          *,
          shipments (
            id,
            tracking_number,
            origin,
            destination,
            current_status
          )
        `)
        .ilike('created_by', trimmed)
        .order('event_time', { ascending: false });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        toast.error(`No tracking records found for driver "${trimmed}"`);
        setSelectedDriver(null);
        setDriverProfile(null);
        setDriverEvents([]);
        setPosition(null);
        setSearching(false);
        return;
      }

      setSelectedDriver(trimmed);
      setDriverEvents(eventsData);

      // 2. Match driver profile from our backend driversList
      const lowerTrimmed = trimmed.toLowerCase();
      const matchedProfile = driversList.find(d => 
        (d.name && d.name.toLowerCase().includes(lowerTrimmed)) ||
        (d.driver_id && d.driver_id.toLowerCase().includes(lowerTrimmed)) ||
        (d.phone && d.phone.toLowerCase().includes(lowerTrimmed)) ||
        (d.id && d.id.toLowerCase() === lowerTrimmed)
      );

      if (matchedProfile) {
        setDriverProfile(matchedProfile);
      } else {
        // Fallback object if no record matched in the list
        setDriverProfile({
          name: trimmed,
          phone: "Not available",
          status: "Available"
        });
      }

      // 3. Extract exact latitude and longitude
      let foundCoord = null;
      for (const ev of eventsData) {
        if (ev.latitude !== null && ev.longitude !== null && !isNaN(ev.latitude) && !isNaN(ev.longitude)) {
          foundCoord = [parseFloat(ev.latitude), parseFloat(ev.longitude)];
          break;
        }
      }

      if (foundCoord) {
        setPosition(foundCoord);
        toast.success(`Live GPS locked for ${trimmed}`);
      } else {
        setPosition(DEFAULT_CENTER);
        toast.info(`Driver found, but no GPS coordinates were logged yet.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while searching.");
    } finally {
      setSearching(false);
    }
  };

  const latestEvent = driverEvents[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Radar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Live Driver Tracking</h2>
              <p className="text-xs text-slate-500">Real-time GPS telemetry from active drivers</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 font-mono bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            {driversList.length} Active Drivers
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-300 px-4 py-2.5 flex-1 min-w-65 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              list="driver-suggestions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter driver name or ID (e.g. driver123)..."
              className="text-sm outline-none bg-transparent w-full text-slate-900 placeholder:text-slate-400 font-medium"
              autoComplete="off"
            />
            <datalist id="driver-suggestions">
              {driversList.map((drv) => (
                <option key={drv.id || drv.driver_id} value={drv.name || drv.driver_id} />
              ))}
            </datalist>
          </div>
          <button 
            type="submit" 
            disabled={searching} 
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60 transition-all shadow-xs cursor-pointer"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />} 
            {searching ? "Locating..." : "Track Driver"}
          </button>
        </form>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="h-[68vh] min-h-[420px] w-full relative z-0">
            <MapContainer center={DEFAULT_CENTER} zoom={14} scrollWheelZoom className="h-full w-full" ref={mapRef}>
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxZoom={16}
              />
              {position && (
                <>
                  <Recenter position={position} zoom={15} />
                  <Marker position={position} icon={driverIcon}>
                    <Popup>
                      <div className="space-y-1.5 p-1 font-sans">
                        <strong className="text-slate-900 text-sm font-bold block flex items-center gap-1.5">
                          <User size={14} className="text-amber-600" /> {driverProfile?.name || selectedDriver}
                        </strong>
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" /> {driverProfile?.phone || 'No phone'}
                        </div>
                        {latestEvent?.latitude && latestEvent?.longitude && (
                          <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                            GPS: {Number(latestEvent.latitude).toFixed(4)}, {Number(latestEvent.longitude).toFixed(4)}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {selectedDriver ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
              {/* Status & Phone Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {driverProfile?.status || 'Available'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2.5 text-slate-700 pt-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Phone size={15} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 font-mono">
                    {driverProfile?.phone || 'Not available'}
                  </span>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Live Telemetry Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Radar size={15} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Live Telemetry</h3>
                </div>

                {/* GPS Coordinates Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin size={13} className="text-amber-600" /> GPS Coordinates
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-950 tracking-wide text-center">
                    {latestEvent?.latitude && latestEvent?.longitude ? (
                      <>{Number(latestEvent.latitude).toFixed(5)}, {Number(latestEvent.longitude).toFixed(5)}</>
                    ) : (
                      <span className="text-slate-400 font-normal">Awaiting GPS fix...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver Name Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 font-bold flex items-center justify-center shrink-0 shadow-xs">
                  <User size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Driver Name</div>
                  <div className="text-xs font-bold text-slate-900 truncate">{driverProfile?.name || selectedDriver}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs flex flex-col items-center justify-center h-full min-h-[360px]">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                <Radar className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">No Driver Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px]">Search or select a driver above to view their telemetry and live location.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}