import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ChevronDown, 
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
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

  // Dynamic state for financial summary metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: '$0.00',
    revenueChange: '0.0%',
    outstandingInvoices: '$0.00',
    pendingCount: 0,
    totalExpenses: '$0.00',
    expenseChange: '0.0%',
    netProfit: '$0.00'
  });

  // Dynamic state for recent financial activity feed
  const [recentActivities, setRecentActivities] = useState([]);

  // Collection health percentages
  const [health, setHealth] = useState({
    paidPercent: 0,
    pendingPercent: 0,
    overduePercent: 0,
    collectionRate: '0%'
  });

  // Fetch all invoices on mount
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

    // Real-time subscription for instant financial updates
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

  // Filter and compute metrics whenever dateRange or allInvoices changes
  const processMetricsAndActivity = (invoices, range) => {
    const now = new Date();
    
    // Filter invoices by selected date range
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

    // Calculate Totals
    let paidTotal = 0;
    let outstandingTotal = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let overdueCount = 0;

    filteredInvoices.forEach(inv => {
      const amount = Number(inv.total || inv.amount || 0);
      const status = (inv.status || 'unpaid').toLowerCase();

      if (status === 'paid') {
        paidTotal += amount;
        paidCount++;
      } else {
        outstandingTotal += amount;
        if (status === 'overdue') {
          overdueCount++;
        } else {
          pendingCount++;
        }
      }
    });

    const totalInvoicesCount = filteredInvoices.length;
    const paidPct = totalInvoicesCount > 0 ? Math.round((paidCount / totalInvoicesCount) * 100) : 0;
    const pendingPct = totalInvoicesCount > 0 ? Math.round((pendingCount / totalInvoicesCount) * 100) : 0;
    const overduePct = totalInvoicesCount > 0 ? Math.round((overdueCount / totalInvoicesCount) * 100) : 0;

    setMetrics({
      totalRevenue: fmtMoney(paidTotal),
      revenueChange: '+12.4% vs prior',
      outstandingInvoices: fmtMoney(outstandingTotal),
      pendingCount: pendingCount + overdueCount,
      totalExpenses: fmtMoney(paidTotal * 0.15), 
      expenseChange: '-3.1% optimized',
      netProfit: fmtMoney(paidTotal * 0.85)
    });

    setHealth({
      paidPercent: paidPct,
      pendingPercent: pendingPct,
      overduePercent: overduePct,
      collectionRate: `${paidPct}%`
    });

    // Map recent activities from filtered invoices
    const activities = filteredInvoices.slice(0, 6).map((inv, idx) => {
      const isPaid = (inv.status || '').toLowerCase() === 'paid';
      const invNum = inv.invoice_number || `INV-${inv.id.slice(0, 8)}`;
      const dateStr = new Date(inv.issued_at || inv.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return {
        id: `TRX-${1000 + idx}`,
        type: isPaid ? 'Credit' : 'Pending',
        desc: `Invoice #${invNum} ${isPaid ? 'Paid' : 'Issued'}`,
        amount: `${isPaid ? '+' : ''}${fmtMoney(inv.total || inv.amount || 0, inv.currency)}`,
        date: dateStr,
        status: inv.status || 'Unpaid'
      };
    });

    setRecentActivities(activities);
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

  return (
    <div className="space-y-6 font-sans px-3 sm:px-0">
      {/* Header & Date Range Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Financial Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">Real-time tracking of revenue, cash flow, and financial health.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Filter Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-2 bg-white border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>{dateRange}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20">
                {['Today', 'This Week', 'This Month', 'This Year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => handleRangeChange(range)}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer ${
                      dateRange === range ? 'text-gray-900 font-bold bg-gray-50' : 'text-gray-600'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards Grid with Loading State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
          </div>
        )}

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/85 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Revenue</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{metrics.totalRevenue}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Paid invoices collected</span>
            </div>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/85 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Outstanding</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <FileText className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{metrics.outstandingInvoices}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              <span>{metrics.pendingCount} unpaid invoices awaiting collection</span>
            </div>
          </div>
        </div>

        {/* Total Expenses / Operational Est */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/85 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Est. Operating Cost</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{metrics.totalExpenses}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Estimated logistics overhead</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/85 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Net Return</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{metrics.netProfit}</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">
              Calculated after estimated costs
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Layout: Live Tracking Feed & Quick Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Financial Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/85 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Recent Financial Activity</h3>
              <p className="text-xs text-gray-500 mt-0.5">Live database log tracking recent customer invoices</p>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-200">
              Live Feed
            </span>
          </div>

          <div className="p-4 sm:p-0">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-medium">
                No financial transactions found for this time period.
              </div>
            ) : (
              <>
                {/* Mobile Card List View */}
                <div className="space-y-3 sm:hidden">
                  {recentActivities.map((item, index) => (
                    <div key={index} className="bg-gray-50/75 rounded-xl border border-gray-200/80 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-gray-900 text-xs">{item.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          item.status.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-gray-800">
                        {item.desc}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[11px] text-gray-500">
                        <span>{item.date}</span>
                        <span className={`font-black text-sm ${item.status.toLowerCase() === 'paid' ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {item.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-3 px-5">Transaction / Status</th>
                        <th className="py-3 px-5">Description</th>
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                      {recentActivities.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-gray-900">{item.id}</div>
                            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              item.status.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-900 max-w-[200px] truncate">
                            {item.desc}
                          </td>
                          <td className="py-3.5 px-5 text-gray-500 font-normal">{item.date}</td>
                          <td className={`py-3.5 px-5 text-right font-bold ${
                            item.status.toLowerCase() === 'paid' ? 'text-emerald-600' : 'text-gray-900'
                          }`}>
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

        {/* Quick Status Breakdown Card */}
        <div className="bg-white rounded-2xl border border-gray-200/85 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">Invoice Collection Health</h3>
            <p className="text-xs text-gray-500 mt-0.5">Live status ratio of database invoices</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid Invoices
                  </span>
                  <span className="font-bold text-gray-900">{health.paidPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${health.paidPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Due / Pending
                  </span>
                  <span className="font-bold text-gray-900">{health.pendingPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${health.pendingPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Overdue
                  </span>
                  <span className="font-bold text-gray-900">{health.overduePercent}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${health.overduePercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-600">Collection Rate</span>
              <span className="font-extrabold text-emerald-700">{health.collectionRate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}