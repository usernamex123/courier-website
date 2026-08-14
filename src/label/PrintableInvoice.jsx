import React from "react";

const fmtMoney = (amount, currency = "USD") => {
  const num = Number(amount);
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(num);
};

const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function PrintableInvoice({ id, invoice, shipment }) {
  if (!invoice) return null;

  const items = invoice.items || [
    { description: "Base Shipping", amount: invoice.base_shipping || invoice.amount || 0 },
    { description: "Fuel Surcharge", amount: invoice.fuel_surcharge || 0 },
    { description: "Tax", amount: invoice.tax || 0 },
    { description: "Discount", amount: invoice.discount || 0 }
  ];

  const totalAmount = invoice.total || invoice.amount || 0;

  return (
    <div id={id} className="w-[800px] bg-white text-slate-900 p-10 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">JB LOGISTICS</h1>
          <p className="text-xs text-slate-500 mt-0.5">American Logistics & Courier Services</p>
          <p className="text-xs text-slate-500 mt-1">
            customer_care@jblogisticsservices.com · +1 (216) 569-5350
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-800">INVOICE</h2>
          <p className="font-mono text-sm font-semibold text-slate-600 mt-1">
            {invoice.invoice_number || `INV-${invoice.id?.slice(0, 8)}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Issued: {fmtDate(invoice.issued_at || invoice.created_at)}
          </p>
        </div>
      </div>

      {/* Bill To & Shipment Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Billed To</h3>
          <p className="font-semibold text-slate-800">{invoice.billed_to_name || shipment?.receiver_name || "Valued Customer"}</p>
          <p className="text-slate-600 whitespace-pre-line mt-1">
            {invoice.billed_to_address || shipment?.receiver_address || "—"}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Shipment Details</h3>
          <p className="text-slate-700"><span className="text-slate-400">Tracking:</span> <span className="font-mono font-semibold">{invoice.tracking_number || shipment?.tracking_number || "—"}</span></p>
          <p className="text-slate-700 mt-0.5"><span className="text-slate-400">Ref:</span> {shipment?.reference || "—"}</p>
          <p className="text-slate-700 mt-0.5"><span className="text-slate-400">Route:</span> {shipment?.origin || "—"} → {shipment?.destination || "—"}</p>
          <p className="text-slate-700 mt-0.5"><span className="text-slate-400">Service:</span> {shipment?.service_level || "Standard"}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <th className="text-left py-2 font-semibold">Description</th>
            <th className="text-right py-2 font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-3 text-slate-800">{item.description}</td>
              <td className="py-3 text-right font-medium text-slate-800">{fmtMoney(item.amount, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Section */}
      <div className="flex justify-end border-t border-slate-200 pt-4">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
            <span>Total:</span>
            <span>{fmtMoney(totalAmount, invoice.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}