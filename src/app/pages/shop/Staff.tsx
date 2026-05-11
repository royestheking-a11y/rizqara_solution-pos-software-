import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userStorage } from '../../lib/storage';
import { User, UserRole } from '../../lib/types';
import { formatDateTime } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

const roleColors: Record<string, string> = {
  owner: 'bg-blue-50 text-blue-700',
  manager: 'bg-orange-50 text-orange-700',
  cashier: 'bg-green-50 text-green-700',
};

export default function Staff() {
  const { shop, user } = useAuth();
  const shopId = shop?.id || '';
  const [staff, setStaff] = useState(() => userStorage.getByShop(shopId));
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'cashier' as UserRole,
    password: '', maxDiscountPercent: 5, status: 'active' as 'active' | 'inactive',
  });

  const openCreate = () => {
    setForm({ name: '', email: '', phone: '', role: 'cashier', password: 'Staff@123', maxDiscountPercent: 5, status: 'active' });
    setEditUser(null);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, password: '', maxDiscountPercent: u.maxDiscountPercent || 5, status: u.status });
    setEditUser(u);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    if (!editUser && !form.password) { toast.error('Password required for new staff'); return; }

    const existingByEmail = userStorage.getByEmail(form.email);
    if (!editUser && existingByEmail) { toast.error('Email already exists'); return; }

    if (editUser) {
      const updated = { ...editUser, name: form.name, phone: form.phone, role: form.role, maxDiscountPercent: form.maxDiscountPercent, status: form.status };
      if (form.password) updated.password = form.password;
      userStorage.update(updated);
      toast.success('Staff updated');
    } else {
      userStorage.create({
        shopId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        password: form.password,
        status: 'active',
        maxDiscountPercent: form.maxDiscountPercent,
      });
      toast.success('Staff created! Password: ' + form.password);
    }
    setStaff(userStorage.getByShop(shopId));
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.id === user?.id) { toast.error('Cannot delete your own account'); return; }
    userStorage.delete(deleteConfirm.id);
    setStaff(userStorage.getByShop(shopId));
    setDeleteConfirm(null);
    toast.success('Staff deleted');
  };

  return (
    <div>
      <PageHeader
        title="Staff Management"
        subtitle={`${staff.length} staff members`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> Add Staff
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        {['owner', 'manager', 'cashier'].map(role => (
          <div key={role} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="text-xl text-gray-900" style={{ fontWeight: 700 }}>{staff.filter(s => s.role === role).length}</div>
            <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${roleColors[role]}`}>{role.charAt(0).toUpperCase() + role.slice(1)}s</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Staff</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Role</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Phone</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Max Discount</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Joined</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                        {(s.name || 'S').charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{s.name}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${roleColors[s.role] || 'bg-gray-100 text-gray-600'}`}>{s.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.maxDiscountPercent || 0}%</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" disabled={s.id === user?.id && s.role === 'owner'}><Edit2 size={14} /></button>
                      {s.role !== 'owner' && s.id !== user?.id && (
                        <button onClick={() => setDeleteConfirm(s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit Staff' : 'Add Staff'} size="md" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" style={{ fontWeight: 500 }}>Save</button>
        </div>
      }>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Full Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Staff name" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!editUser} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" placeholder="email@shop.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Max Discount %</label>
              <input type="number" min={0} max={100} value={form.maxDiscountPercent} onChange={e => setForm({ ...form, maxDiscountPercent: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Staff" size="sm" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Delete</button>
        </div>
      }>
        <p className="text-gray-600 text-sm">Delete staff member <strong>{deleteConfirm?.name}</strong>?</p>
      </Modal>
    </div>
  );
}