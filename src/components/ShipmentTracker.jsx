import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';

export default function ShipmentTracker() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate(`/track?id=${encodeURIComponent(trackingNumber)}`);
    }
  };

  return (
    <div className="w-full bg-[#f3f6fb] py-16 px-6 relative z-30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Card: Input & Title */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-yellow-600 font-bold text-xs uppercase tracking-widest block mb-2">
              TRACK YOUR SHIPMENT
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight mb-6">
              Real-time updates, every step of the way.
            </h3>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3.5 outline-none focus:border-yellow-500 flex-1 text-sm font-medium transition-colors"
            />
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shrink-0 shadow-md cursor-pointer text-sm uppercase tracking-wider"
            >
              Track Shipment <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Right Card: Live Status Preview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-black shadow-sm shrink-0">
              <Package size={20} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600 block">Status</span>
              <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">In Transit</h4>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium text-gray-900">
              <span>Chicago, IL</span>
              <ArrowRight size={16} className="text-yellow-600" />
              <span>Cleveland, OH</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 px-1">
              <span><strong className="text-gray-900">ETA:</strong> Tomorrow, 10:30 AM</span>
              <button 
                onClick={() => navigate('/track')} 
                className="text-yellow-600 hover:text-yellow-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                View Details <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}