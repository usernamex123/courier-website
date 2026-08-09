import React, { useRef } from "react";
import { Download, TrendingUp, Users, Truck, DollarSign } from "lucide-react";
import { Button } from "./ui/Button";
import { useToast } from "./ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, Legend } from "recharts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const monthlyData = [
  { month: "Feb", shipments: 210, revenue: 420, deliveries: 198 },
  { month: "Mar", shipments: 250, revenue: 510, deliveries: 235 },
  { month: "Apr", shipments: 230, revenue: 480, deliveries: 220 },
  { month: "May", shipments: 310, revenue: 620, deliveries: 298 },
  { month: "Jun", shipments: 280, revenue: 580, deliveries: 268 },
  { month: "Jul", shipments: 360, revenue: 720, deliveries: 345 },
  { month: "Aug", shipments: 410, revenue: 810, deliveries: 392 },
];

const reportCards = [
  { icon: DollarSign, title: "Revenue Report", desc: "Monthly revenue breakdown", color: "bg-green-100 text-green-600" },
  { icon: Truck, title: "Shipment Report", desc: "Delivery performance metrics", color: "bg-blue-100 text-blue-600" },
  { icon: Users, title: "Customer Report", desc: "Customer acquisition & retention", color: "bg-purple-100 text-purple-600" },
  { icon: TrendingUp, title: "KPI Dashboard", desc: "Key performance indicators", color: "bg-amber-100 text-amber-600" },
];

export default function Reports() {
  const { toast } = useToast();
  const barRef = useRef(null);
  const lineRef = useRef(null);

  const totals = monthlyData.reduce((acc, d) => ({ shipments: acc.shipments + d.shipments, revenue: acc.revenue + d.revenue, deliveries: acc.deliveries + d.deliveries }), { shipments: 0, revenue: 0, deliveries: 0 });

  const generatePDF = async (report) => {
    toast({ title: "Generating PDF", description: report.title });
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
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("TransNova Logistics", margin, 44);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(245, 158, 11);
      doc.text(report.title.toUpperCase(), margin, 66);
      doc.setTextColor(255, 255, 255); doc.setFontSize(9);
      doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageW - margin, 44, { align: "right" });
      doc.text("Confidential · Internal Use", pageW - margin, 60, { align: "right" });

      y = 130;
      // Summary KPI strip
      doc.setTextColor(17, 24, 39); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Executive Summary", margin, y); y += 10;
      doc.setDrawColor(228, 231, 235); doc.line(margin, y, pageW - margin, y); y += 18;

      const kpis = [
        { label: "Total Shipments", value: totals.shipments.toLocaleString() },
        { label: "Total Revenue", value: `$${totals.revenue.toLocaleString()}K` },
        { label: "Total Deliveries", value: totals.deliveries.toLocaleString() },
        { label: "Delivery Rate", value: `${Math.round((totals.deliveries / totals.shipments) * 100)}%` },
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

      // Charts
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
        doc.text("TransNova Logistics · Performance Report", margin, pageH - 16);
        doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 16, { align: "right" });
      }

      doc.save(`${report.title.replace(/\s+/g, "_")}.pdf`);
      toast({ title: "PDF generated", description: `${report.title}.pdf downloaded` });
    } catch (err) {
      toast({ title: "PDF generation failed", description: err?.message || "Unknown error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((r) => (
          <div key={r.title} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${r.color}`}><r.icon className="w-5 h-5" /></div>
            <h3 className="font-semibold text-navy text-sm">{r.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
            <div className="mt-3">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => generatePDF(r)}><Download className="w-3 h-3 mr-1" />Generate PDF</Button>
            </div>
          </div>
        ))}
      </div>

      <div ref={barRef} className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-navy">Shipments vs Deliveries</h3><p className="text-xs text-muted-foreground">Monthly comparison</p></div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="shipments" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="deliveries" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div ref={lineRef} className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-navy mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
            <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ fill: "#f59e0b", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}