import React, { useState } from 'react';
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

export default function AdminFinanceOverview() {
  const [dateRange, setDateRange] = useState('This Month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic state for financial summary metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: '$82,650.00',
    revenueChange: '+12.4%',
    outstandingInvoices: '$4,130.00',
    pendingCount: 6,
    totalExpenses: '$14,280.00',
    expenseChange: '-3.1%',
    netProfit: '$68,370.00'
  });

  // Dynamic state for recent financial activity feed
  const [recentActivities, setRecentActivities] = useState([
    { id: 'TRX-9081', type: 'Credit', desc: 'Invoice #INV-1024 paid by ABC Logistics', amount: '+$500.00', date: 'Aug 16, 2026', status: 'Completed' },
    { id: 'TRX-9080', type: 'Debit', desc: 'Vehicle Maintenance - City Auto Repair', amount: '-$450.00', date: 'Aug 15, 2026', status: 'Completed' },
    { id: 'TRX-9079', type: 'Credit', desc: 'Invoice #INV-1025 paid by John Smith', amount: '+$280.00', date: 'Aug 15, 2026', status: 'Completed' },
    { id: 'TRX-9078', type: 'Debit', desc: 'Fuel Expense - Shell Station', amount: '-$120.00', date: 'Aug 14, 2026', status: 'Completed' },
    { id: 'TRX-9077', type: 'Credit', desc: 'Invoice #INV-1027 paid by Global Supplies', amount: '+$1,200.00', date: 'Aug 14, 2026', status: 'Completed' },
  ]);

  // Handle date range selection & simulate dynamic data fetching/recalculation
  const handleRangeChange = (range) => {
    setDateRange(range);
    setIsDropdownOpen(false);
    setIsLoading(true);

    setTimeout(() => {
      if (range === 'Today') {
        setMetrics({
          totalRevenue: '$2,450.00',
          revenueChange: '+4.2%',
          outstandingInvoices: '$850.00',
          pendingCount: 2,
          totalExpenses: '$320.00',
          expenseChange: '-1.5%',
          netProfit: '$2,130.00'
        });
      } else if (range === 'This Week') {
        setMetrics({
          totalRevenue: '$18,420.00',
          revenueChange: '+8.1%',
          outstandingInvoices: '$2,100.00',
          pendingCount: 4,
          totalExpenses: '$3,400.00',
          expenseChange: '-2.0%',
          netProfit: '$15,020.00'
        });
      } else if (range === 'This Month') {
        setMetrics({
          totalRevenue: '$82,650.00',
          revenueChange: '+12.4%',
          outstandingInvoices: '$4,130.00',
          pendingCount: 6,
          totalExpenses: '$14,280.00',
          expenseChange: '-3.1%',
          netProfit: '$68,370.00'
        });
      } else if (range === 'This Year') {
        setMetrics({
          totalRevenue: '$485,900.00',
          revenueChange: '+18.9%',
          outstandingInvoices: '$12,400.00',
          pendingCount: 15,
          totalExpenses: '$92,100.00',
          expenseChange: '-5.4%',
          netProfit: '$393,800.00'
        });
      }
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Date Range Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Financial Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">Real-time tracking of revenue, cash flow, and financial health.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-white border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>{dateRange}</span>
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

          <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export Report</span>
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
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
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
              <span>{metrics.revenueChange} vs last period</span>
            </div>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
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

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Expenses</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{metrics.totalExpenses}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{metrics.expenseChange} optimized vs last period</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Net Profit</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{metrics.netProfit}</div>
            <div className="mt-2 text-xs font-semibold text-gray-500">
              Calculated after operating costs
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Layout: Live Tracking Feed & Quick Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Financial Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Recent Financial Activity</h3>
              <p className="text-xs text-gray-500 mt-0.5">Live log tracking credits, debits, and invoice statuses</p>
            </div>
            <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-200">
              Live Feed
            </span>
          </div>

          <div className="divide-y divide-gray-100 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-5">ID / Type</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                {recentActivities.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-gray-900">{item.id}</div>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        item.type === 'Credit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-gray-900 max-w-[200px] truncate">
                      {item.desc}
                    </td>
                    <td className="py-3.5 px-5 text-gray-500 font-normal">{item.date}</td>
                    <td className={`py-3.5 px-5 text-right font-bold ${
                      item.type === 'Credit' ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      {item.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Status Breakdown Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">Invoice Collection Health</h3>
            <p className="text-xs text-gray-500 mt-0.5">Status ratio of issued invoices</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid Invoices
                  </span>
                  <span className="font-bold text-gray-900">78%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Due / Pending
                  </span>
                  <span className="font-bold text-gray-900">14%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: '14%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Overdue
                  </span>
                  <span className="font-bold text-gray-900">8%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: '8%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-600">Collection Rate</span>
              <span className="font-extrabold text-emerald-700">92.0%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}