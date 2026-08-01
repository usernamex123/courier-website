import React, { useEffect, useState } from 'react';
import { Truck, Search, CheckCircle, Clock, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    
    fetch(`${API_URL}/api/admin/shipments`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setShipments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      
      const res = await fetch(`${API_URL}/api/admin/shipments/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setShipments(shipments.map(s => s.id === id ? { ...s, status: newStatus } : s));
        toast.success('Shipment status updated');
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="text-yellow-500 font-black uppercase text-xs">Loading shipments...</div>;

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto">
      <div className="bg-[#1c1917] border border-white/10 p-6">
        <h2 className="text-2xl font-black uppercase tracking-wider text-white">Active Shipments</h2>
        <p className="text-xs text-white/50 tracking-widest uppercase mt-1">Manage delivery statuses and tracking logs</p>
      </div>

      <div className="bg-[#1c1917] border border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-white/60">
              <th className="p-4">Tracking #</th>
              <th className="p-4">Client</th>
              <th className="p-4">Route</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {shipments.map(s => (
              <tr key={s.id} className="hover:bg-white/[0.02]">
                <td className="p-4 font-mono text-yellow-500 font-bold">{s.tracking_number}</td>
                <td className="p-4 font-bold uppercase">{s.client_name}</td>
                <td className="p-4 text-white/70 uppercase">{s.origin} &rarr; {s.destination}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 font-black uppercase border border-yellow-500/20">
                    {s.status}
                  </span>
                </td>
                <td className="p-4">
                  <select 
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value)}
                    className="bg-black border border-white/20 text-white px-2 py-1 uppercase font-bold focus:outline-none focus:border-yellow-500 cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}