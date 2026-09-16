import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Check, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ChevronDown, 
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const fmtMoney = (amount, currency = "USD") => {
  const num = Number(amount);
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(num);
};

export default function AdminFinanceOverview() {
  const [dateRange, setDateRange] = useState('This Month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState([]);

  const [metrics, setMetrics] = useState({
    totalRevenue: '$0.00',
    collected: '$0.00',
    outstanding: '$0.00',
    overdue: '$0.00',
    pendingCount: 0,
    overdueCount: 0,
    collectionRate: '0%',
    rawCollected: 0,
    rawOutstanding: 0,
    rawOverdue: 0
  });

  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    const fetchFinancialData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const invoices = data || [];
        setAllInvoices(invoices);
        processMetricsAndActivity(invoices, dateRange);
      } catch (err) {
        console.error("Error fetching admin financial data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();

    const channel = supabase
      .channel('admin-finance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchFinancialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const processMetricsAndActivity = (invoices, range) => {
    const now = new Date();
    
    const filteredInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.issued_at || inv.created_at);
      if (isNaN(invDate.getTime())) return false;

      if (range === 'Today') {
        return invDate.toDateString() === now.toDateString();
      } else if (range === 'This Week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return invDate >= weekAgo;
      } else if (range === 'This Month') {
        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      } else if (range === 'This Year') {
        return invDate.getFullYear() === now.getFullYear();
      }
      return true; 
    });

    let totalGross = 0;
    let paidTotal = 0;
    let outstandingTotal = 0;
    let overdueTotal = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let paidCount = 0;

    filteredInvoices.forEach(inv => {
      const amount = Number(inv.total || inv.amount || 0);
      const status = (inv.status || 'unpaid').toLowerCase();

      totalGross += amount;

      if (status === 'paid') {
        paidTotal += amount;
        paidCount++;
      } else if (status === 'overdue') {
        overdueTotal += amount;
        overdueCount++;
      } else {
        outstandingTotal += amount;
        pendingCount++;
      }
    });

    const totalInvoicesCount = filteredInvoices.length;
    const paidPct = totalInvoicesCount > 0 ? Math.round((paidCount / totalInvoicesCount) * 100) : 0;

    setMetrics({
      totalRevenue: fmtMoney(totalGross),
      collected: fmtMoney(paidTotal),
      outstanding: fmtMoney(outstandingTotal),
      overdue: fmtMoney(overdueTotal),
      pendingCount: pendingCount,
      overdueCount: overdueCount,
      collectionRate: `${paidPct}%`,
      rawCollected: paidTotal,
      rawOutstanding: outstandingTotal,
      rawOverdue: overdueTotal
    });

    const formattedInvoices = filteredInvoices.slice(0, 6).map((inv) => {
      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number || `INV-2026-${inv.id.slice(0, 5).toUpperCase()}`,
        status: inv.status || 'Unpaid',
        amount: fmtMoney(inv.total || inv.amount || 0, inv.currency)
      };
    });

    setRecentInvoices(formattedInvoices);
  };

  const handleRangeChange = (range) => {
    setDateRange(range);
    setIsDropdownOpen(false);
    setIsLoading(true);

    setTimeout(() => {
      processMetricsAndActivity(allInvoices, range);
      setIsLoading(false);
    }, 200);
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
          Paid
        </span>
      );
    }
    if (s === 'overdue') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
        {status || 'Unpaid'}
      </span>
    );
  };

  // Donut chart calculations based on amount distribution
  const totalAmount = metrics.rawCollected + metrics.rawOutstanding + metrics.rawOverdue;
  const safeTotal = totalAmount > 0 ? totalAmount : 1;
  const paidShare = metrics.rawCollected / safeTotal;
  const pendingShare = metrics.rawOutstanding / safeTotal;
  const overdueShare = metrics.rawOverdue / safeTotal;

  const circumference = 238.76; // 2 * pi * r (r = 38)
  const paidLen = paidShare * circumference;
  const pendingLen = pendingShare * circumference;
  const overdueLen = overdueShare * circumference;

  const paidOffset = 0;
  const pendingOffset = -paidLen;
  const overdueOffset = -(paidLen + pendingLen);

  return (
    <div className="space-y-5 font-sans px-3 sm:px-0">
      {/* Header & Date Range Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Financial Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time ledger, invoice collection, and performance analytics.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{dateRange}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-20">
                {['Today', 'This Week', 'This Month', 'This Year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => handleRangeChange(range)}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer ${
                      dateRange === range ? 'text-slate-900 bg-slate-50 font-semibold' : 'text-slate-600'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-xl flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
          </div>
        )}

        {/* 1. Total Revenue Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <DollarSign className="w-5.5 h-5.5" />
            </div>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 leading-tight tabular-nums">{metrics.totalRevenue}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Total Revenue</div>
          <div className="text-[11px] text-slate-400 mt-1">+12.5%</div>
        </div>

        {/* 2. Collected Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-sm">
              <Check className="w-5.5 h-5.5" />
            </div>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 leading-tight tabular-nums">{metrics.collected}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Collected</div>
          <div className="text-[11px] text-slate-400 mt-1">{metrics.collectionRate} rate</div>
        </div>

        {/* 3. Outstanding Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Clock className="w-5.5 h-5.5" />
            </div>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 leading-tight tabular-nums">{metrics.outstanding}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Outstanding</div>
          <div className="text-[11px] text-slate-400 mt-1">{metrics.pendingCount} invoices</div>
        </div>

        {/* 4. Overdue Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <AlertCircle className="w-5.5 h-5.5" />
            </div>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-rose-600">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 leading-tight tabular-nums">{metrics.overdue}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Overdue</div>
          <div className="text-[11px] text-slate-400 mt-1">{metrics.overdueCount} invoices</div>
        </div>
      </div>

      {/* Secondary Layout: Recent Invoices & Payment Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Invoices Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <h3 className="font-bold text-slate-900 text-sm">Recent Invoices</h3>
            <span className="text-xs text-slate-400">{allInvoices.length} total</span>
          </div>

          <div className="p-4 sm:p-0">
            {recentInvoices.length === 0 ? (
              <div className="p-12 text-center text-xs font-medium text-slate-400">
                No invoices found for this time period.
              </div>
            ) : (
              <>
                {/* Mobile Card List View */}
                <div className="space-y-3 sm:hidden">
                  {recentInvoices.map((item, index) => (
                    <div key={index} className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 text-sm">{item.invoiceNumber}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">Amount</span>
                        <span className="text-slate-900 font-semibold text-sm tabular-nums">{item.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 text-xs border-b border-slate-100 bg-slate-50/50 font-medium">
                        <th className="px-5 py-3">Invoice #</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-800">
                      {recentInvoices.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {item.invoiceNumber}
                          </td>
                          <td className="px-5 py-3">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                            {item.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Status Donut Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Payment Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution by amount</p>

            {/* Donut Chart */}
            <div className="flex justify-center my-6 relative">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="16"
                />
                {/* Collected (Green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#22c55e"
                  strokeWidth="16"
                  strokeDasharray={`${paidLen} ${circumference}`}
                  strokeDashoffset={paidOffset}
                />
                {/* Pending (Orange) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="16"
                  strokeDasharray={`${pendingLen} ${circumference}`}
                  strokeDashoffset={pendingOffset}
                />
                {/* Overdue (Red) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="16"
                  strokeDasharray={`${overdueLen} ${circumference}`}
                  strokeDashoffset={overdueOffset}
                />
              </svg>
            </div>

            {/* Legend & Amounts */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  Collected
                </span>
                <span className="font-bold text-slate-900 tabular-nums">{metrics.collected}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Pending
                </span>
                <span className="font-bold text-slate-900 tabular-nums">{metrics.outstanding}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Overdue
                </span>
                <span className="font-bold text-slate-900 tabular-nums">{metrics.overdue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}