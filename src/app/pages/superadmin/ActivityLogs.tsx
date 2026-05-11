import React, { useState, useMemo } from 'react';
import { activityLogStorage, shopStorage } from '../../lib/storage';
import { formatDateTime } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Search, Activity } from 'lucide-react';

export default function ActivityLogs() {
  const logs = useMemo(() => activityLogStorage.getAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), []);
  const shops = shopStorage.getAll();
  const [search, setSearch] = useState('');
  const [shopFilter, setShopFilter] = useState('all');

  const getShopName = (shopId: string | null) => {
    if (!shopId) return 'System';
    return shops.find(s => s.id === shopId)?.name || 'Unknown';
  };

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = l.userName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.details.toLowerCase().includes(search.toLowerCase());
      const matchShop = shopFilter === 'all' || l.shopId === shopFilter || (shopFilter === 'system' && !l.shopId);
      return matchSearch && matchShop;
    });
  }, [logs, search, shopFilter]);

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle={`${logs.length} total activities`} />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={shopFilter} onChange={e => setShopFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Shops</option>
          <option value="system">System</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-y-auto max-h-[600px]">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">User</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Shop</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Action</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Details</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 700 }}>
                        {log.userName.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-800">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{getShopName(log.shopId)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.details}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No activity logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}