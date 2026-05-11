import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { activityLogStorage } from '../../lib/storage';
import { formatDateTime } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Search, History, User, Clock, Info, ShieldAlert, Filter } from 'lucide-react';

export default function ActivityLogs() {
  const { shop } = useAuth();
  const shopId = shop?.id || '';
  const [logs, setLogs] = useState(() => activityLogStorage.getByShop(shopId));
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = 
        l.userName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.details.toLowerCase().includes(search.toLowerCase());
      
      const matchType = filterType === 'all' || 
        (filterType === 'price' && l.action.includes('Price')) ||
        (filterType === 'stock' && l.action.includes('Stock')) ||
        (filterType === 'sale' && l.action.includes('Sale')) ||
        (filterType === 'register' && l.action.includes('Register'));
        
      return matchSearch && matchType;
    });
  }, [logs, search, filterType]);

  const getLogIcon = (action: string) => {
    if (action.includes('Price')) return <ShieldAlert size={16} className="text-amber-600" />;
    if (action.includes('Sale')) return <ShieldAlert size={16} className="text-red-600" />;
    if (action.includes('Stock')) return <History size={16} className="text-blue-600" />;
    if (action.includes('Register')) return <Clock size={16} className="text-green-600" />;
    return <Info size={16} className="text-gray-500" />;
  };

  const getLogColor = (action: string) => {
    if (action.includes('Price')) return 'bg-amber-50 border-amber-100';
    if (action.includes('Sale')) return 'bg-red-50 border-red-100';
    if (action.includes('Stock')) return 'bg-blue-50 border-blue-100';
    if (action.includes('Register')) return 'bg-green-50 border-green-100';
    return 'bg-gray-50 border-gray-100';
  };

  return (
    <div>
      <PageHeader 
        title="Audit Logs" 
        subtitle="Track sensitive actions and administrative changes"
        badge={`${logs.length} Total`}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm md:col-span-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search logs by user, action or details..." 
                className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" 
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <Filter size={14} className="text-gray-400" />
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
              >
                <option value="all">All Actions</option>
                <option value="price">Price Changes</option>
                <option value="stock">Stock Updates</option>
                <option value="sale">Sale Deletions</option>
                <option value="register">Registers</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-md text-white">
          <div className="text-xs opacity-80 mb-1" style={{ fontWeight: 600 }}>Security Level</div>
          <div className="text-xl mb-1" style={{ fontWeight: 800 }}>Audit Grade</div>
          <div className="text-[10px] bg-white/20 rounded-full px-2 py-0.5 inline-block">Logging Active</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-400 px-5 py-4">Action & Timestamp</th>
                <th className="text-left text-xs text-gray-400 px-4 py-4">User</th>
                <th className="text-left text-xs text-gray-400 px-4 py-4">Details / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${getLogColor(log.action)}`}>
                        {getLogIcon(log.action)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{log.action}</div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock size={10} />
                          {formatDateTime(log.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <User size={12} className="text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                      {log.details}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-20">
                    <History size={40} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No activity logs found</p>
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
