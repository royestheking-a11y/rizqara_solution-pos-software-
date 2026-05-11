import React, { useMemo } from 'react';
import { shopStorage, saleStorage, userStorage } from '../../lib/storage';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Store, Users, Banknote } from 'lucide-react';

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

export default function SuperAdminReports() {
  const shops = shopStorage.getAll();
  const sales = saleStorage.getAll();
  const users = userStorage.getAll();

  const stats = useMemo(() => {
    const totalRevenue = shops.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyFee, 0);
    const totalSetup = shops.reduce((sum, s) => sum + s.setupFee, 0);
    const activeShops = shops.filter(s => s.status === 'active').length;
    const totalTransactions = sales.filter(s => s.status === 'completed').length;
    const totalSalesVolume = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.totalAmount, 0);
    return { totalRevenue, totalSetup, activeShops, totalTransactions, totalSalesVolume };
  }, [shops, sales]);

  const shopRevenueData = shops.map(s => ({
    name: s.name.length > 15 ? s.name.slice(0, 15) + '...' : s.name,
    revenue: s.monthlyFee,
    status: s.status,
  })).sort((a, b) => b.revenue - a.revenue);

  const statusData = [
    { name: 'Active', value: shops.filter(s => s.status === 'active').length },
    { name: 'Expired', value: shops.filter(s => s.status === 'expired').length },
    { name: 'Suspended', value: shops.filter(s => s.status === 'suspended').length },
  ].filter(d => d.value > 0);

  const packageData = [
    { name: 'Starter', value: shops.filter(s => s.packageId === 'pkg_starter').length },
    { name: 'Standard', value: shops.filter(s => s.packageId === 'pkg_standard').length },
    { name: 'Premium', value: shops.filter(s => s.packageId === 'pkg_premium').length },
  ].filter(d => d.value > 0);

  return (
    <div>
      <PageHeader title="System Reports" subtitle="Overview of all shops and revenue" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Monthly Revenue" value={formatCurrency(stats.totalRevenue)} subtitle="From active shops" icon={<Banknote size={20} />} color="blue" />
        <StatCard title="Total Setup Fees" value={formatCurrency(stats.totalSetup)} subtitle="All time" icon={<TrendingUp size={20} />} color="green" />
        <StatCard title="Active Shops" value={stats.activeShops.toString()} icon={<Store size={20} />} color="blue" />
        <StatCard title="Total Sales Volume" value={formatCurrency(stats.totalSalesVolume)} subtitle="All shops combined" icon={<Users size={20} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue by Shop */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>Monthly Revenue by Shop</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={shopRevenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Shop Status & Package Dist */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-gray-900 mb-3 text-sm" style={{ fontWeight: 600 }}>Shop Status Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={['#22c55e', '#ef4444', '#f59e0b'][idx]} />
                  ))}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-gray-900 mb-3 text-sm" style={{ fontWeight: 600 }}>Package Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={packageData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                  {packageData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Shop Table */}
      <div className="mt-5 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>All Shops Revenue Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs text-gray-500 px-3 py-2">Shop Name</th>
                <th className="text-left text-xs text-gray-500 px-3 py-2">Package</th>
                <th className="text-left text-xs text-gray-500 px-3 py-2">Status</th>
                <th className="text-right text-xs text-gray-500 px-3 py-2">Monthly Fee</th>
                <th className="text-right text-xs text-gray-500 px-3 py-2">Setup Fee</th>
                <th className="text-left text-xs text-gray-500 px-3 py-2">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {shops.map(shop => (
                <tr key={shop.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 text-sm text-gray-900">{shop.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full capitalize">{shop.packageId.replace('pkg_', '')}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full ${shop.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{shop.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(shop.monthlyFee)}</td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-500">{formatCurrency(shop.setupFee)}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-500">{formatDate(shop.expiryDate)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-xs text-gray-500" style={{ fontWeight: 600 }}>Total (Active)</td>
                <td className="px-3 py-2 text-right text-sm text-blue-700" style={{ fontWeight: 700 }}>{formatCurrency(stats.totalRevenue)}</td>
                <td className="px-3 py-2 text-right text-sm text-gray-700" style={{ fontWeight: 600 }}>{formatCurrency(stats.totalSetup)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}