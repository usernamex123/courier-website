import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

export const STATUSES = ["pending", "picked_up", "at_origin_facility", "in_transit", "at_destination_facility", "out_for_delivery", "delivered", "failed", "returned"];
export const SERVICES = ["Standard", "Express", "Priority", "Air Freight", "Sea Freight", "Road Freight"];
export const PAYMENTS = ["paid", "unpaid", "pending", "failed"];
export const PACKAGE_TYPES = ["Box", "Envelope", "Pallet", "Crate", "Tube"];

export default function AdminShipments1({ title = "Shipment", initial, onClose, onSaved }) {
  const [formData, setFormData] = useState(initial || {
    service_type: "Standard",
    package_type: "Box",
    sender_country: "United States",
    recipient_country: "United States",
    current_status: "pending",
    payment_status: "unpaid"
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEstimatePrice = () => {
    const weight = Number(formData.weight_lb) || 1;
    const baseRate = formData.service_type === "Express" || formData.service_type === "Priority" ? 45 : 20;
    const calculated = baseRate + weight * 7;
    setFormData(prev => ({ ...prev, price: calculated }));
    toast.success(`Estimated price calculated: $${calculated.toFixed(2)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const inputId = formData.user_id?.trim();
      if (!inputId) {
        toast.error("Please enter a valid User ID");
        setSaving(false);
        return;
      }

      const calculatedPrice = Number(formData.price) || (Number(formData.weight_lb || 1) * 7 + 20);
      const originStr = [formData.sender_city, formData.sender_country].filter(Boolean).join(", ") || "United States";
      const destStr = [formData.recipient_city, formData.recipient_country].filter(Boolean).join(", ") || "United States";
      const clientNameVal = formData.recipient_name || formData.sender_name || "Customer";

      if (initial) {
        const id = initial.id;
        const updateData = {
          ...formData,
          user_id: inputId,
          customer_id: inputId,
          profile_id: inputId,
          origin: originStr,
          destination: destStr,
          price: calculatedPrice,
          client_name: clientNameVal,
        };
        delete updateData.sender_company;
        
        const { error } = await supabase
          .from('shipments')
          .update(updateData)
          .eq('id', id);
        if (error) throw error;

        // Log tracking event if status was explicitly altered during edit
        if (formData.current_status && formData.current_status !== initial.current_status) {
          await supabase.from('tracking_events').insert([{
            shipment_id: id,
            status: formData.current_status.toLowerCase(),
            description: `Shipment status updated to ${formData.current_status.replace('_', ' ')}.`,
            location: originStr,
            event_time: new Date().toISOString()
          }]);
        }

        toast.success(`Shipment updated successfully`);
      } else {
        const trackingNumber = formData.tracking_number || "JB" + Math.floor(100000000 + Math.random() * 900000000);
        const shipmentNumber = "SH" + Math.floor(100000 + Math.random() * 900000);
        const newRecord = {
          ...formData,
          user_id: inputId,
          customer_id: inputId,
          profile_id: inputId,
          tracking_number: trackingNumber,
          shipment_number: shipmentNumber,
          origin: originStr,
          destination: destStr,
          current_status: formData.current_status || "pending",
          payment_status: formData.payment_status || "unpaid",
          price: calculatedPrice,
          weight_lb: Number(formData.weight_lb) || 1,
          sender_name: formData.sender_name || "Admin",
          recipient_name: formData.recipient_name || "Customer",
          client_name: clientNameVal,
        };
        delete newRecord.sender_company;

        const { data: insertedShipment, error } = await supabase
          .from('shipments')
          .insert([newRecord])
          .select()
          .single();

        if (error) throw error;

        // Seed initial tracking event log for historical timeline tracking
        if (insertedShipment) {
          await supabase.from('tracking_events').insert([
            {
              shipment_id: insertedShipment.id,
              status: insertedShipment.current_status || 'pending',
              description: 'Shipment record created in system.',
              location: originStr,
              event_time: new Date().toISOString()
            }
          ]);
        }

        toast.success(`Shipment created successfully`);
      }
      onSaved?.();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Failed to save shipment: ${err.message || ''}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
            {initial ? 'Edit Shipment' : 'Create New Shipment'}
          </h3>
          <button 
            type="button"
            onClick={() => onClose?.()} 
            className="text-gray-400 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SENDER INFORMATION */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-4">Sender Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.sender_name || ''} 
                  onChange={e => handleChange('sender_name', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Sender full name"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">User ID <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.user_id || ''} 
                  onChange={e => handleChange('user_id', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Enter User ID (e.g. 508638)"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Phone</label>
                <input 
                  type="text" 
                  value={formData.sender_phone || ''} 
                  onChange={e => handleChange('sender_phone', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.sender_email || ''} 
                  onChange={e => handleChange('sender_email', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Email address"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.sender_address || ''} 
                  onChange={e => handleChange('sender_address', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">City <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.sender_city || ''} 
                  onChange={e => handleChange('sender_city', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">State</label>
                <input 
                  type="text" 
                  value={formData.sender_state || ''} 
                  onChange={e => handleChange('sender_state', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="State / Province"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Postal Code</label>
                <input 
                  type="text" 
                  value={formData.sender_postal_code || ''} 
                  onChange={e => handleChange('sender_postal_code', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Postal Code"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Country</label>
                <input 
                  type="text" 
                  value={formData.sender_country || 'United States'} 
                  onChange={e => handleChange('sender_country', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* RECIPIENT INFORMATION */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-4">Recipient Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.recipient_name || ''} 
                  onChange={e => handleChange('recipient_name', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Recipient full name"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Company</label>
                <input 
                  type="text" 
                  value={formData.recipient_company || ''} 
                  onChange={e => handleChange('recipient_company', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Phone</label>
                <input 
                  type="text" 
                  value={formData.recipient_phone || ''} 
                  onChange={e => handleChange('recipient_phone', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.recipient_email || ''} 
                  onChange={e => handleChange('recipient_email', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Email address"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.recipient_address || ''} 
                  onChange={e => handleChange('recipient_address', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">City <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.recipient_city || ''} 
                  onChange={e => handleChange('recipient_city', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">State</label>
                <input 
                  type="text" 
                  value={formData.recipient_state || ''} 
                  onChange={e => handleChange('recipient_state', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="State / Province"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Postal Code</label>
                <input 
                  type="text" 
                  value={formData.recipient_postal_code || ''} 
                  onChange={e => handleChange('recipient_postal_code', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  placeholder="Postal Code"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Country</label>
                <input 
                  type="text" 
                  value={formData.recipient_country || 'United States'} 
                  onChange={e => handleChange('recipient_country', e.target.value)} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* PACKAGE DETAILS & SERVICE & PRICING GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PACKAGE DETAILS */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Package Details</h4>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Package Type</label>
                <select 
                  value={formData.package_type || 'Box'}
                  onChange={e => handleChange('package_type', e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm cursor-pointer"
                >
                  {PACKAGE_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Weight (lb) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={formData.weight_lb || ''} 
                    onChange={e => handleChange('weight_lb', e.target.value)} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Declared Value ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.declared_value || ''} 
                    onChange={e => handleChange('declared_value', e.target.value)} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Length (in)</label>
                  <input 
                    type="number" 
                    value={formData.length_in || ''} 
                    onChange={e => handleChange('length_in', e.target.value)} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Width (in)</label>
                  <input 
                    type="number" 
                    value={formData.width_in || ''} 
                    onChange={e => handleChange('width_in', e.target.value)} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Height (in)</label>
                  <input 
                    type="number" 
                    value={formData.height_in || ''} 
                    onChange={e => handleChange('height_in', e.target.value)} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* SERVICE & PRICING */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Service & Pricing</h4>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Service Type</label>
                  <select 
                    value={formData.service_type || 'Standard'}
                    onChange={e => handleChange('service_type', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm cursor-pointer"
                  >
                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Price Text Box with Attached $ Symbol */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Price</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-500 font-semibold text-sm">$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.price ?? ''} 
                      onChange={e => handleChange('price', e.target.value)} 
                      className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none shadow-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <button 
                    type="button"
                    onClick={handleEstimatePrice}
                    className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Get Price Estimate {formData.price ? `($${Number(formData.price).toFixed(2)})` : ''}
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Notes (optional)</label>
                  <textarea 
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                    placeholder="Special handling instructions..."
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:border-yellow-500 outline-none h-24 resize-none shadow-sm"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button 
              type="button" 
              onClick={() => onClose?.()} 
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-yellow-400 hover:bg-yellow-500 text-black disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {initial ? 'Update Shipment' : 'Create Shipment'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}