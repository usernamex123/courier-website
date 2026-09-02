import React, { useState, useEffect } from "react";
import { FileText, Printer, Loader2, X, CreditCard, Package, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
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
  const [customer, setCustomer] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);

  useEffect(() => {
    const fetchInvoicesAndShipments = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setInvoices([]);
          return;
        }

        let resolvedCustomer = {
          email: user.email,
          billing_email: user.email
        };

        try {
          const { data: custData } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (custData) {
            resolvedCustomer = { ...resolvedCustomer, ...custData };
          }
        } catch (e) {
          console.warn("Could not fetch extra customer details, using auth fallback");
        }

        setCustomer(resolvedCustomer);

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
    const node = document.getElementById("inv-" + inv.id) || document.getElementById("modal-inv-" + inv.id);
    if (node) printNode(node, "Invoice " + (inv.invoice_number || inv.id));
  };

  const handleStripePayment = async (inv) => {
    try {
      setLoadingPaymentId(inv.id);

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          invoice_id: inv.id,
          amount: inv.total || inv.amount || 0,
          currency: inv.currency || 'USD',
          invoice_number: inv.invoice_number || `INV-${inv.id.slice(0, 8)}`,
          customer_email: customer?.email || customer?.billing_email
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from server.");
      }
    } catch (err) {
      console.error("Stripe payment error:", err);
      alert("Failed to initialize Stripe payment. Please check console logs.");
      setLoadingPaymentId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-sans px-3 sm:px-0">
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <EmptyState 
            icon={FileText} 
            title="No invoices available" 
            description="" 
          />
        </div>
      ) : (
        <>
          {/* Mobile Card List View */}
          <div className="space-y-3 sm:hidden">
            {invoices.map((inv) => {
              const statusKey = (inv.status || 'unpaid').toLowerCase();
              const trackingNum = inv.tracking_number || shipments[inv.shipment_id]?.tracking_number || "—";
              const invTotal = inv.total || inv.amount || 0;
              const issuedDate = inv.issued_at || inv.created_at;

              return (
                <div key={inv.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">
                      {inv.invoice_number || `INV-${inv.id.slice(0, 8)}`}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-black/5 ${PAYMENT_STYLES[statusKey] || "bg-slate-100 text-slate-600"}`}>
                      {statusKey}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tracking</span>
                      <span className="font-mono text-slate-700 font-semibold">{trackingNum}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Issued Date</span>
                      <span className="text-slate-700 font-medium">{fmtDate(issuedDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Amount</span>
                      <span className="text-base font-black text-slate-900">{fmtMoney(invTotal, inv.currency)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => printInv(inv)} 
                        className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        title="Print / Save"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedInvoice(inv)} 
                        className="text-yellow-700 bg-yellow-50 hover:bg-yellow-100 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-100 font-bold tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3.5">Invoice #</th>
                  <th className="text-left px-4 py-3.5">Tracking</th>
                  <th className="text-left px-4 py-3.5">Total</th>
                  <th className="text-left px-4 py-3.5">Status</th>
                  <th className="text-left px-4 py-3.5">Issued</th>
                  <th className="text-right px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {invoices.map((inv) => {
                  const statusKey = (inv.status || 'unpaid').toLowerCase();
                  const trackingNum = inv.tracking_number || shipments[inv.shipment_id]?.tracking_number || "—";
                  const invTotal = inv.total || inv.amount || 0;
                  const issuedDate = inv.issued_at || inv.created_at;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {inv.invoice_number || `INV-${inv.id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-4 font-mono text-slate-600">
                        {trackingNum}
                      </td>
                      <td className="px-4 py-4 font-extrabold text-slate-900 text-sm">
                        {fmtMoney(invTotal, inv.currency)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border border-black/5 ${PAYMENT_STYLES[statusKey] || "bg-slate-100 text-slate-600"}`}>
                          {statusKey}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {fmtDate(issuedDate)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button 
                            onClick={() => printInv(inv)} 
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Save / Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedInvoice(inv)} 
                            className="text-yellow-700 hover:text-yellow-800 text-xs font-bold px-3 py-1.5 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modern Responsive Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden relative my-6 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {selectedInvoice.invoice_number || `INV-${selectedInvoice.id.slice(0, 8)}`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printInv(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Clean Mobile-First Content) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              
              {/* Status & Amount Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Payment Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${PAYMENT_STYLES[(selectedInvoice.status || 'unpaid').toLowerCase()]}`}>
                    {selectedInvoice.status || 'unpaid'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Total Due</span>
                  <span className="text-lg font-black text-slate-900">
                    {fmtMoney(selectedInvoice.total || selectedInvoice.amount || 0, selectedInvoice.currency)}
                  </span>
                </div>
              </div>

              {/* Shipment Details Grid */}
              {shipments[selectedInvoice.shipment_id] && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Shipment Reference</h4>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Tracking Number</span>
                      <span className="font-mono font-bold text-slate-800">{shipments[selectedInvoice.shipment_id].tracking_number || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Service Type</span>
                      <span className="font-bold text-slate-800 capitalize">{shipments[selectedInvoice.shipment_id].service || "Standard"}</span>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Route</span>
                      <span className="font-semibold text-slate-800">
                        {shipments[selectedInvoice.shipment_id].origin || "Origin"} → {shipments[selectedInvoice.shipment_id].destination || "Destination"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Meta info */}
              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 px-1">
                <span>Issued: {fmtDate(selectedInvoice.issued_at || selectedInvoice.created_at)}</span>
                <span className="font-mono">ID: {selectedInvoice.id.slice(0, 12)}...</span>
              </div>
            </div>

            {/* Modal Footer / Pay Button */}
            {selectedInvoice.status?.toLowerCase() !== 'paid' && (
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => handleStripePayment(selectedInvoice)}
                  disabled={loadingPaymentId === selectedInvoice.id}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-extrabold px-6 py-3.5 rounded-2xl text-sm transition-colors shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {loadingPaymentId === selectedInvoice.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting to Stripe...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay Now — {fmtMoney(selectedInvoice.total || selectedInvoice.amount || 0, selectedInvoice.currency)}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden printable invoices for background PDF saving/printing */}
      <div className="hidden">
        {invoices.filter((i) => shipments[i.shipment_id]).map((inv) => (
          <PrintableInvoice 
            key={inv.id} 
            id={"inv-" + inv.id} 
            shipment={shipments[inv.shipment_id]} 
            invoice={inv} 
            customer={customer}
          />
        ))}
        {/* Hidden printable version specifically for the modal view trigger */}
        {selectedInvoice && shipments[selectedInvoice.shipment_id] && (
          <PrintableInvoice 
            key={"modal-print-" + selectedInvoice.id} 
            id={"modal-inv-" + selectedInvoice.id} 
            shipment={shipments[selectedInvoice.shipment_id]} 
            invoice={selectedInvoice} 
            customer={customer}
          />
        )}
      </div>
    </div>
  );
}