import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { saleStorage, productStorage, expenseStorage, customerStorage } from '../../lib/storage';
import {
  formatCurrency, getTodayStats, getMonthStats, getSalesChartData,
  getTopProducts, getLowStockProducts, getPaymentMethodStats,
  getOutOfStockProducts, PAYMENT_METHOD_LABELS, calculateSaleProfit, isToday
} from '../../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ShoppingBag, TrendingUp, Banknote, FileText, AlertTriangle,
  ArrowRight, ShoppingCart, Package, Users, Zap, ArrowUpRight, ArrowDownRight,
  Clock, BarChart3
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color: 'blue' | 'green' | 'orange' | 'purple';
  link?: string;
}

function KPICard({ title, value, subtitle, icon, trend, color, link }: StatCardProps) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'bg-blue-600', border: 'border-blue-100' },
    green:  { bg: 'bg-green-50', text: 'text-green-700', icon: 'bg-green-600', border: 'border-green-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'bg-orange-500', border: 'border-orange-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-600', border: 'border-purple-100' },
  };
  const c = colorMap[color];
  const Wrapper = link ? Link : 'div';

  return (
    <Wrapper to={link || '#'} className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm hover:shadow-md transition-all duration-200 group block`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            trend.value >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`} style={{ fontWeight: 600 }}>
            {trend.value >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend.value)}%
          </div>
        )}
        {link && !trend && (
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 transition-colors">
            <ArrowRight size={12} />
          </div>
        )}
      </div>
      <div className={`text-2xl mb-1 ${c.text}`} style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</div>
      <div className="text-gray-600 text-sm" style={{ fontWeight: 500 }}>{title}</div>
      {subtitle && <div className="text-gray-400 text-xs mt-0.5">{subtitle}</div>}
    </Wrapper>
  );
}

export default function ShopDashboard() {
  const { shop, user } = useAuth();
  const { t, language } = useLanguage();
  const shopId = shop?.id || '';
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(7);

  const sales = useMemo(() => saleStorage.getByShop(shopId), [shopId]);
  const products = useMemo(() => productStorage.getByShop(shopId), [shopId]);
  const expenses = useMemo(() => expenseStorage.getByShop(shopId), [shopId]);
  const customers = useMemo(() => customerStorage.getByShop(shopId), [shopId]);

  const todayStats = useMemo(() => getTodayStats(sales, expenses), [sales, expenses]);
  const monthStats = useMemo(() => getMonthStats(sales, expenses), [sales, expenses]);
  const chartData = useMemo(() => getSalesChartData(sales, chartDays), [sales, chartDays]);
  const topProducts = useMemo(() => getTopProducts(sales, 6), [sales]);
  const lowStockProducts = useMemo(() => getLowStockProducts(products), [products]);
  const outOfStockProducts = useMemo(() => getOutOfStockProducts(products), [products]);
  const paymentStats = useMemo(() => getPaymentMethodStats(sales), [sales]);

  const totalStockValue = products.reduce((sum, p) => sum + p.totalQuantity * p.purchasePrice, 0);
  const totalDue = customers.reduce((sum, c) => sum + c.totalDue, 0);

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const recentSales = useMemo(() =>
    sales.filter(s => s.status === 'completed').slice().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 8),
    [sales]
  );

  const newCustomersThisMonth = customers.filter(c => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (language === 'bn') {
      if (h < 12) return 'শুভ সকাল';
      if (h < 17) return 'শুভ দুপুর';
      return 'শুভ সন্ধ্যা';
    }
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-5">
      {/* === HEADER === */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-700 text-xs px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100" style={{ fontWeight: 600 }}>
              {new Date().toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-gray-900" style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
            {greeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{shop?.name} — here's what's happening today</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/shop/pos"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25"
            style={{ fontWeight: 600 }}
          >
            <Zap size={15} /> {t('add_new')} {t('sales')}
          </Link>
        </div>
      </div>

      {/* === TODAY KPIs === */}
      <div className={`grid gap-4 ${isOwnerOrManager ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        <KPICard
          title={t('revenue')}
          value={formatCurrency(todayStats.totalSales)}
          subtitle={`${todayStats.totalInvoices} ${t('invoices')} ${language === 'bn' ? 'আজ' : 'today'}`}
          icon={<ShoppingBag size={20} />}
          color="blue"
          link="/shop/sales"
        />
        {isOwnerOrManager && (
          <KPICard
            title={t('profit')}
            value={formatCurrency(todayStats.totalProfit)}
            subtitle={language === 'bn' ? 'মোট লাভ' : 'Gross profit'}
            icon={<TrendingUp size={20} />}
            color="green"
          />
        )}
        {isOwnerOrManager && (
          <KPICard
            title={t('expenses_today')}
            value={formatCurrency(todayStats.totalExpense)}
            subtitle={language === 'bn' ? 'সব ক্যাটাগরি' : 'All categories'}
            icon={<Banknote size={20} />}
            color="orange"
            link="/shop/expenses"
          />
        )}
        <KPICard
          title={t('total_sales')}
          value={sales.filter(s => s.status === 'completed').length.toString()}
          subtitle={language === 'bn' ? 'সব সময়ের' : 'All time completed'}
          icon={<FileText size={20} />}
          color="blue"
          link="/shop/sales"
        />
      </div>

      {/* === MONTHLY OVERVIEW (owner/manager only) === */}
      {isOwnerOrManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title={t('monthly_revenue')} value={formatCurrency(monthStats.totalSales)} subtitle={`${monthStats.count} ${t('sales')}`} icon={<ShoppingBag size={18} />} color="blue" />
          <KPICard title={t('monthly_profit')} value={formatCurrency(monthStats.totalProfit)} subtitle={language === 'bn' ? 'মোট লাভ' : 'Gross profit'} icon={<TrendingUp size={18} />} color="green" />
          <KPICard title={t('stock_value')} value={formatCurrency(totalStockValue)} subtitle={`${products.filter(p => p.status === 'active').length} ${t('products')}`} icon={<Package size={18} />} color="blue" link="/shop/inventory" />
          <KPICard title={t('customer_due')} value={formatCurrency(totalDue)} subtitle={`${customers.length} ${t('customers')}`} icon={<AlertTriangle size={18} />} color="orange" link="/shop/customers" />
        </div>
      )}

      {/* === MAIN CHARTS ROW === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-900" style={{ fontWeight: 700 }}>{t('sales_trend')}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{language === 'bn' ? 'সময়ের সাথে আয় এবং লাভ' : 'Revenue vs Profit over time'}</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {([7, 14, 30] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    chartDays === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={{ fontWeight: chartDays === d ? 600 : 400 }}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={(v: any) => formatCurrency(v)}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="#2563EB" fillOpacity={0.08} name="Revenue" dot={{ r: 3, fill: '#2563EB' }} />
              <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.07} name="Profit" dot={{ r: 3, fill: '#10B981' }} hide={!isOwnerOrManager} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-600 rounded" />
              <span className="text-gray-500 text-xs">Revenue</span>
            </div>
            {isOwnerOrManager && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                <span className="text-gray-500 text-xs">Profit</span>
              </div>
            )}
            <div className="ml-auto text-xs text-gray-400">
              Total: <span className="text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(chartData.reduce((s, d) => s + d.revenue, 0))}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900" style={{ fontWeight: 700 }}>{t('payment_methods')}</h3>
            <Link to="/shop/reports" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
              Report <ArrowRight size={11} />
            </Link>
          </div>
          {paymentStats.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No sales data</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {paymentStats.map(({ method, amount }, idx) => {
                const total = paymentStats.reduce((s, p) => s + p.amount, 0);
                const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                return (
                  <div key={method}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                        <span className="text-xs text-gray-700" style={{ fontWeight: 500 }}>{PAYMENT_METHOD_LABELS[method] || method}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span style={{ fontWeight: 700 }}>{formatCurrency(amount)}</span>
                        <span className="text-gray-300 ml-1">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick stats */}
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
                {sales.filter(s => s.status === 'completed' && isToday(s.createdAt)).length}
              </div>
              <div className="text-gray-400 text-[10px] mt-0.5">Today's Sales</div>
            </div>
            <div className="text-center border-l border-gray-100">
              <div className="text-red-600 text-sm" style={{ fontWeight: 700 }}>
                {formatCurrency(sales.filter(s => s.status === 'completed').reduce((s, sale) => s + sale.dueAmount, 0))}
              </div>
              <div className="text-gray-400 text-[10px] mt-0.5">Total Due</div>
            </div>
          </div>
        </div>
      </div>

      {/* === BOTTOM ROW === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900" style={{ fontWeight: 700 }}>{t('products')}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{language === 'bn' ? 'আয়ের ভিত্তিতে' : 'By revenue'}</p>
            </div>
            <Link to="/shop/sales" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">View all</Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 group">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs text-white flex-shrink-0 shadow-sm ${
                    i === 0 ? 'bg-[#D4A853]' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-200'
                  }`} style={{ fontWeight: 800 }}>
                    {i < 3 ? (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.quantity} units sold</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{formatCurrency(p.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Stock Alerts</h3>
              <p className="text-gray-400 text-xs mt-0.5">
                {outOfStockProducts.length} out · {lowStockProducts.length} low
              </p>
            </div>
            <Link to="/shop/inventory" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">View all</Link>
          </div>
          {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <Package size={20} className="text-green-500" />
              </div>
              <p className="text-gray-500 text-sm" style={{ fontWeight: 500 }}>All stocked up!</p>
              <p className="text-gray-400 text-xs mt-1">No stock issues</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {outOfStockProducts.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={14} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>{p.name}</div>
                    <div className="text-[10px] text-red-500">OUT OF STOCK</div>
                  </div>
                </div>
              ))}
              {lowStockProducts.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={14} className="text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>{p.name}</div>
                    <div className="text-[10px] text-yellow-600">{p.totalQuantity} left (min: {p.lowStockAlert})</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isOwnerOrManager && (
            <Link to="/shop/purchases" className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors text-xs" style={{ fontWeight: 500 }}>
              + Create Purchase Order
            </Link>
          )}
        </div>

        {/* Quick Actions + Summary */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-gray-900 mb-3" style={{ fontWeight: 700 }}>{t('quick_actions')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/shop/pos" className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <ShoppingCart size={16} className="text-white" />
                </div>
                <span className="text-blue-700 text-[11px] text-center" style={{ fontWeight: 600 }}>New Sale</span>
              </Link>
              <Link to="/shop/products" className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <Package size={16} className="text-white" />
                </div>
                <span className="text-blue-700 text-[11px] text-center" style={{ fontWeight: 600 }}>Add Product</span>
              </Link>
              <Link to="/shop/customers" className="flex flex-col items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm">
                  <Users size={16} className="text-white" />
                </div>
                <span className="text-purple-700 text-[11px] text-center" style={{ fontWeight: 600 }}>Customers</span>
              </Link>
              <Link to="/shop/reports" className="flex flex-col items-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
                  <BarChart3 size={16} className="text-white" />
                </div>
                <span className="text-emerald-700 text-[11px] text-center" style={{ fontWeight: 600 }}>Reports</span>
              </Link>
            </div>
          </div>

          {/* Summary mini cards */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-gray-900 mb-3 text-sm" style={{ fontWeight: 700 }}>Business Summary</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Total Products</span>
                <span className="text-gray-900 text-xs" style={{ fontWeight: 700 }}>{products.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Total Customers</span>
                <span className="text-gray-900 text-xs" style={{ fontWeight: 700 }}>{customers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">New This Month</span>
                <span className="text-blue-600 text-xs" style={{ fontWeight: 700 }}>+{newCustomersThisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Out of Stock</span>
                <span className={`text-xs ${outOfStockProducts.length > 0 ? 'text-red-600' : 'text-green-600'}`} style={{ fontWeight: 700 }}>
                  {outOfStockProducts.length}
                </span>
              </div>
              {isOwnerOrManager && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-1">
                  <span className="text-gray-500 text-xs">Net Profit (Month)</span>
                  <span className={`text-xs ${monthStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontWeight: 700 }}>
                    {formatCurrency(monthStats.netProfit)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === RECENT SALES TABLE === */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-gray-900" style={{ fontWeight: 700 }}>{t('recent_transactions')}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{language === 'bn' ? 'সর্বশেষ সম্পন্ন বিক্রয়সমূহ' : `Latest ${recentSales.length} completed sales`}</p>
          </div>
          <Link to="/shop/sales" className="flex items-center gap-1.5 text-blue-600 text-sm hover:underline" style={{ fontWeight: 500 }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs text-gray-400 px-5 py-3">Invoice</th>
                <th className="text-left text-xs text-gray-400 px-4 py-3">Customer</th>
                <th className="text-left text-xs text-gray-400 px-4 py-3 hidden md:table-cell">Cashier</th>
                <th className="text-left text-xs text-gray-400 px-4 py-3 hidden lg:table-cell">Items</th>
                <th className="text-right text-xs text-gray-400 px-4 py-3">Amount</th>
                <th className="text-left text-xs text-gray-400 px-4 py-3">Status</th>
                <th className="text-right text-xs text-gray-400 px-4 py-3 hidden md:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(sale => (
                <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-blue-600 text-sm" style={{ fontWeight: 700 }}>{sale.invoiceNumber}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{sale.customerName || 'Walk-in'}</div>
                    {sale.customerPhone && <div className="text-[10px] text-gray-400">{sale.customerPhone}</div>}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] text-blue-600" style={{ fontWeight: 700 }}>
                        {(sale.cashierName || 'S').charAt(0)}
                      </div>
                      <span className="text-xs text-gray-600">{(sale.cashierName || 'Staff').split(' ')[0]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">{sale.items.length} item(s)</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{formatCurrency(sale.totalAmount)}</div>
                    {isOwnerOrManager && <div className="text-[10px] text-green-600">+{formatCurrency(calculateSaleProfit(sale))} profit</div>}
                  </td>
                  <td className="px-4 py-3.5">
                    {sale.dueAmount > 0 ? (
                      <span className="text-[10px] px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-100" style={{ fontWeight: 600 }}>
                        Due {formatCurrency(sale.dueAmount)}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100" style={{ fontWeight: 600 }}>
                        Paid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1 text-gray-400 text-xs">
                      <Clock size={10} />
                      {new Date(sale.createdAt).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <ShoppingCart size={40} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No sales yet.</p>
                    <Link to="/shop/pos" className="text-blue-600 text-sm hover:underline mt-1 inline-block" style={{ fontWeight: 500 }}>
                      Start your first sale →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}