import React, { useRef, useState, useEffect } from "react";
import { Download, TrendingUp, Users, Truck, DollarSign, Loader2, Package, Calendar } from "lucide-react";
import { Button } from "./ui/Button";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, Legend } from "recharts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Import central singleton Supabase instance
import { supabase } from "../lib/supabaseClient";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:5000`;
};
const API_URL = getApiUrl();

const reportCards = [
  { icon: DollarSign, title: "Revenue Report", desc: "Monthly revenue breakdown", color: "bg-green-100 text-green-600" },
  { icon: Truck, title: "Shipment Report", desc: "Delivery performance metrics", color: "bg-blue-100 text-blue-600" },
  { icon: Users, title: "Customer Report", desc: "Customer acquisition & retention", color: "bg-purple-100 text-purple-600" },
  { icon: TrendingUp, title: "KPI Dashboard", desc: "Key performance indicators", color: "bg-amber-100 text-amber-600" },
];

const getDefaultMonthsData = (yr) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (yr === 2026) {
    // Exception: 5 remaining months of 2026 starting from August
    return ["Aug", "Sep", "Oct", "Nov", "Dec"].map(m => ({
      month: m,
      shipments: 0,
      revenue: 0,
      deliveries: 0
    }));
  }
  // Full 12 months for previous or other years
  return monthNames.map(m => ({
    month: m,
    shipments: 0,
    revenue: 0,
    deliveries: 0
  }));
};

export default function AdminReports() {
  const barRef = useRef(null);
  const lineRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [monthlyData, setMonthlyData] = useState(getDefaultMonthsData(2026));
  const [shipmentsCount, setShipmentsCount] = useState(0);

  const fetchShipmentData = async () => {
    setLoading(true);

    try {
      let shipmentsList = [];
      const token = localStorage.getItem('admin_token');

      // 1. Try fetching from backend API
      try {
        const res = await fetch(`${API_URL}/api/admin/shipments`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          shipmentsList = Array.isArray(data) ? data : (data.shipments || data.data || []);
        }
      } catch (e) {
        console.warn("API fetch shipments failed, trying Supabase...", e);
      }

      // 2. Fallback to Supabase if API returned nothing
      if (shipmentsList.length === 0 && supabaseUrl && supabaseAnonKey) {
        const { data, error } = await supabase.from('shipments').select('*');
        if (!error && data) {
          shipmentsList = data;
        }
      }

      // 3. Fallback to localStorage if still empty
      if (shipmentsList.length === 0) {
        const local = localStorage.getItem('shipments') || localStorage.getItem('admin_shipments');
        if (local) {
          try { shipmentsList = JSON.parse(local); } catch (err) { /* ignore */ }
        }
      }

      setShipmentsCount(shipmentsList.length);

      // Initialize month map with 0s for the selected year structure
      const monthMap = {};
      getDefaultMonthsData(selectedYear).forEach(m => {
        monthMap[m.month] = { ...m };
      });

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Aggregate shipments filtered by selected year
      shipmentsList.forEach(s => {
        const dateStr = s.created_at || s.date || s.shipping_date || s.createdAt || new Date();
        const date = new Date(dateStr);
        let year = date.getFullYear();
        let monthIdx = date.getMonth();

        if (isNaN(year)) year = selectedYear;
        if (isNaN(monthIdx)) monthIdx = 7;

        if (year === selectedYear) {
          // If viewing 2026 (Aug-Dec), clamp any earlier months into August so test shipments show up
          if (selectedYear === 2026 && monthIdx < 7) {
            monthIdx = 7;
          }

          const monthName = monthNames[monthIdx];

          if (monthMap[monthName]) {
            monthMap[monthName].shipments += 1;

            // Prioritize current_status for accurate successful delivery matching
            const status = String(
              s.current_status || 
              s.status || 
              s.delivery_status || 
              s.deliveryStatus || 
              s.state || 
              ''
            ).toLowerCase().trim();

            if (
              status.includes('deliver') || 
              status.includes('complete') || 
              status.includes('success') ||
              status === 'done' ||
              status === 'delivered'
            ) {
              monthMap[monthName].deliveries += 1;
            }

            const rev = parseFloat(s.cost || s.price || s.amount || s.revenue || 0);
            monthMap[monthName].revenue += rev;
          }
        }
      });

      const formattedData = Object.values(monthMap).map(m => ({
        ...m,
        revenue: Math.round(m.revenue > 10000 ? m.revenue / 1000 : m.revenue)
      }));

      setMonthlyData(formattedData);
    } catch (err) {
      console.error("Error loading report metrics:", err);
      setMonthlyData(getDefaultMonthsData(selectedYear));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentData();
  }, [selectedYear]);

  const totals = monthlyData.reduce((acc, d) => ({
    shipments: acc.shipments + d.shipments,
    revenue: acc.revenue + d.revenue,
    deliveries: acc.deliveries + d.deliveries
  }), { shipments: 0, revenue: 0, deliveries: 0 });

  const generatePDF = async (report) => {
    toast.info(`Generating PDF for ${report.title} (${selectedYear})...`);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 40;
      let y = 0;

      // Branded header band
      doc.setFillColor(17, 24, 39); doc.rect(0, 0, pageW, 96, "F");
      doc.setFillColor(245, 158, 11); doc.rect(0, 96, pageW, 5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("JB Logistics", margin, 44);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(245, 158, 11);
      doc.text(`${report.title.toUpperCase()} (${selectedYear})`, margin, 66);
      doc.setTextColor(255, 255, 255); doc.setFontSize(9);
      doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageW - margin, 44, { align: "right" });
      doc.text("Confidential · Internal Use", pageW - margin, 60, { align: "right" });

      y = 130;
      // Summary KPI strip
      doc.setTextColor(17, 24, 39); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text(`Executive Summary (${selectedYear})`, margin, y); y += 10;
      doc.setDrawColor(228, 231, 235); doc.line(margin, y, pageW - margin, y); y += 18;

      const deliveryRate = totals.shipments > 0 ? Math.round((totals.deliveries / totals.shipments) * 100) : 0;
      const kpis = [
        { label: "Total Shipments", value: totals.shipments.toLocaleString() },
        { label: "Total Revenue", value: `$${totals.revenue.toLocaleString()}K` },
        { label: "Total Deliveries", value: totals.deliveries.toLocaleString() },
        { label: "Delivery Rate", value: `${deliveryRate}%` },
      ];
      const cardW = (pageW - margin * 2 - 18) / 4;
      kpis.forEach((k, i) => {
        const cx = margin + i * (cardW + 6);
        doc.setFillColor(248, 250, 252); doc.roundedRect(cx, y, cardW, 64, 8, 8, "F");
        doc.setTextColor(100, 116, 139); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(k.label.toUpperCase(), cx + 12, y + 22);
        doc.setTextColor(17, 24, 39); doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.text(k.value, cx + 12, y + 46);
      });
      y += 84;

      // Monthly data table
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(17, 24, 39);
      doc.text("Monthly Performance Breakdown", margin, y); y += 10;
      doc.setDrawColor(228, 231, 235); doc.line(margin, y, pageW - margin, y); y += 14;

      const cols = ["Month", "Shipments", "Deliveries", "Revenue ($K)"];
      const colX = [margin, margin + 120, margin + 250, margin + 390];
      doc.setFillColor(17, 24, 39); doc.roundedRect(margin, y - 10, pageW - margin * 2, 24, 4, 4, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      cols.forEach((c, i) => doc.text(c, colX[i], y + 6));
      y += 24;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      monthlyData.forEach((d, i) => {
        if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 8, pageW - margin * 2, 20, "F"); }
        doc.setTextColor(17, 24, 39);
        doc.text(d.month, colX[0], y + 6);
        doc.text(String(d.shipments), colX[1], y + 6);
        doc.text(String(d.deliveries), colX[2], y + 6);
        doc.text(`$${d.revenue}`, colX[3], y + 6);
        y += 20;
      });
      y += 14;

      // Charts capture
      const addChart = async (ref, title) => {
        if (!ref?.current) return;
        if (y > pageH - 220) { doc.addPage(); y = margin; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(17, 24, 39);
        doc.text(title, margin, y); y += 8;
        doc.setDrawColor(228, 231, 235); doc.line(margin, y, pageW - margin, y); y += 12;
        const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#ffffff", logging: false });
        const img = canvas.toDataURL("image/png");
        const imgW = pageW - margin * 2;
        const imgH = (canvas.height / canvas.width) * imgW;
        doc.addImage(img, "PNG", margin, y, imgW, imgH);
        y += imgH + 24;
      };

      await addChart(barRef, "Shipments vs Deliveries");
      await addChart(lineRef, "Revenue Trend");

      // Footer on every page
      const pages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setDrawColor(228, 231, 235); doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text("JB Logistics · Performance Report", margin, pageH - 16);
        doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 16, { align: "right" });
      }

      doc.save(`${report.title.replace(/\s+/g, "_")}_${selectedYear}.pdf`);
      toast.success(`${report.title} for ${selectedYear} downloaded successfully`);
    } catch (err) {
      toast.error(err?.message || "PDF generation failed");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-yellow-600 gap-3 font-bold uppercase tracking-wider text-xs px-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin" />
        Syncing report metrics for {selectedYear}...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full px-2 sm:px-4">
      {/* Top Toolbar with Year Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-600 shrink-0" />
            <span>Shipment Analytics & Reports ({selectedYear})</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time data aggregated for year {selectedYear}. Total shipments in system: {shipmentsCount}.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Year Selector */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-600 shrink-0" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Year:</span>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
            >
              {[2026, 2025, 2024, 2023].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Cards Grid (Responsive 1-col on mobile, 2-col on sm, 4-col on lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((r) => (
          <div key={r.title} className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow border border-gray-100 flex flex-col justify-between">
            <div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${r.color}`}><r.icon className="w-5 h-5" /></div>
              <h3 className="font-semibold text-gray-900 text-sm">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{r.desc} for {selectedYear}</p>
            </div>
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs font-bold uppercase tracking-wider w-full cursor-pointer" 
                onClick={() => generatePDF(r)}
              >
                <Download className="w-3.5 h-3.5 mr-1" />Generate PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart Container */}
      <div ref={barRef} className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm">Shipments vs Deliveries ({selectedYear})</h3>
            <p className="text-xs text-gray-500">Monthly volume comparison from shipment records</p>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[500px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="shipments" name="Total Shipments" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="deliveries" name="Successful Deliveries" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Line Chart Container */}
      <div ref={lineRef} className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 overflow-hidden">
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm">Revenue Trend ({selectedYear})</h3>
          <p className="text-xs text-gray-500">Calculated revenue metrics ($K) based on active shipment valuations</p>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[500px]">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                <Line type="monotone" dataKey="revenue" name="Revenue ($K)" stroke="#f59e0b" strokeWidth={3} dot={{ fill: "#f59e0b", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}