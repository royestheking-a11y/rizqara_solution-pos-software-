import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { shopStorage, userStorage, saleStorage, packageStorage, notificationStorage } from '../../lib/storage';
import { formatCurrency, formatDate } from '../../lib/utils';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  Store, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Clock, ArrowRight, ShieldCheck, CreditCard, Package,
  BarChart3, Activity, Plus, Settings, ChevronRight, Zap, Star,
  LifeBuoy, Megaphone
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const shops = shopStorage.getAll();
  const users = userStorage.getAll();
  const sales = saleStorage.getAll();
  const packages = packageStorage.getAll();

  useEffect(() => {
    // Check for expired shops and create notifications
    const expired = shops.filter(s => s.status === 'expired');
    if (expired.length > 0) {
      const existing = notificationStorage.getByUser(null).find(n => n.type === 'shop_expiry' && !n.read);
      if (!existing) {
        notificationStorage.create({
          shopId: null,
          type: 'shop_expiry',
          title: 'Shop Expiry Alert',
          message: `${expired.length} shops have expired and require attention.`,
          read: false,
        });
      }
    }
  }, [shops]);

  const stats = useMemo(() => {
    const activeShops = shops.filter(s => s.status === 'active').length;
    const expiredShops = shops.filter(s => s.status === 'expired').length;
    const suspendedShops = shops.filter(s => s.status === 'suspended').length;
    const monthlyRevenue = shops.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyFee, 0);
    const totalUsers = users.filter(u => u.role !== 'super_admin').length;
    const totalTransactions = sales.filter(s => s.status === 'completed').length;
    const totalSalesVolume = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.totalAmount, 0);
    const setupRevenue = shops.reduce((sum, s) => sum + s.setupFee, 0);

    return { activeShops, expiredShops, suspendedShops, monthlyRevenue, totalUsers, totalTransactions, totalSalesVolume, setupRevenue };
  }, [shops, users, sales]);

  const recentShops = [...shops].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  const expiringShops = shops.filter(s => {
    if (s.status !== 'active') return false;
    const days = Math.ceil((new Date(s.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  });

  // Package distribution
  const packageDist = packages.map(pkg => ({
    ...pkg,
    count: shops.filter(s => s.packageId === pkg.id && s.status === 'active').length,
  }));

  const quickActions = [
    { label: 'Create New Shop', to: '/super-admin/shops', icon: Store, color: 'bg-blue-600' },
    { label: 'Manage Packages', to: '/super-admin/packages', icon: Package, color: 'bg-purple-600' },
    { label: 'View Reports', to: '/super-admin/reports', icon: BarChart3, color: 'bg-blue-600' },
    { label: 'Activity Logs', to: '/super-admin/activity', icon: Activity, color: 'bg-emerald-600' },
    { label: 'Support Tickets', to: '/super-admin/support', icon: LifeBuoy, color: 'bg-rose-600' },
    { label: 'Announcements', to: '/super-admin/announcements', icon: Megaphone, color: 'bg-orange-500' },
    { label: 'All Users', to: '/super-admin/users', icon: Users, color: 'bg-violet-600' },
    { label: 'System Settings', to: '/super-admin/settings', icon: Settings, color: 'bg-gray-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-gray-500 text-xs">System operational · All services online</span>
          </div>
          <h1 className="text-gray-900" style={{ fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Rizqara Solution — Overview of all shops & subscriptions</p>
        </div>
        <Link
          to="/super-admin/shops"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm"
          style={{ fontWeight: 600 }}
        >
          <Plus size={15} /> New Shop
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Shops"
          value={stats.activeShops.toString()}
          subtitle={`${stats.expiredShops} expired · ${stats.suspendedShops} suspended`}
          icon={<Store size={20} />}
          color="blue"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          subtitle="Recurring subscription fees"
          icon={<TrendingUp size={20} />}
          color="green"
          trend={{ value: 8, label: 'vs last month' }}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          subtitle="Owners, managers & cashiers"
          icon={<Users size={20} />}
          color="blue"
        />
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions.toString()}
          subtitle={`Vol: ${formatCurrency(stats.totalSalesVolume)}`}
          icon={<CreditCard size={20} />}
          color="purple"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <span className="text-green-600 text-xs px-2 py-0.5 bg-green-50 rounded-full" style={{ fontWeight: 600 }}>Active</span>
          </div>
          <div className="text-2xl text-green-700 mb-0.5" style={{ fontWeight: 800 }}>{stats.activeShops}</div>
          <div className="text-gray-500 text-xs">Active Subscriptions</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle size={18} className="text-red-500" />
            </div>
            <span className="text-red-600 text-xs px-2 py-0.5 bg-red-50 rounded-full" style={{ fontWeight: 600 }}>Expired</span>
          </div>
          <div className="text-2xl text-red-600 mb-0.5" style={{ fontWeight: 800 }}>{stats.expiredShops}</div>
          <div className="text-gray-500 text-xs">Need Renewal</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-yellow-600" />
            </div>
            <span className="text-yellow-600 text-xs px-2 py-0.5 bg-yellow-50 rounded-full" style={{ fontWeight: 600 }}>Expiring</span>
          </div>
          <div className="text-2xl text-yellow-700 mb-0.5" style={{ fontWeight: 800 }}>{expiringShops.length}</div>
          <div className="text-gray-500 text-xs">Expiring in 30 days</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Zap size={18} className="text-blue-600" />
            </div>
            <span className="text-blue-600 text-xs px-2 py-0.5 bg-blue-50 rounded-full" style={{ fontWeight: 600 }}>Revenue</span>
          </div>
          <div className="text-2xl text-blue-700 mb-0.5" style={{ fontWeight: 800 }}>{formatCurrency(stats.setupRevenue)}</div>
          <div className="text-gray-500 text-xs">Total Setup Fees</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shop Overview table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-gray-900" style={{ fontWeight: 700 }}>All Shops</h3>
              <p className="text-gray-400 text-xs mt-0.5">{shops.length} total registered shops</p>
            </div>
            <Link to="/super-admin/shops" className="flex items-center gap-1 text-blue-600 text-sm hover:underline" style={{ fontWeight: 500 }}>
              Manage all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs text-gray-400 px-5 py-3">Shop Name</th>
                  <th className="text-left text-xs text-gray-400 px-4 py-3 hidden md:table-cell">Package</th>
                  <th className="text-left text-xs text-gray-400 px-4 py-3">Status</th>
                  <th className="text-right text-xs text-gray-400 px-4 py-3">Monthly Fee</th>
                  <th className="text-right text-xs text-gray-400 px-4 py-3 hidden lg:table-cell">Expires</th>
                </tr>
              </thead>
              <tbody>
                {recentShops.map(shop => {
                  const daysLeft = Math.ceil((new Date(shop.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={shop.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xs flex-shrink-0" style={{ fontWeight: 800 }}>
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{shop.name}</div>
                            <div className="text-[10px] text-gray-400">{shop.ownerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full capitalize" style={{ fontWeight: 600 }}>
                          {shop.packageId.replace('pkg_', '')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            shop.status === 'active' ? 'bg-green-400' :
                            shop.status === 'expired' ? 'bg-red-400' : 'bg-yellow-400'
                          }`} />
                          <span className={`text-xs capitalize ${
                            shop.status === 'active' ? 'text-green-700' :
                            shop.status === 'expired' ? 'text-red-600' : 'text-yellow-700'
                          }`} style={{ fontWeight: 600 }}>
                            {shop.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{formatCurrency(shop.monthlyFee)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        <span className={`text-xs ${
                          daysLeft < 0 ? 'text-red-500' :
                          daysLeft <= 7 ? 'text-red-500' :
                          daysLeft <= 30 ? 'text-yellow-600' : 'text-gray-400'
                        }`} style={{ fontWeight: daysLeft <= 30 ? 600 : 400 }}>
                          {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Package Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Package Distribution</h3>
            <div className="space-y-3">
              {packageDist.map((pkg, i) => {
                const pct = stats.activeShops > 0 ? Math.round((pkg.count / stats.activeShops) * 100) : 0;
                const colors = ['bg-blue-600', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500'];
                const textColors = ['text-blue-600', 'text-purple-600', 'text-emerald-600', 'text-orange-600'];
                return (
                  <div key={pkg.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <Star size={12} className={textColors[i % textColors.length]} />
                        <span className="text-xs text-gray-700" style={{ fontWeight: 600 }}>{pkg.displayName}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        <span style={{ fontWeight: 700 }}>{pkg.count}</span> shops ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${colors[i % colors.length]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expiring soon */}
          {expiringShops.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={15} className="text-yellow-600" />
                <h3 className="text-yellow-800 text-sm" style={{ fontWeight: 700 }}>Expiring Soon</h3>
              </div>
              <div className="space-y-2">
                {expiringShops.slice(0, 3).map(shop => {
                  const days = Math.ceil((new Date(shop.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={shop.id} className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-yellow-100">
                      <div className="text-sm text-gray-700 truncate" style={{ fontWeight: 600 }}>{shop.name}</div>
                      <span className="text-xs text-yellow-600 ml-2 flex-shrink-0" style={{ fontWeight: 700 }}>{days}d left</span>
                    </div>
                  );
                })}
              </div>
              <Link to="/super-admin/subscriptions" className="mt-3 flex items-center gap-1 text-yellow-700 text-xs hover:underline" style={{ fontWeight: 600 }}>
                Manage subscriptions <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions grid */}
      <div>
        <h3 className="text-gray-700 text-sm mb-3" style={{ fontWeight: 700 }}>Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map(action => (
            <Link
              key={action.to}
              to={action.to}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className={`${action.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                <action.icon size={18} />
              </div>
              <span className="text-xs text-gray-600 text-center" style={{ fontWeight: 600 }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}