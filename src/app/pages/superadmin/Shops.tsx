import React, { useState, useMemo } from 'react';
import { shopStorage, userStorage, packageStorage } from '../../lib/storage';
import { Shop } from '../../lib/types';
import { formatCurrency, formatDate, isExpired } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, Eye, CheckCircle, XCircle, AlertTriangle, Store } from 'lucide-react';
import { toast } from 'sonner';

const BUSINESS_TYPES = ['Clothing Shop', 'Boutique', 'Fashion Reseller', 'Cosmetics Shop', 'Accessories Shop', 'Small Showroom', 'Online Facebook Seller', 'Other'];

export default function Shops() {
  const [shops, setShops] = useState(() => shopStorage.getAll());
  const [packages] = useState(() => packageStorage.getAll());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editShop, setEditShop] = useState<Shop | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Shop | null>(null);

  const [form, setForm] = useState({
    name: '', ownerName: '', ownerEmail: '', phone: '', email: '',
    address: '', businessType: 'Clothing Shop', packageId: 'pkg_standard',
    monthlyFee: 2000, setupFee: 18000, expiryDate: '', status: 'active' as Shop['status'],
    currency: 'BDT', taxRate: 0, invoicePrefix: 'INV-',
    loyaltyRatio: 0.01, pointValue: 1, ownerId: '',
  });

  const filtered = useMemo(() => {
    return shops.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [shops, search, statusFilter]);

  const openCreate = () => {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    setForm({
      name: '', ownerName: '', ownerEmail: '', phone: '', email: '',
      address: '', businessType: 'Clothing Shop', packageId: 'pkg_standard',
      monthlyFee: 2000, setupFee: 18000, expiryDate: expiry.toISOString().split('T')[0],
      status: 'active', currency: 'BDT', taxRate: 0, invoicePrefix: 'INV-',
      loyaltyRatio: 0.01, pointValue: 1, ownerId: '',
    });
    setEditShop(null);
    setShowModal(true);
  };

  const openEdit = (shop: Shop) => {
    setForm({
      name: shop.name, ownerName: shop.ownerName, ownerEmail: shop.ownerEmail,
      phone: shop.phone, email: shop.email, address: shop.address,
      businessType: shop.businessType, packageId: shop.packageId,
      monthlyFee: shop.monthlyFee, setupFee: shop.setupFee,
      expiryDate: shop.expiryDate.split('T')[0], status: shop.status,
      currency: shop.currency, taxRate: shop.taxRate, invoicePrefix: shop.invoicePrefix,
      loyaltyRatio: shop.loyaltyRatio, pointValue: shop.pointValue, ownerId: shop.ownerId,
    });
    setEditShop(shop);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.ownerName || !form.ownerEmail) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editShop) {
      const updated = shopStorage.update({ ...editShop, ...form, expiryDate: new Date(form.expiryDate).toISOString() });
      setShops(shopStorage.getAll());
      toast.success('Shop updated successfully');
    } else {
      const newShop = shopStorage.create({ ...form, expiryDate: new Date(form.expiryDate).toISOString() });
      // Create owner account
      const ownerEmail = form.ownerEmail;
      const existingUser = userStorage.getByEmail(ownerEmail);
      if (!existingUser) {
        const owner = userStorage.create({
          shopId: newShop.id,
          name: form.ownerName,
          email: ownerEmail,
          password: 'Owner@123',
          role: 'owner',
          phone: form.phone,
          status: 'active',
          maxDiscountPercent: 100,
        });
        // Update shop with ownerId
        shopStorage.update({ ...newShop, ownerId: owner.id });
      } else {
        // Update shop with existing user id
        shopStorage.update({ ...newShop, ownerId: existingUser.id });
      }
      setShops(shopStorage.getAll());
      toast.success('Shop created! Owner password: Owner@123');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    shopStorage.delete(deleteConfirm.id);
    setShops(shopStorage.getAll());
    setDeleteConfirm(null);
    toast.success('Shop deleted');
  };

  const toggleStatus = (shop: Shop, status: Shop['status']) => {
    const updated = shopStorage.update({ ...shop, status });
    setShops(shopStorage.getAll());
    toast.success(`Shop ${status}`);
  };

  const pkg = (id: string) => packages.find(p => p.id === id);

  return (
    <div>
      <PageHeader
        title="Shop Management"
        subtitle={`${shops.length} total shops`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus size={16} /> New Shop
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shops..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Shop</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Owner</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Package</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Monthly Fee</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Expiry</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(shop => (
                <tr key={shop.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Store size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{shop.name}</div>
                        <div className="text-xs text-gray-400">{shop.businessType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{shop.ownerName}</div>
                    <div className="text-xs text-gray-400">{shop.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full capitalize">
                      {pkg(shop.packageId)?.displayName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      shop.status === 'active' ? 'bg-green-50 text-green-700' :
                      shop.status === 'expired' ? 'bg-red-50 text-red-700' :
                      shop.status === 'suspended' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(shop.monthlyFee)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${isExpired(shop.expiryDate) ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatDate(shop.expiryDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {shop.status !== 'active' && (
                        <button onClick={() => toggleStatus(shop, 'active')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Activate">
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {shop.status === 'active' && (
                        <button onClick={() => toggleStatus(shop, 'suspended')} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Suspend">
                          <AlertTriangle size={15} />
                        </button>
                      )}
                      <button onClick={() => openEdit(shop)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirm(shop)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    No shops found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editShop ? 'Edit Shop' : 'Create New Shop'}
        size="xl"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" style={{ fontWeight: 500 }}>
              {editShop ? 'Update Shop' : 'Create Shop'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Shop Name *', key: 'name', type: 'text', placeholder: 'e.g. Maxwear' },
            { label: 'Owner Name *', key: 'ownerName', type: 'text', placeholder: 'Full name' },
            { label: 'Owner Email *', key: 'ownerEmail', type: 'email', placeholder: 'owner@shop.com' },
            { label: 'Phone', key: 'phone', type: 'text', placeholder: '01XXXXXXXXX' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'shop@email.com' },
            { label: 'Invoice Prefix', key: 'invoicePrefix', type: 'text', placeholder: 'INV-' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>{field.label}</label>
              <input
                type={field.type}
                value={(form as any)[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Address</label>
            <input
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Business Type</label>
            <select
              value={form.businessType}
              onChange={e => setForm({ ...form, businessType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Package</label>
            <select
              value={form.packageId}
              onChange={e => {
                const p = packages.find(pk => pk.id === e.target.value);
                setForm({ ...form, packageId: e.target.value, monthlyFee: p?.monthlyFee || 0, setupFee: p?.setupFee || 0 });
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {packages.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Monthly Fee (৳)</label>
            <input
              type="number"
              value={form.monthlyFee}
              onChange={e => setForm({ ...form, monthlyFee: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Expiry Date</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={e => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as Shop['status'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Shop"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              Delete
            </button>
          </div>
        }
      >
        <p className="text-gray-600 text-sm">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}