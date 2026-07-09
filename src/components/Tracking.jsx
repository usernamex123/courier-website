import { useState } from "react";
import { Search, Package, MapPin, CheckCircle2 } from "lucide-react";

export default function Tracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackingNumber) return;
    
    setLoading(true);
    // Simulate API lookup
    setTimeout(() => {
      setResult({
        id: trackingNumber,
        status: "In Transit",
        location: "Kathmandu, NP",
        eta: "2026-07-12"
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-32 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black mb-2">Shipment Tracking</h1>
        <p className="text-slate-400 mb-8">Enter your unique tracking ID to view real-time location.</p>

        <form onSubmit={handleTrack} className="flex gap-4 mb-12">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking ID (e.g., SS-9482)"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-blue-500"
          />
          <button className="bg-blue-500 hover:bg-blue-600 px-6 py-4 rounded-xl font-bold text-sm flex items-center gap-2">
            <Search size={18} /> Track
          </button>
        </form>

        {loading && <div className="text-slate-500 animate-pulse">Searching logistics network...</div>}

        {result && !loading && (
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-6">
              <div>
                <h3 className="text-sm text-slate-500 font-bold uppercase tracking-widest">Tracking ID</h3>
                <p className="text-2xl font-mono font-bold">{result.id}</p>
              </div>
              <div className="bg-blue-500/10 text-blue-400 px-4 py-1 rounded-full text-xs font-bold uppercase">
                {result.status}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-slate-300">
                <MapPin className="text-slate-600" />
                <span>Current Location: <strong className="text-white">{result.location}</strong></span>
              </div>
              <div className="flex items-center gap-4 text-slate-300">
                <CheckCircle2 className="text-slate-600" />
                <span>Estimated Arrival: <strong className="text-white">{result.eta}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}