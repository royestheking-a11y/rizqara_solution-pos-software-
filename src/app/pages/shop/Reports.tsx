import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saleStorage, expenseStorage, productStorage, customerStorage } from '../../lib/storage';
import { formatCurrency, calculateSaleProfit, getSalesChartData, getTopProducts, PAYMENT_METHOD_LABELS } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, ShoppingBag, Banknote, FileText, Download, Clock, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#ef4444'];

export default function Reports() {
  const { shop } = useAuth();
  const shopId = shop?.id || '';
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products' | 'profit'>('overview');

  const sales = useMemo(() => saleStorage.getByShop(shopId).filter(s => s.status === 'completed'), [shopId]);
  const expenses = useMemo(() => expenseStorage.getByShop(shopId), [shopId]);
  const products = useMemo(() => productStorage.getByShop(shopId), [shopId]);
  const customers = useMemo(() => customerStorage.getByShop(shopId), [shopId]);

  const filteredSales = useMemo(() => {
    const days = parseInt(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sales.filter(s => new Date(s.createdAt) >= cutoff);
  }, [sales, period]);

  const filteredExpenses = useMemo(() => {
    const days = parseInt(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return expenses.filter(e => new Date(e.date) >= cutoff);
  }, [expenses, period]);

  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + calculateSaleProfit(s), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalProfit - totalExpenses;
  const totalDue = filteredSales.reduce((sum, s) => sum + s.dueAmount, 0);

  const chartData = getSalesChartData(sales, parseInt(period));
  const topProducts = getTopProducts(filteredSales, 8);

  // Payment method breakdown
  const paymentData: Record<string, number> = {};
  filteredSales.forEach(sale => {
    sale.payments.forEach(p => {
      paymentData[p.method] = (paymentData[p.method] || 0) + p.amount;
    });
  });
  const paymentChartData = Object.entries(paymentData).map(([method, amount]) => ({
    name: PAYMENT_METHOD_LABELS[method] || method,
    value: amount,
  }));

  // Staff Performance calculation
  const staffPerformance = useMemo(() => {
    const performance: Record<string, { name: string; sales: number; invoices: number }> = {};
    filteredSales.forEach(sale => {
      const name = sale.cashierName || 'Unknown';
      if (!performance[name]) performance[name] = { name, sales: 0, invoices: 0 };
      performance[name].sales += sale.totalAmount;
      performance[name].invoices++;
    });
    return Object.values(performance).sort((a, b) => b.sales - a.sales);
  }, [filteredSales]);

  // Daily Summary
  const dailySummary = useMemo(() => {
    const groups: Record<string, { date: string; revenue: number; profit: number; invoices: number }> = {};
    filteredSales.forEach(sale => {
      const day = new Date(sale.createdAt).toISOString().split('T')[0];
      if (!groups[day]) groups[day] = { date: day, revenue: 0, profit: 0, invoices: 0 };
      groups[day].revenue += sale.totalAmount;
      groups[day].profit += calculateSaleProfit(sale);
      groups[day].invoices++;
    });
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSales]);

  // Monthly Summary
  const monthlySummary = useMemo(() => {
    const groups: Record<string, { month: string; revenue: number; profit: number; invoices: number }> = {};
    sales.forEach(sale => {
      const d = new Date(sale.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = { month: monthName, revenue: 0, profit: 0, invoices: 0 };
      groups[key].revenue += sale.totalAmount;
      groups[key].profit += calculateSaleProfit(sale);
      groups[key].invoices++;
    });
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([_, data]) => data);
  }, [sales]);

  const handleExportCSV = () => {
    const data = activeTab === 'overview' ? dailySummary : 
                 activeTab === 'sales' ? monthlySummary :
                 activeTab === 'products' ? topProducts : dailySummary;
    
    if (!data || data.length === 0) {
      alert('No data available to export for the selected period.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const val = (row as any)[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringVal = String(val).replace(/"/g, '""');
          return stringVal.includes(',') ? `"${stringVal}"` : stringVal;
        }).join(',')
      )
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MAXWEAR_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Business Reports" 
        subtitle="Analyze your sales, products, and financial performance"
        action={
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-gray-200 text-sm font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 months</option>
              <option value="365">This Year</option>
            </select>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
              >
                <FileText size={18} />
                Export CSV
              </button>
            </div>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6 gap-6">
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
          { id: 'sales', label: 'Sales Summary', icon: <FileText size={16} /> },
          { id: 'products', label: 'Best Sellers', icon: <ShoppingBag size={16} /> },
          { id: 'profit', label: 'Profit & Loss', icon: <Banknote size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Total Sales" value={formatCurrency(totalSales)} subtitle={`${filteredSales.length} invoices`} icon={<ShoppingBag size={20} />} color="blue" />
            <StatCard title="Gross Profit" value={formatCurrency(totalProfit)} icon={<TrendingUp size={20} />} color="green" />
            <StatCard title="Expenses" value={formatCurrency(totalExpenses)} icon={<Banknote size={20} />} color="orange" />
            <StatCard title="Net Profit" value={formatCurrency(netProfit)} icon={<TrendingUp size={20} />} color={netProfit >= 0 ? 'green' : 'blue'} />
            <StatCard title="Due Amount" value={formatCurrency(totalDue)} icon={<FileText size={20} />} color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Sales Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-gray-900 mb-6 font-bold">Sales & Profit Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(v: any) => formatCurrency(v)} 
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-gray-900 mb-4 font-bold">Payment Methods</h3>
              {paymentChartData.length > 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={paymentChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={5}>
                        {paymentChartData.map((entry, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                    {paymentChartData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] text-gray-500 font-medium truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Staff Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-gray-900 mb-6 font-bold">Staff Performance</h3>
              <div className="space-y-4">
                {staffPerformance.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {(s.name || 'S').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-800 font-bold">{s.name}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{s.invoices} invoices completed</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900 font-black">{formatCurrency(s.sales)}</div>
                    </div>
                  </div>
                ))}
                {staffPerformance.length === 0 && <p className="text-center text-gray-400 py-10">No records</p>}
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-gray-900 mb-6 font-bold">Top Customers</h3>
              <div className="space-y-4">
                {customers.sort((a, b) => b.totalPurchase - a.totalPurchase).slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-100">
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-800 font-bold">{c.name}</div>
                      <div className="text-[10px] text-gray-400">{c.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900 font-black">{formatCurrency(c.totalPurchase)}</div>
                      {c.totalDue > 0 && <div className="text-[10px] text-red-500 font-bold">Due: {formatCurrency(c.totalDue)}</div>}
                    </div>
                  </div>
                ))}
                {customers.length === 0 && <p className="text-center text-gray-400 py-10">No customer data</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-gray-900 font-bold flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                Daily Sales Report
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/30">
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Date</th>
                    <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-4">Invoices</th>
                    <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-4">Revenue</th>
                    <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.map((d, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">{new Date(d.date).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-gray-500">{d.invoices}</td>
                      <td className="px-4 py-4 text-right text-sm font-black text-gray-900">{formatCurrency(d.revenue)}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">{formatCurrency(d.profit)}</td>
                    </tr>
                  ))}
                  {dailySummary.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-20 text-gray-400 italic">No sales recorded for this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Sales Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-gray-900 font-bold flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                Monthly Sales Report
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/30">
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Month</th>
                    <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-4">Sales</th>
                    <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-4">Revenue</th>
                    <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map((m, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">{m.month}</td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-gray-500">{m.invoices}</td>
                      <td className="px-4 py-4 text-right text-sm font-black text-gray-900">{formatCurrency(m.revenue)}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">{formatCurrency(m.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-gray-900 font-bold flex items-center gap-2">
              <ShoppingBag size={18} className="text-blue-600" />
              Best Selling Products
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ordered by Revenue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/30 border-b border-gray-100">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-5">Rank</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-5">Product Details</th>
                  <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-5">Qty Sold</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-5">Total Revenue</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-5">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => {
                  const maxRevenue = topProducts[0]?.revenue || 1;
                  const pct = (p.revenue / totalSales) * 100;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors last:border-0">
                      <td className="px-6 py-5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          i === 1 ? 'bg-slate-100 text-slate-700' : 
                          i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="text-sm font-bold text-gray-800">{p.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Performance index: {((p.revenue / maxRevenue) * 10).toFixed(1)}/10</div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{p.quantity} units</span>
                      </td>
                      <td className="px-4 py-5 text-right text-sm font-black text-gray-900">{formatCurrency(p.revenue)}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-blue-600 mb-1">{pct.toFixed(1)}%</span>
                          <div className="w-24 bg-gray-100 rounded-full h-1">
                            <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'profit' && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
            <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-6 flex items-center gap-3">
              <Banknote size={24} className="p-1 bg-blue-600 text-white rounded-lg" />
              Profit & Loss Summary
            </h3>
            
            <div className="space-y-6">
              {[
                { label: 'Total Sales Revenue', value: totalSales, color: 'text-gray-900', desc: 'Total money received from sales' },
                { label: 'Cost of Goods Sold', value: totalSales - totalProfit, color: 'text-red-600', desc: 'Original purchase cost of items sold' },
                { label: 'Gross Profit', value: totalProfit, color: 'text-green-700', desc: 'Revenue minus cost of goods' },
                { label: 'Operating Expenses', value: totalExpenses, color: 'text-orange-600', desc: 'Rent, salaries, utility, and other costs' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-start group">
                  <div>
                    <span className="text-sm font-bold text-gray-800">{item.label}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <span className={`text-lg font-black ${item.color}`}>{formatCurrency(item.value)}</span>
                </div>
              ))}

              <div className="mt-10 p-8 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Final Net Profit</span>
                  <div className="bg-white/20 p-1 rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">{formatCurrency(netProfit)}</span>
                  <span className="text-xs font-bold opacity-70">({((netProfit/totalSales)*100 || 0).toFixed(1)}% margin)</span>
                </div>
              </div>

              {netProfit < 0 ? (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-700">Financial Alert: Net Loss Detected</p>
                    <p className="text-xs text-red-500">Your expenses exceed your profit. Review inventory costs and daily overheads.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Business is Profitable</p>
                    <p className="text-xs text-emerald-500">Your business is generating a healthy surplus for the current period.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
