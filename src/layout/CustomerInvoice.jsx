import React, { useState, useEffect } from "react";
import { FileText, Printer, Loader2, X, CreditCard } from "lucide-react";
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

            {/* Modal Body */}
            <div className="p-4 sm:p-8 overflow-y-auto max-h-[80vh] flex flex-col items-center bg-slate-100">
              <div className="w-full max-w-[800px] h-[520px] sm:h-[600px] overflow-x-auto overflow-y-hidden flex justify-center">
                <div className="transform scale-[0.55] sm:scale-[0.65] origin-top">
                  <PrintableInvoice
                    id={"modal-inv-" + selectedInvoice.id}
                    shipment={shipments[selectedInvoice.shipment_id]}
                    invoice={selectedInvoice}
                    customer={customer}
                  />
                </div>
              </div>

              {/* Real Stripe Pay Now Button */}
              {selectedInvoice.status?.toLowerCase() !== 'paid' && (
                <div className="w-full flex justify-center mt-4">
                  <button
                    onClick={() => handleStripePayment(selectedInvoice)}
                    disabled={loadingPaymentId === selectedInvoice.id}
                    className="inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-10 py-3.5 rounded-xl text-sm transition-colors shadow-md cursor-pointer disabled:opacity-50"
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
        </div>
      )}

      {/* Hidden printable invoices */}
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
      </div>
    </div>
  );
}