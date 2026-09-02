import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import ShipmentStatusBadge from "../components/logistics/ShipmentStatusBadge";
import EmptyState from "../components/logistics/EmptyState";
import ShipmentDetailModal from "./ShipmentDetailModal";
import { supabase } from "../lib/supabaseClient";

const STATUS_LABELS = {
  created: "Created",
  confirmed: "Confirmed",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  at_destination_facility: "At Destination",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const fmtMoney = (val) => `$${Number(val || 0).toFixed(2)}`;
const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function MyShipments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCode, setUserCode] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null); 
  
  const fetchUserDataAndShipments = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setShipments([]);
        setLoading(false);
        return;
      }

      let assignedCode = user.user_metadata?.customer_id;

      if (!assignedCode) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .single();

        if (!profileError && profileData) {
          assignedCode = profileData.customer_id;
        }
      }

      setUserCode(assignedCode || "—");

      if (!assignedCode) {
        setShipments([]);
        setLoading(false);
        return;
      }

      const safeCode = String(assignedCode).trim();
      
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .or(`customer_id.eq.${safeCode},user_id.eq.${safeCode},profile_id.eq.${safeCode}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const fetchedShipments = data || [];
      setShipments(fetchedShipments);

      // Check if URL has an 'open' query parameter to auto-open modal
      const openId = searchParams.get('open');
      if (openId) {
        const match = fetchedShipments.find((s) => s.id === openId);
        if (match) {
          setSelectedShipment(match);
          setSearchParams({}, { replace: true });
        }
      }
    } catch (err) {
      console.error("Error fetching shipments by user ID:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndShipments();

    const channel = supabase
      .channel('public:shipments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        fetchUserDataAndShipments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = shipments.filter((s) => {
    const matchQ = !q || (
      (s.tracking_number || "") + 
      (s.shipment_number || "") + 
      (s.origin || "") + 
      (s.destination || "") + 
      (s.recipient_name || "")
    ).toLowerCase().includes(q.toLowerCase());
    const matchS = !status || s.current_status === status;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My Shipments</h1>
          <p className="text-xs text-slate-500"></p>
        </div>
        {userCode && (
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-slate-600 font-medium">Unique ID:</span>
            <span className="font-mono text-xs font-bold text-slate-900 tracking-wider">{userCode}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search tracking, origin, recipient…" 
            className="flex-1 py-2.5 text-sm outline-none bg-transparent" 
          />
        </div>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)} 
          className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm shadow-sm outline-none"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_LABELS).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mb-2" />
          <p className="text-sm text-slate-500">Loading your shipments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState 
            icon={Package} 
            title="No shipments found" 
            description={q || status ? "No shipments match your search." : ""} 
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Tracking #</th>
                  <th className="text-left px-4 py-3 font-semibold">Route</th>
                  <th className="text-left px-4 py-3 font-semibold">Service</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Price</th>
                  <th className="text-left px-4 py-3 font-semibold">Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedShipment(s)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{s.tracking_number}</td>
                    <td className="px-4 py-3 text-slate-600">{s.origin} → {s.destination}</td>
                    <td className="px-4 py-3 text-slate-600">{s.service_type}</td>
                    <td className="px-4 py-3"><ShipmentStatusBadge status={s.current_status} /></td>
                    <td className="px-4 py-3 font-medium text-slate-800 font-mono">{fmtMoney(s.price)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(s.created_at || s.created_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShipment(s);
                        }}
                        className="inline-flex p-1 text-yellow-600 hover:text-yellow-500 transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map((s) => (
              <div 
                key={s.id} 
                onClick={() => setSelectedShipment(s)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-900 text-sm">{s.tracking_number}</span>
                  <ShipmentStatusBadge status={s.current_status} />
                </div>
                <div className="text-xs text-slate-500 mt-1">{s.origin} → {s.destination}</div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-sm">
                  <span className="text-xs text-slate-400">{fmtDate(s.created_at || s.created_date)}</span>
                  <span className="font-medium font-mono text-slate-900">{fmtMoney(s.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Shipment Detail Modal Popup */}
      {selectedShipment && (
        <ShipmentDetailModal 
          shipment={selectedShipment} 
          onClose={() => setSelectedShipment(null)} 
        />
      )}
    </div>
  );
}