import React, { useEffect, useState } from "react";
import { Package, Users, Truck, DollarSign, TrendingUp, Clock, AlertCircle, MapPin, Loader2 } from "lucide-react";
import StatCard from "./admin/StatCard";
import StatusBadge from "./admin/StatusBadge";
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

// Import central singleton Supabase instance
import { supabase } from "../lib/supabaseClient";

const MODE_COLORS = {
  "Road Freight": "#f59e0b", "Sea Freight": "#3b82f6", "Air Freight": "#06b6d4", "Rail Freight": "#8b5cf6",
  "Express Delivery": "#10b981", "Same Day Delivery": "#ec4899", "Cold Chain": "#0ea5e9", "Dangerous Goods": "#ef4444", "Project Cargo": "#6366f1",
  "Standard": "#f59e0b", "Express": "#10b981", "Priority": "#6366f1"
};

const parseDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val);
  if (typeof val === "object" && val._seconds) return new Date(val._seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        let shipments = [];
        let customers = [];
        let drivers = [];
        let invoices = [];

        try {
          const res = await supabase.from("shipments").select("*");
          if (res.data) shipments = res.data;
        } catch (e) {}

        try {
          const res = await supabase.from("customers").select("*");
          if (res.data) customers = res.data;
        } catch (e) {}

        try {
          const res = await supabase.from("driver_profiles").select("*");
          if (res.data) drivers = res.data;
        } catch (e) {}

        try {
          const res = await supabase.from("invoices").select("*");
          if (res.data) invoices = res.data;
        } catch (e) {}

        const now = new Date();
        const months = [];
        for (let i = 6; i >= 0; i--) { 
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1); 
          months.push({ key: monthKey(d), label: d.toLocaleString("en", { month: "short" }) }); 
        }

        const revByMonth = Object.fromEntries(months.map((m) => [m.key, 0]));
        
        const paidInvoices = invoices.filter((inv) => {
          const status = (inv.status || "").toLowerCase();
          return ["paid", "completed", "success"].includes(status);
        });

        if (paidInvoices.length > 0) {
          paidInvoices.forEach((inv) => { 
            const d = parseDate(inv.issue_date || inv.created_at || inv.created_date); 
            if (d && revByMonth[monthKey(d)] != null) {
              revByMonth[monthKey(d)] += Number(inv.total || inv.amount || 0);
            }
          });
        } else if (invoices.length === 0) {
          shipments.forEach((s) => {
            const d = parseDate(s.created_at || s.created_date);
            const priceVal = Number(s.price || s.cost || 0);
            if (d && revByMonth[monthKey(d)] != null) {
              revByMonth[monthKey(d)] += priceVal;
            }
          });
        }

        const revenueData = months.map((m) => ({ 
          month: m.label, 
          value: Math.round((revByMonth[m.key] || 0) / 1000 * 10) / 10 
        }));

        const thisM = monthKey(now);
        const lastM = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

        const sThis = shipments.filter((s) => { const d = parseDate(s.created_at || s.created_date); return d && monthKey(d) === thisM; }).length;
        const sLast = shipments.filter((s) => { const d = parseDate(s.created_at || s.created_date); return d && monthKey(d) === lastM; }).length;
        const shipmentsChange = sLast ? Math.round(((sThis - sLast) / sLast) * 100) : (sThis > 0 ? 100 : 0);

        const cThis = customers.filter((c) => { const d = parseDate(c.created_at || c.created_date); return d && monthKey(d) === thisM; }).length;
        const cLast = customers.filter((c) => { const d = parseDate(c.created_at || c.created_date); return d && monthKey(d) === lastM; }).length;
        const customersChange = cLast ? Math.round(((cThis - cLast) / cLast) * 100) : (cThis > 0 ? 100 : 0);

        const revThis = revByMonth[thisM] || 0;
        const revLast = revByMonth[lastM] || 0;
        const revChange = revLast ? Math.round(((revThis - revLast) / revLast) * 100) : (revThis > 0 ? 100 : 0);

        const totalRevenue = paidInvoices.length > 0 
          ? paidInvoices.reduce((sum, i) => sum + Number(i.total || i.amount || 0), 0)
          : (invoices.length === 0 ? shipments.reduce((sum, s) => sum + Number(s.price || s.cost || 0), 0) : 0);

        const activeCustomersCount = customers.length > 0
          ? customers.filter((c) => c.status === "active" || !c.status).length
          : new Set(shipments.map(s => s.user_id || s.customer_id || s.sender_name)).size;

        const driversOnDuty = drivers.filter((d) => ["available", "on_delivery", "active"].includes(d.status)).length;
        const driversPct = drivers.length ? Math.round((driversOnDuty / drivers.length) * 100) : (driversOnDuty > 0 ? 100 : 0);

        const modeCounts = {};
        shipments.forEach((s) => { 
          const k = s.service_type || "Standard"; 
          modeCounts[k] = (modeCounts[k] || 0) + 1; 
        });

        const modeData = Object.entries(modeCounts)
          .map(([name, value]) => ({ name: name.replace(" Freight", ""), value, fill: MODE_COLORS[name] || MODE_COLORS["Standard"] || "#f59e0b" }))
          .sort((a, b) => b.value - a.value);
        const modeTotal = modeData.reduce((s, m) => s + m.value, 0) || 1;

        const deliveredThisMonth = shipments.filter((s) => {
          const status = s.current_status || s.status;
          const d = parseDate(s.updated_at || s.created_at || s.created_date);
          return status === "delivered" && d && monthKey(d) === thisM;
        }).length;

        const inTransitNow = shipments.filter((s) => {
          const status = s.current_status || s.status;
          return ["in_transit", "out_for_delivery", "picked_up", "at_origin_facility", "at_destination_facility"].includes(status);
        }).length;

        const delayed = shipments.filter((s) => {
          const status = s.current_status || s.status;
          return ["failed", "returned", "delayed"].includes(status);
        }).length;

        const active = shipments.filter((s) => {
          const status = s.current_status || s.status;
          return ["in_transit", "out_for_delivery", "picked_up", "at_origin_facility", "at_destination_facility"].includes(status);
        }).slice(0, 5);

        const recent = [...shipments].sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, 6);

        setData({
          totalShipments: shipments.length,
          activeCustomers: activeCustomersCount,
          driversOnDuty,
          driversPct,
          totalRevenue,
          shipmentsChange,
          customersChange,
          revChange,
          revenueData,
          modeData,
          modeTotal,
          deliveredThisMonth,
          inTransitNow,
          delayed,
          active,
          recent,
        });
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const cur = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return Number(n).toFixed(2);
  };

  return (
    <div className="space-y-4 sm:space-y-6 font-sans w-full max-w-full overflow-hidden">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Package} label="Total Shipments" value={data.totalShipments.toLocaleString()} change={`${Math.abs(data.shipmentsChange)}%`} changeType={data.shipmentsChange >= 0 ? "up" : "down"} color="blue" />
        <StatCard icon={Users} label="Active Customers" value={data.activeCustomers.toLocaleString()} change={`${Math.abs(data.customersChange)}%`} changeType={data.customersChange >= 0 ? "up" : "down"} color="green" />
        <StatCard icon={Truck} label="Drivers On Duty" value={data.driversOnDuty.toLocaleString()} change={`${data.driversPct}%`} changeType="up" color="amber" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${cur(data.totalRevenue)}`} change={`${Math.abs(data.revChange)}%`} changeType={data.revChange >= 0 ? "up" : "down"} color="purple" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm p-4 sm:p-5 overflow-hidden min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Revenue Overview</h3>
              <p className="text-[11px] text-gray-500">Monthly revenue from paid invoices</p>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
          </div>
          <div className="h-[220px] sm:h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} width={40} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", backgroundColor: "#ffffff", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden min-w-0">
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5">Shipment Modes</h3>
            <p className="text-[11px] text-gray-500 mb-3">Distribution by transport type</p>
            <div className="h-[150px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.modeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                    {data.modeData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", backgroundColor: "#ffffff", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5 mt-3 max-h-[120px] overflow-y-auto pr-1">
            {data.modeData.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-gray-700 truncate pr-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.fill }} /> {m.name}
                </span>
                <span className="font-bold text-gray-900 shrink-0">{m.value} <span className="text-gray-400 font-normal">({Math.round((m.value / data.modeTotal) * 100)}%)</span></span>
              </div>
            ))}
            {data.modeData.length === 0 && <div className="text-[11px] text-gray-400 text-center py-2">No shipment data</div>}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm p-4 sm:p-5 overflow-hidden min-w-0">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3">Recent Shipments</h3>

          {/* Mobile Card View */}
          <div className="xl:hidden space-y-2.5">
            {data.recent.map((s, i) => (
              <div key={s.id || i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <span className="font-mono font-bold text-xs text-gray-900 truncate pr-2">{s.tracking_number || "—"}</span>
                  <StatusBadge status={s.current_status || s.status} />
                </div>
                <div className="flex justify-between text-xs text-gray-600 min-w-0">
                  <span className="text-gray-400 font-medium shrink-0">Route:</span>
                  <span className="font-medium text-gray-800 truncate pl-2">{s.origin || "—"} → {s.destination || "—"}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200/60">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Price</span>
                  <span className="font-bold text-xs text-gray-900">${Number(s.price || s.cost || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {data.recent.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">No shipments recorded yet</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block overflow-x-auto w-full">
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100 uppercase tracking-wider">
                  <th className="pb-2.5 font-bold w-[25%]">Tracking #</th>
                  <th className="pb-2.5 font-bold w-[40%]">Route</th>
                  <th className="pb-2.5 font-bold w-[20%]">Status</th>
                  <th className="pb-2.5 font-bold text-right w-[15%]">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent.map((s, i) => (
                  <tr key={s.id || i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 font-bold text-gray-900 font-mono truncate pr-2" title={s.tracking_number || "—"}>{s.tracking_number || "—"}</td>
                    <td className="py-3 text-gray-600 truncate pr-2" title={`${s.origin || "—"} → ${s.destination || "—"}`}>{s.origin || "—"} → {s.destination || "—"}</td>
                    <td className="py-3"><StatusBadge status={s.current_status || s.status} /></td>
                    <td className="py-3 text-right font-bold text-gray-900 truncate">${Number(s.price || s.cost || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {data.recent.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-400 text-xs">No shipments recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden min-w-0">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Live Active Shipments</h3>
              <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
            </div>
            <div className="space-y-2.5">
              {data.active.map((s, i) => (
                <div key={s.id || i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50/80 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-gray-900 truncate font-mono">{s.tracking_number || "—"}</div>
                    <div className="text-[10px] text-gray-500 truncate">{s.destination || "In transit"}</div>
                  </div>
                  <div className="shrink-0 scale-90 origin-right">
                    <StatusBadge status={s.current_status || s.status} />
                  </div>
                </div>
              ))}
              {data.active.length === 0 && (
                <div className="text-[11px] text-gray-400 text-center py-6">No active shipments in transit</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Footers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-black text-gray-900 truncate">{data.deliveredThisMonth.toLocaleString()}</div>
            <div className="text-[11px] text-gray-500 font-medium truncate">Delivered this month</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-black text-gray-900 truncate">{data.inTransitNow.toLocaleString()}</div>
            <div className="text-[11px] text-gray-500 font-medium truncate">In transit right now</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-black text-gray-900 truncate">{data.delayed.toLocaleString()}</div>
            <div className="text-[11px] text-gray-500 font-medium truncate">Delayed / flagged issues</div>
          </div>
        </div>
      </div>
    </div>
  );
}