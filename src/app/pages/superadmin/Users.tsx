import React, { useState, useMemo } from 'react';
import { userStorage, shopStorage } from '../../lib/storage';
import { User } from '../../lib/types';
import { formatDateTime } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Search, Users as UsersIcon, ShieldCheck, Store, Lock } from 'lucide-react';

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-700',
  owner: 'bg-blue-50 text-blue-700',
  manager: 'bg-orange-50 text-orange-700',
  cashier: 'bg-green-50 text-green-700',
};

const roleIcons: Record<string, React.ElementType> = {
  super_admin: ShieldCheck,
  owner: Store,
  manager: Lock,
  cashier: Lock,
};

export default function Users() {
  const [users] = useState(() => userStorage.getAll());
  const [shops] = useState(() => shopStorage.getAll());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const getShopName = (shopId: string | null) => {
    if (!shopId) return 'System';
    return shops.find(s => s.id === shopId)?.name || 'Unknown';
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div>
      <PageHeader title="All Users" subtitle={`${users.length} total users across all shops`} />

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {['super_admin', 'owner', 'manager', 'cashier'].map(role => (
          <div key={role} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="text-xl text-gray-900 mb-1" style={{ fontWeight: 700 }}>
              {users.filter(u => u.role === role).length}
            </div>
            <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${roleColors[role]}`}>
              {role.replace('_', ' ')}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">User</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Role</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Shop</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Phone</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const RoleIcon = roleIcons[user.role] || Lock;
                return (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs" style={{ fontWeight: 700 }}>
                          {(user.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${roleColors[user.role]}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getShopName(user.shopId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(user.createdAt)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}