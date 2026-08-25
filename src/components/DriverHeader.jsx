import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, User } from 'lucide-react';

export default function DriverHeader({ title = 'Dashboard', subtitle = 'Here is what is happening with your deliveries today.' }) {
  const [driver, setDriver] = useState({
    name: 'Sparsh Limbu',
    driver_id: 'DRV-119147',
    status: 'Active',
    avatar: null,
  });

  const loadDriverData = () => {
    try {
      const savedData = localStorage.getItem('driver_data') || localStorage.getItem('driver_session');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setDriver(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          driver_id: parsed.driver_id || parsed.driverId || prev.driver_id,
          status: parsed.status || prev.status,
          avatar: parsed.avatar || null
        }));
      }
    } catch (e) {
      console.error('Failed to parse driver session', e);
    }
  };

  useEffect(() => {
    loadDriverData();

    const handleStorageChange = () => loadDriverData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('driverProfileUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('driverProfileUpdated', handleStorageChange);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Link 
          to="/driver-portal/profile" 
          className="flex items-center gap-3 py-1.5 px-2 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer"
        >
          <div className="relative">
            {driver.avatar ? (
              <img 
                src={driver.avatar} 
                alt={driver.name} 
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                <User className="w-5 h-5 text-slate-500" />
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{driver.name}</h4>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[10px] font-mono text-slate-400 font-bold">
              ID: {driver.driver_id || driver.driverId || 'DRV-119147'}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}