import React, { useState, useEffect } from "react";
import { FileText, Printer, Loader2, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import EmptyState from "../components/logistics/EmptyState";
import PrintableInvoice from "../label/PrintableInvoice";
import { printNode } from "../label/print";

const PAYMENT_STYLES = {
  unpaid: "bg-amber-100 text-amber-700", 
  paid: "bg-green-100 text-green-700", 
  overdue: "bg-rose-100 text-rose-700", 
  refunded: "bg-slate-200 text-slate-600",
  pending: "bg-amber-100 text-amber-700"
};

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

export default function CustomerInvoice() {
  const [invoices, setInvoices] = useState(null);
  const [shipments, setShipments] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoicesAndShipments = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setInvoices([]);
          return;
        }

        let assignedCode = user.user_metadata?.customer_id;
        if (!assignedCode) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('customer_id')
            .eq('user_id', user.id)
            .single();
          if (profileData) assignedCode = profileData.customer_id;
        }

        const safeCode = assignedCode ? String(assignedCode).trim() : null;

        // Fetch invoices from Supabase ordered by creation date
        let query = supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(100);
        
        if (safeCode) {
          query = query.or(`customer_id.eq.${safeCode},customer_user_id.eq.${user.id}`);
        } else {
          query = query.eq('customer_user_id', user.id);
        }

        const { data: invData, error: invError } = await query;
        if (invError) throw invError;

        const fetchedInvoices = invData || [];
        setInvoices(fetchedInvoices);

        // Fetch related shipments
        const shipmentIds = [...new Set(fetchedInvoices.map((i) => i.shipment_id).filter(Boolean))];
        if (shipmentIds.length > 0) {
          const { data: shipData } = await supabase
            .from('shipments')
            .select('*')
            .in('id', shipmentIds);

          const map = {};
          shipData?.forEach((s) => {
            map[s.id] = s;
          });
          setShipments(map);
        }
      } catch (err) {
        console.error("Error loading customer invoices:", err);
        setInvoices([]);
      }
    };

    fetchInvoicesAndShipments();

    // Real-time subscription to instantly show auto-generated trigger invoices
    const invoiceChannel = supabase
      .channel('public:customer-invoices-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchInvoicesAndShipments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(invoiceChannel);
    };
  }, []);

  if (invoices === null) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  const printInv = (inv) => {
    // Always targets the hidden original-size element for crisp printing/saving
    const node = document.getElementById("inv-" + inv.id) || document.getElementById("modal-inv-" + inv.id);
    if (node) printNode(node, "Invoice " + (inv.invoice_number || inv.id));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-sans">
      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState 
            icon={FileText} 
            title="No invoices available" 
            description="Invoices are generated automatically when you create a shipment." 
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Invoice #</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Tracking</th>
                <th className="text-left px-4 py-3 font-semibold">Total</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Issued</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const statusKey = (inv.status || 'unpaid').toLowerCase();
                const trackingNum = inv.tracking_number || shipments[inv.shipment_id]?.tracking_number || "—";
                const invTotal = inv.total || inv.amount || 0;
                const issuedDate = inv.issued_at || inv.created_at;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {inv.invoice_number || `INV-${inv.id.slice(0, 8)}`}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 hidden sm:table-cell">
                      {trackingNum}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-slate-800">
                      {fmtMoney(invTotal, inv.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border border-black/5 ${PAYMENT_STYLES[statusKey] || "bg-slate-100 text-slate-600"}`}>
                        {statusKey}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                      {fmtDate(issuedDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button 
                          onClick={() => printInv(inv)} 
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Save / Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {inv.shipment_id && (
                          <button 
                            onClick={() => setSelectedInvoice(inv)} 
                            className="text-yellow-600 hover:text-yellow-700 text-xs font-bold px-2.5 py-1 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Details Modal Popup */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">
                Invoice Preview — {selectedInvoice.invoice_number || `INV-${selectedInvoice.id.slice(0, 8)}`}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printInv(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Preview & Total Amount Below */}
            <div className="p-4 sm:p-8 overflow-x-auto overflow-y-auto max-h-[80vh] flex flex-col items-center bg-slate-100">
              <div className="shadow-lg bg-white rounded-xl overflow-hidden transform scale-[0.84] sm:scale-[0.88] origin-top">
                <PrintableInvoice
                  id={"modal-inv-" + selectedInvoice.id}
                  shipment={shipments[selectedInvoice.shipment_id]}
                  invoice={selectedInvoice}
                />
              </div>

              {/* Total Amount Summary Below */}
              <div className="w-full max-w-[680px] bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4 mt-4 flex items-center justify-between">
                <span className="font-bold text-slate-700 text-sm">Total Amount Due:</span>
                <span className="font-extrabold text-slate-900 text-lg">
                  {fmtMoney(selectedInvoice.total || selectedInvoice.amount || 0, selectedInvoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden original-size printable invoices used for high-res PDF generation / printing */}
      <div className="hidden">
        {invoices.filter((i) => shipments[i.shipment_id]).map((inv) => (
          <PrintableInvoice 
            key={inv.id} 
            id={"inv-" + inv.id} 
            shipment={shipments[inv.shipment_id]} 
            invoice={inv} 
          />
        ))}
      </div>
    </div>
  );
}