import React, { useMemo } from 'react';
import { shopStorage, packageStorage } from '../../lib/storage';
import { formatCurrency, formatDate, isExpired } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { CheckCircle, XCircle, AlertTriangle, Banknote, Store } from 'lucide-react';

export default function Subscriptions() {
  const shops = shopStorage.getAll();
  const packages = packageStorage.getAll();

  const stats = useMemo(() => {
    const active = shops.filter(s => s.status === 'active');
    const expired = shops.filter(s => s.status === 'expired');
    const suspended = shops.filter(s => s.status === 'suspended');
    const monthlyRevenue = active.reduce((sum, s) => sum + s.monthlyFee, 0);
    const totalRevenue = shops.reduce((sum, s) => sum + s.setupFee, 0);
    const expiringSoon = active.filter(s => {
      const expiry = new Date(s.expiryDate);
      const now = new Date();
      const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
    return { active, expired, suspended, monthlyRevenue, totalRevenue, expiringSoon };
  }, [shops]);

  const getPackageName = (id: string) => packages.find(p => p.id === id)?.displayName || 'N/A';

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Shop subscription management" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard title="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} subtitle="From active shops" icon={<Banknote size={20} />} color="blue" />
        <StatCard title="Active Subscriptions" value={stats.active.length.toString()} icon={<CheckCircle size={20} />} color="green" />
        <StatCard title="Expired" value={stats.expired.length.toString()} icon={<XCircle size={20} />} color="orange" />
        <StatCard title="Expiring Soon (7 days)" value={stats.expiringSoon.length.toString()} icon={<AlertTriangle size={20} />} color="gold" />
      </div>

      {stats.expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <span className="text-sm text-amber-800" style={{ fontWeight: 600 }}>Shops Expiring Soon</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.expiringSoon.map(s => (
              <span key={s.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                {s.name} — {formatDate(s.expiryDate)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Shop</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Package</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Monthly Fee</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Setup Fee</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Expiry</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Owner</th>
              </tr>
            </thead>
            <tbody>
              {shops.map(shop => (
                <tr key={shop.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Store size={14} className="text-blue-600" />
                      </div>
                      <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{shop.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{getPackageName(shop.packageId)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      shop.status === 'active' ? 'bg-green-50 text-green-700' :
                      shop.status === 'expired' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>{shop.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(shop.monthlyFee)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">{formatCurrency(shop.setupFee)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isExpired(shop.expiryDate) ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatDate(shop.expiryDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{shop.ownerName}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Monthly Total</td>
                <td className="px-4 py-3 text-right text-sm text-blue-700" style={{ fontWeight: 800 }}>{formatCurrency(stats.monthlyRevenue)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}