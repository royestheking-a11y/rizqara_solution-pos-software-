import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supplierStorage } from '../../lib/storage';
import { Supplier } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Search, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function Suppliers() {
  const { shop } = useAuth();
  const shopId = shop?.id || '';
  const [suppliers, setSuppliers] = useState(() => supplierStorage.getByShop(shopId));
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', company: '', address: '' });

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.company.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: '', phone: '', company: '', address: '' });
    setEditSupplier(null);
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, phone: s.phone, company: s.company, address: s.address });
    setEditSupplier(s);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name) { toast.error('Supplier name required'); return; }
    if (editSupplier) {
      supplierStorage.update({ ...editSupplier, ...form });
      toast.success('Supplier updated');
    } else {
      supplierStorage.create({ shopId, ...form, totalPurchase: 0, dueAmount: 0 });
      toast.success('Supplier added');
    }
    setSuppliers(supplierStorage.getByShop(shopId));
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    supplierStorage.delete(deleteConfirm.id);
    setSuppliers(supplierStorage.getByShop(shopId));
    setDeleteConfirm(null);
    toast.success('Supplier deleted');
  };

  const totalDue = suppliers.reduce((sum, s) => sum + s.dueAmount, 0);
  const totalPurchase = suppliers.reduce((sum, s) => sum + s.totalPurchase, 0);

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} suppliers`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25" style={{ fontWeight: 600 }}>
            <Plus size={16} /> Add Supplier
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center mb-3">
            <Truck size={16} className="text-white" />
          </div>
          <div className="text-2xl text-blue-700 mb-0.5" style={{ fontWeight: 800 }}>{formatCurrency(totalPurchase)}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Total Purchases</div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center mb-3">
            <Truck size={16} className="text-white" />
          </div>
          <div className="text-2xl text-red-600 mb-0.5" style={{ fontWeight: 800 }}>{formatCurrency(totalDue)}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Total Due</div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Truck size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{supplier.name}</div>
                  <div className="text-xs text-gray-400">{supplier.company}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(supplier)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={13} /></button>
                <button onClick={() => setDeleteConfirm(supplier)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Phone:</span>
                <span className="text-gray-700">{supplier.phone || '-'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Purchase:</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(supplier.totalPurchase)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Due Amount:</span>
                <span className={supplier.dueAmount > 0 ? 'text-red-600' : 'text-green-600'} style={{ fontWeight: 600 }}>
                  {supplier.dueAmount > 0 ? formatCurrency(supplier.dueAmount) : 'Clear'}
                </span>
              </div>
              {supplier.address && (
                <div className="text-xs text-gray-400 truncate">{supplier.address}</div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">No suppliers found</div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editSupplier ? 'Edit Supplier' : 'Add Supplier'} size="md" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm" style={{ fontWeight: 600 }}>Save</button>
        </div>
      }>
        <div className="space-y-3">
          {[
            { label: 'Supplier Name *', key: 'name', placeholder: 'Supplier name' },
            { label: 'Phone', key: 'phone', placeholder: '01XXXXXXXXX' },
            { label: 'Company', key: 'company', placeholder: 'Company name' },
            { label: 'Address', key: 'address', placeholder: 'Full address' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400" />
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Supplier" size="sm" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Delete</button>
        </div>
      }>
        <p className="text-gray-600 text-sm">Delete supplier <strong>{deleteConfirm?.name}</strong>?</p>
      </Modal>
    </div>
  );
}