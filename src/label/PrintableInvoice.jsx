import React from 'react';

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

export default function PrintableInvoice({ id, invoice, shipment, customer }) {
  const isPaid = (invoice?.status || '').toLowerCase() === 'paid';
  const totalAmount = invoice?.total || invoice?.amount || 0;
  const currency = invoice?.currency || 'USD';
  const invoiceNumber = invoice?.invoice_number || `INV-${invoice?.id?.slice(0, 8) || '0000'}`;
  const issuedDate = invoice?.issued_at || invoice?.created_at;

  return (
    <div 
      id={id} 
      className="bg-white text-slate-800 w-[750px] p-10 font-sans shadow-lg relative border border-slate-200 select-none"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Optional Watermark / Stamp for Paid Invoices */}
      {isPaid && (
        <div className="absolute right-12 top-28 border-4 border-green-600 text-green-600 font-black text-3xl px-6 py-2 rotate-[-12deg] tracking-widest uppercase opacity-20 pointer-events-none">
          PAID
        </div>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">JB LOGISTICS</h1>
          <p className="text-xs text-slate-500 mt-1">
            customer_care@jblogisticservices.com • +1 (216) 569-5350
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Invoice</h2>
          <p className="text-sm font-mono font-bold text-slate-700 mt-1">{invoiceNumber}</p>
          <p className="text-xs text-slate-500 mt-0.5">Issued: {fmtDate(issuedDate)}</p>
        </div>
      </div>

      {/* Billed To & Shipment Details */}
      <div className="grid grid-cols-2 gap-8 my-8 text-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Billed To</span>
          <p className="font-bold text-slate-900">{customer?.email || customer?.billing_email || "Customer"}</p>
          <p className="text-slate-600 text-xs mt-0.5">{customer?.address || "—"}</p>
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Shipment Details</span>
          <p className="text-slate-700 text-xs"><strong className="text-slate-900">Tracking:</strong> {shipment?.tracking_number || invoice?.tracking_number || "—"}</p>
          <p className="text-slate-700 text-xs mt-0.5"><strong className="text-slate-900">Ref:</strong> {shipment?.reference || "—"}</p>
          <p className="text-slate-700 text-xs mt-0.5">
            <strong className="text-slate-900">Route:</strong> {shipment?.origin || "Origin"} → {shipment?.destination || "Destination"}
          </p>
          <p className="text-slate-700 text-xs mt-0.5"><strong className="text-slate-900">Service:</strong> {shipment?.service_level || "Standard"}</p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mt-6">
        <div className="grid grid-cols-12 bg-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 rounded-lg">
          <div className="col-span-8">Description</div>
          <div className="col-span-4 text-right">Amount</div>
        </div>
        <div className="divide-y divide-slate-100 text-sm">
          <div className="grid grid-cols-12 px-4 py-3 items-center">
            <div className="col-span-8 font-medium text-slate-800">Base Shipping</div>
            <div className="col-span-4 text-right font-semibold text-slate-900">
              {fmtMoney(invoice?.base_amount || totalAmount, currency)}
            </div>
          </div>
          {Number(invoice?.fuel_surcharge) > 0 && (
            <div className="grid grid-cols-12 px-4 py-3 items-center">
              <div className="col-span-8 font-medium text-slate-800">Fuel Surcharge</div>
              <div className="col-span-4 text-right font-semibold text-slate-900">
                {fmtMoney(invoice.fuel_surcharge, currency)}
              </div>
            </div>
          )}
          {Number(invoice?.tax) > 0 && (
            <div className="grid grid-cols-12 px-4 py-3 items-center">
              <div className="col-span-8 font-medium text-slate-800">Tax</div>
              <div className="col-span-4 text-right font-semibold text-slate-900">
                {fmtMoney(invoice.tax, currency)}
              </div>
            </div>
          )}
          {Number(invoice?.discount) > 0 && (
            <div className="grid grid-cols-12 px-4 py-3 items-center">
              <div className="col-span-8 font-medium text-slate-800">Discount</div>
              <div className="col-span-4 text-right font-semibold text-slate-900">
                -{fmtMoney(invoice.discount, currency)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Section */}
      <div className="mt-8 pt-6 border-t-2 border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {isPaid ? 'Paid in Full' : 'Payment Due'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            {isPaid ? 'Total Paid:' : 'Total Amount Due:'}
          </span>
          <span className={`text-2xl font-black ${isPaid ? 'text-green-600' : 'text-slate-900'}`}>
            {fmtMoney(totalAmount, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}