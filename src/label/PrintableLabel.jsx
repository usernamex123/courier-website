import React, { forwardRef } from "react";
import { fmtDate } from "../lib/shipmentStatus";

// Printable shipping label. Uses window.print() — browser handles PDF download.
const Label = forwardRef(({ shipment }, ref) => {
  if (!shipment) return null;
  return (
    <div ref={ref} className="bg-white text-black p-8 w-[400px] font-sans" style={{ width: 400 }}>
      <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
        <div>
          <div className="text-2xl font-black tracking-tight">JB LOGISTICS</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Shipping Label</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500">Service</div>
          <div className="font-bold text-sm uppercase">{shipment.service_type}</div>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Tracking Number</div>
        <div className="text-2xl font-black tracking-wider">{shipment.tracking_number}</div>
        <div className="flex justify-center mt-2">
          {/* Visual barcode stand-in (printable) */}
          <div className="flex gap-[2px] h-10 items-end">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} style={{ height: (i % 3 === 0 ? 100 : i % 2 === 0 ? 70 : 40) + '%' }} className={i % 2 === 0 ? 'w-[3px] bg-black' : 'w-[2px] bg-white'} />
            ))}
          </div>
        </div>
        <div className="text-[9px] text-gray-400 mt-1">{shipment.shipment_number}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-300 p-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">From</div>
          <div className="font-bold text-sm">{shipment.sender_name}</div>
          {shipment.sender_company && <div className="text-xs">{shipment.sender_company}</div>}
          <div className="text-xs">{shipment.sender_address}</div>
          <div className="text-xs">{[shipment.sender_city, shipment.sender_state, shipment.sender_postal_code].filter(Boolean).join(", ")}</div>
          <div className="text-xs">{shipment.sender_country}</div>
          {shipment.sender_phone && <div className="text-xs text-gray-500 mt-1">{shipment.sender_phone}</div>}
        </div>
        <div className="border-2 border-black p-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">To</div>
          <div className="font-bold text-sm">{shipment.recipient_name}</div>
          {shipment.recipient_company && <div className="text-xs">{shipment.recipient_company}</div>}
          <div className="text-xs">{shipment.recipient_address}</div>
          <div className="text-xs">{[shipment.recipient_city, shipment.recipient_state, shipment.recipient_postal_code].filter(Boolean).join(", ")}</div>
          <div className="text-xs">{shipment.recipient_country}</div>
          {shipment.recipient_phone && <div className="text-xs text-gray-500 mt-1">{shipment.recipient_phone}</div>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-gray-300 pt-3 text-[11px]">
        <div><div className="text-gray-500">Weight</div><div className="font-bold">{shipment.weight_lb} lb</div></div>
        <div><div className="text-gray-500">Dimensions</div><div className="font-bold">{shipment.length_in}×{shipment.width_in}×{shipment.height_in} in</div></div>
        <div><div className="text-gray-500">Package</div><div className="font-bold">{shipment.package_type}</div></div>
      </div>
      <div className="mt-3 text-[10px] text-gray-500 flex justify-between">
        <span>Est. Delivery: {fmtDate(shipment.estimated_delivery_date)}</span>
        <span>JB Logistics · www.jblogistics.com</span>
      </div>
    </div>
  );
});

export default Label;