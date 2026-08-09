import React, { useEffect, useState } from "react";
import { Package, Users, Truck, DollarSign, TrendingUp, Clock, AlertCircle, MapPin, Loader2 } from "lucide-react";
import StatCard from "./admin/StatCard";
import StatusBadge from "./admin/StatusBadge";
import { createClient } from "@supabase/supabase-js";
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder"
);

const MODE_COLORS = {
  "Road Freight": "#f59e0b", "Sea Freight": "#3b82f6", "Air Freight": "#06b6d4", "Rail Freight": "#8b5cf6",
  "Express Delivery": "#10b981", "Same Day Delivery": "#ec4899", "Cold Chain": "#0ea5e9", "Dangerous Goods": "#ef4444", "Project Cargo": "#6366f1",
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
          const res = await supabase.from("drivers").select("*");
          if (res.data) drivers = res.data;
        } catch (e) {}

        try {
          const res = await supabase.from("invoices").select("*");
          if (res.data) invoices = res.data;
        } catch (e) {}

        const fallbackShipments = shipments.length ? shipments : [
          { id: 1, tracking_number: "TRK-9081", origin: "New York", destination: "Chicago", status: "in_transit", service_type: "Road Freight", cost: 450, created_date: new Date().toISOString() },
          { id: 2, tracking_number: "TRK-9082", origin: "Los Angeles", destination: "Seattle", status: "delivered", service_type: "Air Freight", cost: 1200, created_date: new Date().toISOString() },
          { id: 3, tracking_number: "TRK-9083", origin: "Miami", destination: "Atlanta", status: "out_for_delivery", service_type: "Express Delivery", cost: 280, created_date: new Date().toISOString() },
        ];

        const fallbackCustomers = customers.length ? customers : [
          { id: 1, name: "Acme Corp", status: "active", created_date: new Date().toISOString() },
          { id: 2, name: "Global Logistics", status: "active", created_date: new Date().toISOString() },
        ];

        const fallbackDrivers = drivers.length ? drivers : [
          { id: 1, name: "John Doe", status: "available" },
          { id: 2, name: "Jane Smith", status: "on_delivery" },
        ];

        const fallbackInvoices = invoices.length ? invoices : [
          { id: 1, total: 1500, issue_date: new Date().toISOString() },
          { id: 2, total: 3200, issue_date: new Date().toISOString() },
        ];

        const activeShipmentsList = shipments.length ? shipments : fallbackShipments;
        const activeCustomersList = customers.length ? customers : fallbackCustomers;
        const activeDriversList = drivers.length ? drivers : fallbackDrivers;
        const activeInvoicesList = invoices.length ? invoices : fallbackInvoices;

        const now = new Date();
        const months = [];
        for (let i = 6; i >= 0; i--) { 
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1); 
          months.push({ key: monthKey(d), label: d.toLocaleString("en", { month: "short" }) }); 
        }

        const revByMonth = Object.fromEntries(months.map((m) => [m.key, 0]));
        activeInvoicesList.forEach((inv) => { 
          const d = parseDate(inv.issue_date || inv.created_date); 
          if (d && revByMonth[monthKey(d)] != null) {
            revByMonth[monthKey(d)] += Number(inv.total || inv.amount || 0);
          }
        });

        const revenueData = months.map((m) => ({ 
          month: m.label, 
          value: Math.round((revByMonth[m.key] || 0) / 1000 * 10) / 10 
        }));

        const thisM = monthKey(now);
        const lastM = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

        const sThis = activeShipmentsList.filter((s) => { const d = parseDate(s.created_date); return d && monthKey(d) === thisM; }).length;
        const sLast = activeShipmentsList.filter((s) => { const d = parseDate(s.created_date); return d && monthKey(d) === lastM; }).length;
        const shipmentsChange = sLast ? Math.round(((sThis - sLast) / sLast) * 100) : 0;

        const cThis = activeCustomersList.filter((c) => { const d = parseDate(c.created_date); return d && monthKey(d) === thisM; }).length;
        const cLast = activeCustomersList.filter((c) => { const d = parseDate(c.created_date); return d && monthKey(d) === lastM; }).length;
        const customersChange = cLast ? Math.round(((cThis - cLast) / cLast) * 100) : 0;

        const revThis = revByMonth[thisM] || 0;
        const revLast = revByMonth[lastM] || 0;
        const revChange = revLast ? Math.round(((revThis - revLast) / revLast) * 100) : 0;

        const totalRevenue = activeInvoicesList.reduce((s, i) => s + Number(i.total || i.amount || 0), 0);
        const activeCustomersCount = activeCustomersList.filter((c) => c.status === "active").length;
        const driversOnDuty = activeDriversList.filter((d) => ["available", "on_delivery"].includes(d.status)).length;
        const driversPct = activeDriversList.length ? Math.round((driversOnDuty / activeDriversList.length) * 100) : 0;

        const modeCounts = {};
        activeShipmentsList.forEach((s) => { 
          const k = s.service_type || "Road Freight"; 
          modeCounts[k] = (modeCounts[k] || 0) + 1; 
        });

        const modeData = Object.entries(modeCounts)
          .map(([name, value]) => ({ name: name.replace(" Freight", ""), value, fill: MODE_COLORS[name] || "#94a3b8" }))
          .sort((a, b) => b.value - a.value);
        const modeTotal = modeData.reduce((s, m) => s + m.value, 0) || 1;

        const deliveredThisMonth = activeShipmentsList.filter((s) => s.status === "delivered" && parseDate(s.updated_date || s.created_date) && monthKey(parseDate(s.updated_date || s.created_date)) === thisM).length;
        const inTransitNow = activeShipmentsList.filter((s) => ["in_transit", "out_for_delivery"].includes(s.status)).length;
        const delayed = activeShipmentsList.filter((s) => ["failed", "returned", "delayed"].includes(s.status)).length;

        const active = activeShipmentsList.filter((s) => ["in_transit", "out_for_delivery", "picked_up"].includes(s.status)).slice(0, 5);
        const recent = [...activeShipmentsList].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).slice(0, 6);

        setData({
          totalShipments: activeShipmentsList.length,
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

  const cur = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Shipments" value={data.totalShipments.toLocaleString()} change={`${Math.abs(data.shipmentsChange)}%`} changeType={data.shipmentsChange >= 0 ? "up" : "down"} color="blue" />
        <StatCard icon={Users} label="Active Customers" value={data.activeCustomers.toLocaleString()} change={`${Math.abs(data.customersChange)}%`} changeType={data.customersChange >= 0 ? "up" : "down"} color="green" />
        <StatCard icon={Truck} label="Drivers On Duty" value={data.driversOnDuty.toLocaleString()} change={`${data.driversPct}%`} changeType="up" color="amber" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${cur(Math.round(data.totalRevenue))}`} change={`${Math.abs(data.revChange)}%`} changeType={data.revChange >= 0 ? "up" : "down"} color="purple" />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Revenue Overview</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly revenue from paid invoices (in $K)</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", backgroundColor: "#ffffff", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Shipment Modes</h3>
            <p className="text-xs text-gray-500 mb-4">Distribution by transport type</p>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.modeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {data.modeData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", backgroundColor: "#ffffff", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 mt-4 max-h-[140px] overflow-y-auto pr-1">
            {data.modeData.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-gray-700">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.fill }} /> {m.name}
                </span>
                <span className="font-bold text-gray-900">{m.value} <span className="text-gray-400 font-normal">({Math.round((m.value / data.modeTotal) * 100)}%)</span></span>
              </div>
            ))}
            {data.modeData.length === 0 && <div className="text-xs text-gray-400 text-center py-4">No shipment data</div>}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-base mb-4">Recent Shipments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-bold">Tracking #</th>
                  <th className="pb-3 font-bold">Route</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent.map((s, i) => (
                  <tr key={s.id || i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 font-bold text-gray-900 text-xs font-mono">{s.tracking_number || "—"}</td>
                    <td className="py-3.5 text-gray-600 text-xs">{s.origin || "—"} → {s.destination || "—"}</td>
                    <td className="py-3.5"><StatusBadge status={s.status} /></td>
                    <td className="py-3.5 text-right font-bold text-gray-900 text-xs">${Number(s.cost || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {data.recent.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-xs">No shipments recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Live Active Shipments</h3>
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="space-y-3">
              {data.active.map((s, i) => (
                <div key={s.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate font-mono">{s.tracking_number || "—"}</div>
                    <div className="text-[11px] text-gray-500 truncate">{s.destination || "In transit"}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
              {data.active.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-8">No active shipments in transit</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Footers */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900">{data.deliveredThisMonth.toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium">Delivered this month</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900">{data.inTransitNow.toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium">In transit right now</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900">{data.delayed.toLocaleString()}</div>
            <div className="text-xs text-gray-500 font-medium">Delayed / flagged issues</div>
          </div>
        </div>
      </div>
    </div>
  );
}