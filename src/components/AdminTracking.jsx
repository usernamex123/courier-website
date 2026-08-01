import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { createClient } from '@supabase/supabase-js';
import { Navigation } from 'lucide-react';
import L from 'leaflet';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Custom marker icon fix for Leaflet in React
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function AdminTracking() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');

    // 1. Fetch initial driver locations from backend API with Bearer token
    fetch(`${API_URL}/api/admin/drivers`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDrivers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 2. Listen to live real-time position updates from Supabase
    const channel = supabase
      .channel('driver-location-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations' },
        (payload) => {
          setDrivers(prev => {
            const index = prev.findIndex(d => d.id === payload.new.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = payload.new;
              return updated;
            }
            return [payload.new, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="text-yellow-500 font-black uppercase text-xs">Loading live map tracking...</div>;
  }

  // Default center map position (Fallback if no drivers found)
  const defaultCenter = drivers.length > 0 ? [drivers[0].lat, drivers[0].lng] : [27.7172, 85.3240];

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto">
      <div className="bg-[#1c1917] border border-white/10 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">Live Fleet Tracking</h2>
          <p className="text-xs text-white/50 tracking-widest uppercase mt-1">Monitor active driver locations in real-time</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-wider border border-green-500/20">
          <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
          GPS Active ({drivers.length} Drivers)
        </span>
      </div>

      {/* Interactive Map Container */}
      <div className="bg-[#1c1917] border border-white/10 p-2 h-[550px] overflow-hidden shadow-2xl">
        <MapContainer 
          center={defaultCenter} 
          zoom={13} 
          scrollWheelZoom={false} 
          style={{ height: '100%', width: '100%', background: '#000' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {drivers.map(driver => (
            <Marker key={driver.id} position={[driver.lat, driver.lng]} icon={customIcon}>
              <Popup>
                <div className="text-black font-sans">
                  <p className="font-black uppercase text-sm">{driver.driver_name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Lat: {driver.lat}, Lng: {driver.lng}</p>
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">Last Update: {new Date(driver.updated_at).toLocaleTimeString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}