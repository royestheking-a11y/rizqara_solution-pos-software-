import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { customerStorage } from '../../lib/storage';
import { Customer } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, Users, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const { shop } = useAuth();
  const shopId = shop?.id || '';
  const [customers, setCustomers] = useState(() => customerStorage.getByShop(shopId));
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });

  const filtered = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    ).sort((a, b) => b.totalPurchase - a.totalPurchase);
  }, [customers, search]);

  const openCreate = () => {
    setForm({ name: '', phone: '', email: '', address: '', notes: '' });
    setEditCustomer(null);
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', notes: c.notes || '' });
    setEditCustomer(c);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    if (editCustomer) {
      customerStorage.update({ ...editCustomer, ...form });
      toast.success('Customer updated');
    } else {
      customerStorage.create({ shopId, ...form, totalPurchase: 0, totalDue: 0, points: 0 });
      toast.success('Customer added');
    }
    setCustomers(customerStorage.getByShop(shopId));
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    customerStorage.delete(deleteConfirm.id);
    setCustomers(customerStorage.getByShop(shopId));
    setDeleteConfirm(null);
    toast.success('Customer deleted');
  };

  const totalDue = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalPurchase, 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> Add Customer
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center mb-3">
            <Users size={16} className="text-white" />
          </div>
          <div className="text-2xl text-blue-700 mb-0.5" style={{ fontWeight: 800 }}>{customers.length}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Total Customers</div>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center mb-3">
            <Phone size={16} className="text-white" />
          </div>
          <div className="text-2xl text-green-700 mb-0.5" style={{ fontWeight: 800 }}>{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Total Revenue</div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center mb-3">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="text-2xl text-red-600 mb-0.5" style={{ fontWeight: 800 }}>{formatCurrency(totalDue)}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Total Due</div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Phone</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Address</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Total Purchase</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Due</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Points</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Last Purchase</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                        {(c.name || 'C').charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{c.name}</div>
                        {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.address || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(c.totalPurchase)}</td>
                  <td className="px-4 py-3 text-right">
                    {c.totalDue > 0 ? (
                      <span className="text-sm text-red-600" style={{ fontWeight: 600 }}>{formatCurrency(c.totalDue)}</span>
                    ) : (
                      <span className="text-xs text-green-600">Clear</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black text-blue-600">{c.points || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirm(c)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editCustomer ? 'Edit Customer' : 'Add Customer'} size="md" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" style={{ fontWeight: 500 }}>Save</button>
        </div>
      }>
        <div className="space-y-3">
          {[
            { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Customer name' },
            { label: 'Phone *', key: 'phone', type: 'text', placeholder: '01XXXXXXXXX' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'email@example.com' },
            { label: 'Address', key: 'address', type: 'text', placeholder: 'Customer address' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>{field.label}</label>
              <input type={field.type} value={(form as any)[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Customer notes..." />
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Customer" size="sm" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Delete</button>
        </div>
      }>
        <p className="text-gray-600 text-sm">Delete customer <strong>{deleteConfirm?.name}</strong>?</p>
      </Modal>
    </div>
  );
}