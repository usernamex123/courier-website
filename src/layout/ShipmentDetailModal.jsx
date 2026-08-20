import React, { useRef } from "react";
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  Box, 
  Ruler, 
  Scale, 
  DollarSign, 
  Printer, 
  CheckCircle2
} from "lucide-react";
import PrintableLabel from "../label/PrintableLabel";

export default function ShipmentDetailModal({ shipment, onClose }) {
  const labelRef = useRef(null);

  if (!shipment) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && labelRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipping Label - ${shipment.tracking_number || ''}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; background: white; display: flex; justify-content: center; align-items: center; min-height: 100dvh; }
            </style>
          </head>
          <body>
            ${labelRef.current.outerHTML}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center p-4 sm:p-6 font-sans overflow-y-auto">
      {/* Hidden rendered Label for printing */}
      <div className="hidden">
        <PrintableLabel ref={labelRef} shipment={shipment} />
      </div>

      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-auto space-y-6 p-6 h-fit">
        
        {/* Navigation / Back */}
        <div>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> My Shipments
          </button>
        </div>

        {/* Tracking Number Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Tracking Number</div>
            <div className="text-lg font-bold text-gray-900 font-mono">{shipment.tracking_number || "—"}</div>
            <div className="text-xs text-gray-500 mt-0.5">Ref: {shipment.reference_number || shipment.ref || "—"}</div>
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
              {shipment.current_status?.replace('_', ' ') || 'Created'}
            </span>
          </div>
        </div>

        {/* Route & Core Info Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <span className="flex items-center gap-1 text-amber-600"><MapPin className="w-4 h-4" /></span>
              <span>{shipment.origin || "—"}</span>
              <span className="text-gray-400">→</span>
              <span className="flex items-center gap-1 text-amber-600"><MapPin className="w-4 h-4" /></span>
              <span>{shipment.destination || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/60">
              <Truck className="w-4 h-4 text-amber-600" /> {shipment.service_type || "Standard"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Est. Delivery</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(shipment.est_delivery_date)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Delivered</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(shipment.delivered_date)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Payment</div>
              <div className="font-bold text-gray-900 mt-1 capitalize">{shipment.payment_status || "Unpaid"}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase">Created</div>
              <div className="font-bold text-gray-900 mt-1">{formatDate(shipment.created_at)}</div>
            </div>
          </div>
        </div>

        {/* Sender & Recipient Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sender Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3">Sender</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-900">{shipment.sender_name || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Company</span>
                <span className="font-semibold text-gray-900">{shipment.sender_company || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-gray-900">{shipment.sender_phone || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Address</span>
                <span className="font-semibold text-gray-900">{shipment.sender_address || shipment.origin || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">City/State</span>
                <span className="font-semibold text-gray-900">{shipment.sender_city || shipment.origin || "—"}</span>
              </div>
            </div>
          </div>

          {/* Recipient Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3">Recipient</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-900">{shipment.recipient_name || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Company</span>
                <span className="font-semibold text-gray-900">{shipment.recipient_company || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-gray-900 font-mono">{shipment.recipient_phone || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Address</span>
                <span className="font-semibold text-gray-900">{shipment.recipient_address || shipment.destination || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">City/State</span>
                <span className="font-semibold text-gray-900">{shipment.recipient_city || shipment.destination || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Package & Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Package Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3">Package</h3>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <Box className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Type</div>
                  <div className="font-semibold text-gray-900 text-sm mt-0.5">{shipment.package_type || "Box"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Weight</div>
                  <div className="font-semibold text-gray-900 text-sm mt-0.5">{shipment.weight ? `${shipment.weight} lb` : "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3">
                <Ruler className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Dimensions</div>
                  <div className="font-semibold text-gray-900 text-sm mt-0.5">{shipment.dimensions || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Declared Value</div>
                  <div className="font-semibold text-gray-900 text-sm mt-0.5">${Number(shipment.declared_value || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 pb-3">Pricing</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Base Shipping</span>
                <span className="font-semibold text-gray-900">${Number(shipment.base_shipping || shipment.price || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Fuel Surcharge</span>
                <span className="font-semibold text-gray-900">${Number(shipment.fuel_surcharge || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Tax</span>
                <span className="font-semibold text-gray-900">${Number(shipment.tax || 0.00).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Discount</span>
                <span className="font-semibold text-gray-900">{shipment.discount ? `$${Number(shipment.discount).toFixed(2)}` : "—"}</span>
              </div>
              <div className="flex justify-between py-2 pt-3 font-bold text-base text-gray-900">
                <span>Total</span>
                <span>${Number(shipment.price || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase">Documents</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrintLabel}
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Label
            </button>
          </div>
        </div>

        {/* Tracking Timeline Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase">Tracking Timeline</h3>
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-black" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-900 text-sm">Created</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800">Latest</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{formatDate(shipment.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}