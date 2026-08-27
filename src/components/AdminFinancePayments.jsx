import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Printer, Loader2, X, CreditCard, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from "../lib/supabaseClient";
import EmptyState from "../components/logistics/EmptyState";
import { printNode } from "../label/print";

const PAYMENT_STATUS_STYLES = {
  completed: "bg-green-100 text-green-700",
  success: "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
  refunded: "bg-slate-200 text-slate-600"
};

// Cookie helper functions
const getCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return '';
};

const setCookie = (name, value, days = 7) => {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminFinancePayments() {
  const [payments, setPayments] = useState(null);
  const [invoices, setInvoices] = useState({});
  const [shipments, setShipments] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Persist search query and status filter using cookies
  const [searchQuery, setSearchQuery] = useState(() => getCookie('fin_payments_search') || '');
  const [statusFilter, setStatusFilter] = useState(() => getCookie('fin_payments_status') || 'ALL');

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Selection state for batch operations
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [isBulkStatusDropdownOpen, setIsBulkStatusDropdownOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Sync state changes to cookies
  useEffect(() => {
    setCookie('fin_payments_search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setCookie('fin_payments_status', statusFilter);
  }, [statusFilter]);

  const fetchPaymentsData = async () => {
    try {
      setFetchError(null);

      // Fetch all payments from Supabase
      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (payError) throw payError;
      const fetchedPayments = payData || [];
      setPayments(fetchedPayments);

      // Fetch related invoices if invoice_id exists
      const invoiceIds = [...new Set(fetchedPayments.map(p => p.invoice_id).filter(Boolean))];
      if (invoiceIds.length > 0) {
        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .select('*')
          .in('id', invoiceIds);

        if (invError) throw invError;
        const invMap = {};
        const shipIds = [];
        invData?.forEach(inv => {
          invMap[inv.id] = inv;
          if (inv.shipment_id) shipIds.push(inv.shipment_id);
        });
        setInvoices(invMap);

        // Fetch related shipments
        const uniqueShipIds = [...new Set([...fetchedPayments.map(p => p.shipment_id), ...shipIds].filter(Boolean))];
        if (uniqueShipIds.length > 0) {
          const { data: shipData, error: shipError } = await supabase
            .from('shipments')
            .select('*')
            .in('id', uniqueShipIds);

          if (!shipError && shipData) {
            const shipMap = {};
            shipData.forEach(s => {
              shipMap[s.id] = s;
            });
            setShipments(shipMap);
          }
        }
      } else {
        const shipIds = [...new Set(fetchedPayments.map(p => p.shipment_id).filter(Boolean))];
        if (shipIds.length > 0) {
          const { data: shipData, error: shipError } = await supabase
            .from('shipments')
            .select('*')
            .in('id', shipIds);

          if (!shipError && shipData) {
            const shipMap = {};
            shipData.forEach(s => {
              shipMap[s.id] = s;
            });
            setShipments(shipMap);
          }
        }
      }
    } catch (err) {
      console.error("Error loading payments:", err);
      setFetchError(err.message || "Failed to load payment transactions.");
      setPayments([]);
    }
  };

  useEffect(() => {
    fetchPaymentsData();

    // Real-time synchronization
    const paymentChannel = supabase
      .channel('public:admin-payments-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPaymentsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(paymentChannel);
    };
  }, []);

  if (payments === null) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  const filteredPayments = payments.filter((pay) => {
    const inv = pay.invoice_id ? invoices[pay.invoice_id] : null;
    const invNum = inv?.invoice_number || pay.invoice_number || "";
    const refNum = pay.transaction_reference || pay.reference_number || pay.id || "";
    const customerId = pay.customer_id || inv?.customer_id || "";
    const method = pay.payment_method || pay.gateway || "";

    const matchesSearch = 
      refNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(customerId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      method.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusKey = (pay.status || 'completed').toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || statusKey === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedPaymentIds.length === filteredPayments.length) {
      setSelectedPaymentIds([]);
    } else {
      setSelectedPaymentIds(filteredPayments.map(p => p.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedPaymentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedPaymentIds.length} selected payment records?`)) return;
    try {
      setIsProcessingBulk(true);
      const { error } = await supabase
        .from('payments')
        .delete()
        .in('id', selectedPaymentIds);

      if (error) throw error;

      setPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
      setSelectedPaymentIds([]);
      if (selectedPayment && selectedPaymentIds.includes(selectedPayment.id)) {
        setSelectedPayment(null);
      }
    } catch (err) {
      console.error("Error deleting selected payments:", err);
      alert("Failed to delete selected payments: " + err.message);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      setIsProcessingBulk(true);
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus.toLowerCase() })
        .in('id', selectedPaymentIds);

      if (error) throw error;

      setPayments(prev => prev.map(p => selectedPaymentIds.includes(p.id) ? { ...p, status: newStatus.toLowerCase() } : p));
      setSelectedPaymentIds([]);
      setIsBulkStatusDropdownOpen(false);
    } catch (err) {
      console.error("Error updating payment status:", err);
      alert("Failed to update status: " + err.message);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const printReceipt = (pay) => {
    const node = document.getElementById("pay-receipt-" + pay.id);
    if (node) printNode(node, "Payment Receipt " + (pay.transaction_reference || pay.id.slice(0, 8)));
  };

  return (
    <div className="space-y-6 font-sans w-full px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Payments & Transactions</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor incoming payments, transaction gateways, settlement statuses, and receipts in real time.
          </p>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Database Error</span>
            {fetchError}
          </div>
        </div>
      )}

      {/* Batch Action Banner */}
      {selectedPaymentIds.length > 0 && (
        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="bg-[#eab308] text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
              {selectedPaymentIds.length}
            </span>
            <span className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
              Payments Selected
            </span>
            <button 
              onClick={() => setSelectedPaymentIds([])}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline ml-2 cursor-pointer"
            >
              Clear Selection
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative">
              <button 
                onClick={() => setIsBulkStatusDropdownOpen(!isBulkStatusDropdownOpen)}
                disabled={isProcessingBulk}
                className="flex items-center justify-between gap-4 bg-white border border-gray-300 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 disabled:opacity-50 min-w-[160px]"
              >
                <span>UPDATE STATUS...</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {isBulkStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-30">
                  {['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusUpdate(status)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Mark as {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleBulkDelete}
              disabled={isProcessingBulk}
              className="flex items-center gap-2 bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] border border-[#fecdd3] font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isProcessingBulk ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>DELETE SELECTED</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col w-full">
        {/* Search and Filter Row */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by reference, invoice #, method, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 text-xs font-medium text-gray-900 rounded-xl focus:outline-none focus:border-gray-400 transition-colors shadow-sm"
            />
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="flex items-center justify-between gap-3 bg-white border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 min-w-[140px]"
            >
              <span>Status: {statusFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20">
                {['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer ${
                      statusFilter === status ? 'text-gray-900 font-bold bg-gray-50' : 'text-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={CreditCard} 
              title="No payment records found" 
              description="Transactions and gateway payments will appear here as customers settle invoices." 
            />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs font-medium">
            No payments match your current filter.
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={filteredPayments.length > 0 && selectedPaymentIds.length === filteredPayments.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Transaction Ref</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Invoice #</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Payment Method</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Amount Paid</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Timestamp</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                {filteredPayments.map((pay) => {
                  const statusKey = (pay.status || 'completed').toLowerCase();
                  const inv = pay.invoice_id ? invoices[pay.invoice_id] : null;
                  const invNum = inv?.invoice_number || pay.invoice_number || (pay.invoice_id ? `INV-${pay.invoice_id.slice(0, 8)}` : "—");
                  const refNum = pay.transaction_reference || pay.reference_number || `TXN-${pay.id.slice(0, 8)}`;
                  const payAmount = pay.amount || inv?.total || 0;
                  const method = pay.payment_method || pay.gateway || "Online";
                  const isChecked = selectedPaymentIds.includes(pay.id);

                  return (
                    <tr key={pay.id} className={`hover:bg-gray-50/65 transition-colors ${isChecked ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-4 px-3 text-center">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(pay.id)}
                          className="rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="py-4 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                        {refNum}
                      </td>
                      <td className="py-4 px-3 font-semibold text-gray-700 whitespace-nowrap">
                        {invNum}
                      </td>
                      <td className="py-4 px-3 capitalize text-gray-700 whitespace-nowrap">
                        {method.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-3 font-extrabold text-gray-900 whitespace-nowrap">
                        {fmtMoney(payAmount, pay.currency || inv?.currency)}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border border-black/5 ${PAYMENT_STATUS_STYLES[statusKey] || "bg-slate-100 text-slate-600"}`}>
                          {statusKey}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmtDate(pay.created_at || pay.paid_at)}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button 
                            onClick={() => printReceipt(pay)} 
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Print Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedPayment(pay)} 
                            className="text-yellow-700 hover:text-yellow-800 text-xs font-bold px-2.5 py-1 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer"
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
        )}

        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50 text-xs text-gray-500 font-medium w-full">
          <span>Showing {filteredPayments.length} of {payments.length} total payment transactions</span>
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden relative my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Transaction Details
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printReceipt(selectedPayment)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 font-bold block mb-1">Transaction Ref</span>
                  <span className="font-mono font-bold text-gray-900">{selectedPayment.transaction_reference || selectedPayment.reference_number || selectedPayment.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block mb-1">Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${PAYMENT_STATUS_STYLES[(selectedPayment.status || 'completed').toLowerCase()]}`}>
                    {selectedPayment.status || 'completed'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block mb-1">Amount Paid</span>
                  <span className="font-extrabold text-gray-900 text-sm">{fmtMoney(selectedPayment.amount || invoices[selectedPayment.invoice_id]?.total || 0, selectedPayment.currency)}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block mb-1">Payment Method</span>
                  <span className="font-bold capitalize text-gray-900">{(selectedPayment.payment_method || selectedPayment.gateway || "Online").replace('_', ' ')}</span>
                </div>
              </div>

              {selectedPayment.invoice_id && invoices[selectedPayment.invoice_id] && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                  <span className="font-bold text-gray-900 block text-xs tracking-wider uppercase">Linked Invoice</span>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Number:</span>
                    <span className="font-bold text-gray-800">{invoices[selectedPayment.invoice_id].invoice_number || `INV-${selectedPayment.invoice_id.slice(0, 8)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Total:</span>
                    <span className="font-bold text-gray-800">{fmtMoney(invoices[selectedPayment.invoice_id].total, invoices[selectedPayment.invoice_id].currency)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-gray-400 pt-2 border-t border-gray-100 text-[11px]">
                <span>Recorded at: {fmtDate(selectedPayment.created_at || selectedPayment.paid_at)}</span>
                <span>ID: {selectedPayment.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable receipt wrappers */}
      <div className="hidden">
        {payments.map((pay) => {
          const inv = pay.invoice_id ? invoices[pay.invoice_id] : null;
          const invNum = inv?.invoice_number || pay.invoice_number || (pay.invoice_id ? `INV-${pay.invoice_id.slice(0, 8)}` : "—");
          const refNum = pay.transaction_reference || pay.reference_number || `TXN-${pay.id.slice(0, 8)}`;
          const payAmount = pay.amount || inv?.total || 0;
          const method = pay.payment_method || pay.gateway || "Online";

          return (
            <div key={pay.id} id={"pay-receipt-" + pay.id} className="p-10 bg-white font-sans max-w-[650px] mx-auto text-gray-900">
              <div className="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                  <h1 className="text-2xl font-black text-gray-900">PAYMENT RECEIPT</h1>
                  <p className="text-xs text-gray-500 mt-1">Official Transaction Acknowledgement</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm bg-gray-100 px-3 py-1 rounded-lg">{refNum}</span>
                  <p className="text-xs text-gray-500 mt-1">{fmtDate(pay.created_at || pay.paid_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
                <div>
                  <span className="text-gray-400 font-bold block uppercase mb-1">Payment Method</span>
                  <span className="font-bold text-gray-800 capitalize">{method.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase mb-1">Status</span>
                  <span className="font-bold text-green-700 uppercase">{pay.status || 'Completed'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase mb-1">Linked Invoice</span>
                  <span className="font-bold text-gray-800">{invNum}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase mb-1">Customer ID</span>
                  <span className="font-bold text-gray-800">{pay.customer_id || inv?.customer_id || "—"}</span>
                </div>
              </div>

              <div className="border-t border-b py-4 my-6 flex justify-between items-center bg-gray-50 px-4 rounded-xl">
                <span className="font-bold text-sm text-gray-700">Total Amount Settled:</span>
                <span className="font-extrabold text-xl text-gray-900">{fmtMoney(payAmount, pay.currency || inv?.currency)}</span>
              </div>

              <div className="text-center text-gray-400 text-[11px] pt-8">
                Thank you for your business. For support, contact logistics administration.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}