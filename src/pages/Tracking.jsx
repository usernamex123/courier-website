import { useState } from "react";
import { Search, MapPin, Package } from "lucide-react";

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState("");
  const [data, setData] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setData({
        id: trackingId,
        status: "In Transit",
        location: "Kathmandu Logistics Hub",
        eta: "2026-07-15"
      });
    }
  };

  return (
    <div className="pt-32 px-5 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-4xl font-black mb-8">Track Shipment</h1>
      <form onSubmit={handleSearch} className="flex gap-4 mb-10">
        <input
          type="text"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Enter your Tracking ID..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="bg-blue-600 px-6 py-3 rounded-xl font-bold text-sm">Track</button>
      </form>

      {data ? (
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
          <div className="flex justify-between mb-6">
            <span className="text-slate-400 text-xs font-bold uppercase">ID: {data.id}</span>
            <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold">{data.status}</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><MapPin size={20} /> Current Location: {data.location}</div>
            <div className="flex items-center gap-3"><Package size={20} /> ETA: {data.eta}</div>
          </div>
        </div>
      ) : (
        <div className="text-slate-600 text-center py-20">Enter an ID to view shipment details.</div>
      )}
    </div>
  );
}