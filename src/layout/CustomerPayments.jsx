import React, { useState, useEffect } from "react";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import EmptyState from "../components/logistics/EmptyState";

const PAYMENT_STYLES = {
  paid: "bg-green-100 text-green-700 border-green-200",
  unpaid: "bg-amber-100 text-amber-700 border-amber-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-rose-100 text-rose-700 border-rose-200"
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

export default function CustomerPayments() {
  const [invoices, setInvoices] = useState(null);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchUserDataAndInvoices = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setInvoices([]);
          return;
        }

        let resolvedCustomer = { email: user.email };
        const { data: custData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (custData) {
          resolvedCustomer = { ...resolvedCustomer, ...custData };
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

        let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
        if (safeCode) {
          query = query.or(`customer_id.eq.${safeCode},customer_user_id.eq.${user.id}`);
        } else {
          query = query.eq('customer_user_id', user.id);
        }

        const { data: invData, error: invError } = await query;
        if (invError) throw invError;

        setInvoices(invData || []);
      } catch (err) {
        console.error("Error fetching customer payments:", err);
        setInvoices([]);
      }
    };

    fetchUserDataAndInvoices();
  }, []);

  const handleStripePayment = async (inv) => {
    try {
      setLoadingPaymentId(inv.id);

      // Call your Supabase Edge Function to create the Checkout Session
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
        // Redirect directly to Stripe Checkout
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

  if (invoices === null) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-950">Payments & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">Review your shipment invoice history and make secure payments via Stripe.</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <EmptyState 
            icon={CreditCard} 
            title="No payment history available" 
            description="When invoices are generated for your shipments, they will appear here ready for payment." 
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Invoices & Transactions</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const status = (inv.status || 'unpaid').toLowerCase();
              const isPaid = status === 'paid';
              const totalAmount = inv.total || inv.amount || 0;

              return (
                <div key={inv.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-950 text-base">
                        {inv.invoice_number || `INV-${inv.id.slice(0, 8)}`}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${PAYMENT_STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Issued on {fmtDate(inv.issued_at || inv.created_at)} {inv.tracking_number ? `• Tracking: ${inv.tracking_number}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block uppercase font-semibold">Total Amount</span>
                      <span className="text-lg font-extrabold text-slate-900">{fmtMoney(totalAmount, inv.currency)}</span>
                    </div>

                    {!isPaid ? (
                      <button
                        onClick={() => handleStripePayment(inv)}
                        disabled={loadingPaymentId === inv.id}
                        className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {loadingPaymentId === inv.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            Pay Now
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-green-600 font-bold text-sm px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                        <CheckCircle2 className="w-4 h-4" />
                        Paid
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}