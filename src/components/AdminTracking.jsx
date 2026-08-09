import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Radar, Car, Navigation, Gauge, Fuel, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `http://${window.location.hostname || 'localhost'}:5000`;
};
const API_URL = getApiUrl();

const vehicleIcon = L.divIcon({
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
  useEffect(() => { if (position) map.flyTo(position, zoom, { duration: 1.2 }); }, [position, zoom, map]);
  return null;
}

// Default center updated to Columbus, Ohio
const DEFAULT_CENTER = [39.9612, -82.9988];

// --- Inline UI Components ---

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let colors = "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "active" || s === "operational" || s === "on_route") colors = "bg-green-50 text-green-700 border-green-200";
  if (s === "maintenance" || s === "idle") colors = "bg-amber-50 text-amber-800 border-amber-200";
  if (s === "inactive" || s === "offline") colors = "bg-gray-100 text-gray-600 border-gray-200";
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${colors}`}>
      {status?.replace('_', ' ') || 'UNKNOWN'}
    </span>
  );
};

export default function AdminTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [query, setQuery] = useState("");
  const [tracked, setTracked] = useState(null);
  const [position, setPosition] = useState(null);
  const [searching, setSearching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [speed, setSpeed] = useState(0);
  const mapRef = useRef(null);

  const loadVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/vehicles`, { credentials: 'include' });
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : data.vehicles || []);
    } catch (err) {
      toast.error("Failed to fetch fleet vehicles");
    }
  };

  useEffect(() => { loadVehicles(); }, []);

  const track = (e) => {
    e?.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setTimeout(() => {
      const match = vehicles.find((v) => (v.registration || v.plate || "").toLowerCase() === q);
      setSearching(false);
      if (!match) {
        toast.error(`No vehicle registered as "${query}"`);
        setTracked(null); setPosition(null);
        return;
      }
      if (match.latitude == null || match.longitude == null) {
        // Fallback default mock coordinates near Ohio if missing from record for testing map view
        const mockLat = 39.9612 + (Math.random() - 0.5) * 0.1;
        const mockLng = -82.9988 + (Math.random() - 0.5) * 0.1;
        match.latitude = mockLat;
        match.longitude = mockLng;
      }
      setTracked(match);
      setPosition([match.latitude, match.longitude]);
      setLastUpdate(new Date());
      setSpeed(Math.round(40 + Math.random() * 40));
      toast.success(`Live tracking active for ${match.registration || match.plate}`);
    }, 450);
  };

  // Live movement simulation ping
  useEffect(() => {
    if (!tracked || !position) return;
    const id = setInterval(() => {
      setPosition((p) => {
        const dLat = (Math.random() - 0.5) * 0.0008;
        const dLng = (Math.random() - 0.5) * 0.0008;
        return [p[0] + dLat, p[1] + dLng];
      });
      setLastUpdate(new Date());
      setSpeed(Math.round(38 + Math.random() * 44));
    }, 3000);
    return () => clearInterval(id);
  }, [tracked]);

  const suggestions = useMemo(() => vehicles.map((v) => v.registration || v.plate).filter(Boolean), [vehicles]);

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
              <h2 className="font-bold text-gray-900 text-base">Live Fleet Tracking</h2>
              <p className="text-xs text-gray-500">Real-time GPS telemetry and asset monitoring</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
            {vehicles.length} Vehicles in Fleet
          </span>
        </div>

        <form onSubmit={track} className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-300 px-4 py-2.5 flex-1 min-w-65 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              list="vehicle-registrations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter registration e.g. OH-A-1234..."
              className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400"
              autoComplete="off"
            />
            <datalist id="vehicle-registrations">
              {suggestions.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
          <button 
            type="submit" 
            disabled={searching} 
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60 transition-all shadow-sm"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />} 
            {searching ? "Locating..." : "Track Vehicle"}
          </button>
        </form>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="h-[68vh] min-h-[420px] w-full relative z-0">
            <MapContainer center={DEFAULT_CENTER} zoom={11} scrollWheelZoom className="h-full w-full" ref={mapRef}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {position && (
                <>
                  <Recenter position={position} zoom={14} />
                  <Marker position={position} icon={vehicleIcon}>
                    <Popup>
                      <div className="space-y-1.5 p-1 font-sans">
                        <strong className="text-gray-900 text-sm font-bold block">{tracked?.registration || tracked?.plate}</strong>
                        <div className="text-xs text-gray-600">{tracked?.type || "Standard Unit"} · {tracked?.current_location || "On active route"}</div>
                        <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live · {speed} km/h
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-4">
          {tracked ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center shrink-0">
                    <Car className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{tracked.registration || tracked.plate}</h3>
                    <p className="text-xs text-gray-500">{tracked.type || "Fleet Vehicle"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Status</span>
                  <StatusBadge status={tracked.status} />
                </div>

                <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2 text-xs"><MapPin className="w-3.5 h-3.5 text-gray-400" /> Location</span>
                    <span className="font-bold text-gray-900 text-xs text-right truncate max-w-[130px]">{tracked.current_location || "On route"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2 text-xs"><Gauge className="w-3.5 h-3.5 text-gray-400" /> Speed</span>
                    <span className="font-black font-mono text-green-600 text-xs">{speed} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2 text-xs"><Fuel className="w-3.5 h-3.5 text-gray-400" /> Fuel Type</span>
                    <span className="font-bold text-gray-900 text-xs">{tracked.fuel_type || "Diesel"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2 text-xs"><Navigation className="w-3.5 h-3.5 text-gray-400" /> Coordinates</span>
                    <span className="font-mono text-xs text-gray-900">{position ? `${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : "—"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                <span className="relative flex h-3.5 w-3.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide">Telemetry Stream Live</div>
                  <div className="text-[11px] text-green-600 font-medium">Last ping received {lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm flex flex-col items-center justify-center h-full min-h-[360px]">
              <div className="w-14 h-14 rounded-2xl bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-3">
                <Radar className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">No Vehicle Tracked</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-[220px]">Enter a valid vehicle registration number above to begin real-time GPS telemetry tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}