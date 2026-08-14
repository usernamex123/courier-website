import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, CheckCircle2, Clock, ArrowRight, Loader2 } from "lucide-react";
import KpiCard from "../components/logistics/KpiCard";
import EmptyState from "../components/logistics/EmptyState";
import ShipmentStatusBadge from "../components/logistics/ShipmentStatusBadge";
import { supabase } from "../lib/supabaseClient";

export default function UserDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCode, setUserCode] = useState(null);

  const fetchUserDataAndShipments = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

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

      const safeCode = assignedCode ? String(assignedCode).trim() : null;
      setUserCode(safeCode || "—");

      if (safeCode) {
        const { data: shipData, error: shipError } = await supabase
          .from('shipments')
          .select('*')
          .or(`customer_id.eq.${safeCode},user_id.eq.${safeCode},profile_id.eq.${safeCode}`)
          .order('created_at', { ascending: false });

        if (shipError) throw shipError;
        setShipments(shipData || []);
      } else {
        setShipments([]);
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndShipments();

    const shipmentChannel = supabase
      .channel('public:shipments-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        fetchUserDataAndShipments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(shipmentChannel);
    };
  }, []);

  const fmtMoney = (val) => `$${Number(val || 0).toFixed(2)}`;

  const inTransit = shipments.filter((s) => 
    ["in_transit", "out_for_delivery", "at_destination_facility", "picked_up"].includes(s.current_status)
  ).length;
  
  const delivered = shipments.filter((s) => s.current_status === "delivered").length;
  
  const pending = shipments.filter((s) => 
    ["created", "confirmed", "pickup_scheduled"].includes(s.current_status)
  ).length;
  
  const recent = shipments.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Total Shipments" value={shipments.length} accent="black" />
        <KpiCard icon={Clock} label="Pending" value={pending} accent="yellow" />
        <KpiCard icon={Truck} label="In Transit" value={inTransit} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Delivered" value={delivered} accent="green" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-900">Recent Shipments</h2>
            <Link to="/dashboard/myshipments" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              View All
            </Link>
          </div>
        </div>

        {recent.length === 0 ? (
          <EmptyState icon={Package} title="No shipments yet" description="You don't have any shipments assigned to your ID yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((s) => (
              <Link key={s.id} to={`/dashboard/myshipments?open=${s.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="min-w-0 pr-4">
                  <div className="font-mono font-semibold text-sm text-slate-900">{s.tracking_number}</div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {s.origin || "Damak"} → {s.destination || "Damak"}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ShipmentStatusBadge status={s.current_status} />
                  <span className="text-sm font-medium text-slate-700 hidden sm:block font-mono">
                    {fmtMoney(s.price)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}