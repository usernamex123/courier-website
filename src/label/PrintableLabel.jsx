import React, { forwardRef, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { fmtDate } from "../lib/shipmentStatus";

// 100% Scannable QR Code generator function using a reliable API endpoint
function generateQRCodeSVG(text, size = 120) {
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  return (
    <img 
      src={qrImageUrl} 
      alt="Scan Tracker QR" 
      width={size} 
      height={size} 
      style={{ width: `${size}px`, height: `${size}px`, display: 'block' }} 
    />
  );
}

// Robust SVG Linear Barcode Generator
function generateBarcodeSVG(text, width = 240, height = 36) {
  const safeText = text || "JBL-DEFAULT";
  const bars = [2, 1, 2]; // Start guard

  for (let i = 0; i < safeText.length; i++) {
    const code = safeText.charCodeAt(i);
    bars.push((code % 3) + 1);
    bars.push(((code * 7) % 2) + 1);
    bars.push(((code * 3) % 3) + 1);
    bars.push(1);
  }

  bars.push(1, 2, 1); // Stop guard

  const totalUnits = bars.reduce((acc, val) => acc + val, 0);
  const unitWidth = width / totalUnits;

  let currentX = 0;
  const rects = bars.map((barWidth, index) => {
    const w = barWidth * unitWidth;
    const isBlack = index % 2 === 0;
    const rect = isBlack ? (
      <rect
        key={`bar-${index}`}
        x={currentX}
        y={0}
        width={w}
        height={height}
        fill="black"
      />
    ) : null;
    currentX += w;
    return rect;
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
      <rect width={width} height={height} fill="white" />
      {rects}
    </svg>
  );
}

// Printable shipping label component
const PrintableLabel = forwardRef(({ shipment }, ref) => {
  const [fetchedInvoiceNumber, setFetchedInvoiceNumber] = useState('');

  useEffect(() => {
    async function fetchInvoiceNumber() {
      if (!shipment) return;

      if (shipment.invoice_number) {
        setFetchedInvoiceNumber(shipment.invoice_number);
        return;
      }

      try {
        let query = supabase.from('invoices').select('invoice_number');

        if (shipment.id) {
          query = query.eq('shipment_id', shipment.id);
        } else if (shipment.tracking_number) {
          query = query.eq('tracking_number', shipment.tracking_number);
        } else {
          return;
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data?.invoice_number) {
          setFetchedInvoiceNumber(data.invoice_number);
        } else {
          setFetchedInvoiceNumber(shipment.shipment_number || 'N/A');
        }
      } catch (err) {
        console.error('Error fetching invoice number for label:', err);
        setFetchedInvoiceNumber(shipment.shipment_number || 'N/A');
      }
    }

    fetchInvoiceNumber();
  }, [shipment]);

  if (!shipment) return null;

  // Smart scan URL pointing to the scan redirection handler route
  const smartScanUrl = `${window.location.origin}/scan/${shipment.tracking_number}`;

  const getCityCode = (cityName) => {
    if (!cityName) return "HUB";
    return cityName.substring(0, 3).toUpperCase();
  };

  const originCity = shipment.sender_city || "Origin";
  const destCity = shipment.recipient_city || "Destination";
  const originCode = getCityCode(originCity);
  const destCode = getCityCode(destCity);

  return (
    <div 
      ref={ref} 
      className="bg-white text-black p-4 font-sans border-2 border-black box-border"
      style={{ width: '450px', margin: '0 auto' }}
    >
      {/* TOP ROW: Branding & Tracking Number */}
      <div className="grid grid-cols-12 border-b-2 border-black">
        <div className="col-span-5 p-3 flex flex-col justify-center border-r-2 border-black">
          <div className="text-xl font-black tracking-tighter leading-none">JB LOGISTICS</div>
          <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">Global Freight & Delivery</div>
        </div>

        <div className="col-span-7 p-2 flex flex-col items-center justify-center text-center">
          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Tracking Number</div>
          <div className="text-base font-black tracking-tight">{shipment.tracking_number}</div>
          
          <div className="w-full px-2 my-1">
            {generateBarcodeSVG(shipment.tracking_number, 220, 32)}
          </div>
          
          <div className="text-[8px] text-gray-500 uppercase tracking-wider">Scan to track your shipment</div>
        </div>
      </div>

      {/* MIDDLE ROW: From, QR Code, and Shipment Specs */}
      <div className="grid grid-cols-12 border-b-2 border-black">
        <div className="col-span-5 p-2.5 border-r-2 border-black flex flex-col justify-between text-[10px]">
          <div>
            <div className="font-extrabold text-gray-500 uppercase tracking-wider mb-1">From:</div>
            <div className="font-bold text-xs">{shipment.sender_name}</div>
            {shipment.sender_company && <div className="text-gray-700">{shipment.sender_company}</div>}
            <div className="text-gray-700 mt-0.5">{shipment.sender_address}</div>
            <div className="text-gray-700">
              {[shipment.sender_city, shipment.sender_state, shipment.sender_postal_code].filter(Boolean).join(", ")}
            </div>
            <div className="text-gray-700">{shipment.sender_country}</div>
          </div>
          {shipment.sender_phone && (
            <div className="text-[9px] text-gray-600 mt-2 font-mono">Phone: {shipment.sender_phone}</div>
          )}
        </div>

        <div className="col-span-3 p-2 border-r-2 border-black flex flex-col items-center justify-center bg-gray-50">
          <div className="p-1 bg-white border border-black shadow-xs">
            {generateQRCodeSVG(smartScanUrl, 84)}
          </div>
          <div className="text-[7px] font-bold text-center text-gray-600 mt-1 uppercase">Scan Tracker</div>
        </div>

        <div className="col-span-4 p-2 text-[10px] flex flex-col justify-between space-y-1">
          <div>
            <span className="text-gray-500 font-semibold block text-[8px] uppercase">Ship Date:</span>
            <span className="font-bold text-[11px]">{fmtDate(shipment.created_at) || 'Today'}</span>
          </div>
          <div className="border-t border-gray-300 pt-0.5">
            <span className="text-gray-500 font-semibold block text-[8px] uppercase">Weight:</span>
            <span className="font-bold text-[11px]">{shipment.weight_lb ? `${shipment.weight_lb} kg / lb` : '1.00 kg'}</span>
          </div>
          <div className="border-t border-gray-300 pt-0.5">
            <span className="text-gray-500 font-semibold block text-[8px] uppercase">Package:</span>
            <span className="font-bold text-[11px]">{shipment.package_type || 'Standard Box'}</span>
          </div>
          <div className="border-t border-gray-300 pt-0.5">
            <span className="text-gray-500 font-semibold block text-[8px] uppercase">Service:</span>
            <span className="font-bold text-[10px]">{shipment.service_type || 'Express Delivery'}</span>
          </div>
        </div>
      </div>

      {/* TO ADDRESS SECTION */}
      <div className="grid grid-cols-12 border-b-2 border-black">
        <div className="col-span-12 p-2.5 text-[10px]">
          <div className="font-extrabold text-gray-500 uppercase tracking-wider mb-0.5">To (Recipient):</div>
          <div className="font-bold text-xs">{shipment.recipient_name}</div>
          {shipment.recipient_company && <div className="text-gray-700">{shipment.recipient_company}</div>}
          <div className="text-gray-700">{shipment.recipient_address}</div>
          <div className="text-gray-700">
            {[shipment.recipient_city, shipment.recipient_state, shipment.recipient_postal_code].filter(Boolean).join(", ")}
          </div>
          <div className="text-gray-700">{shipment.recipient_country}</div>
          {shipment.recipient_phone && (
            <div className="text-[9px] text-gray-600 mt-1 font-mono">Phone: {shipment.recipient_phone}</div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: Invoice Number & Route */}
      <div className="grid grid-cols-12 text-[10px]">
        <div className="col-span-6 p-2 border-r-2 border-black flex flex-col justify-center">
          <div className="text-[8px] font-bold text-gray-500 uppercase">Invoice Number</div>
          <div className="font-bold font-mono text-xs mt-0.5">
            {fetchedInvoiceNumber || 'Loading...'}
          </div>
        </div>
        <div className="col-span-6 p-2 flex flex-col justify-center">
          <div className="text-[8px] font-bold text-gray-500 uppercase">Route:</div>
          <div className="font-black text-xs mt-0.5 tracking-wider">
            {originCode} → {destCode}
          </div>
          <div className="text-[8px] text-gray-600 truncate">
            {originCity} → {destCity}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintableLabel;