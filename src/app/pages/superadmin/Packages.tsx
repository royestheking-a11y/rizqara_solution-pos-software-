import React, { useState } from 'react';
import { packageStorage, shopStorage } from '../../lib/storage';
import { Package } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function Packages() {
  const [packages, setPackages] = useState(() => packageStorage.getAll());
  const [showModal, setShowModal] = useState(false);
  const [editPkg, setEditPkg] = useState<Package | null>(null);
  const [form, setForm] = useState({
    name: 'starter' as Package['name'],
    displayName: '',
    maxProducts: 500,
    maxStaff: 1,
    monthlyFee: 1000,
    setupFee: 10000,
    features: ['Basic Sales', 'Invoice', 'Daily Report'],
  });
  const [featureInput, setFeatureInput] = useState('');

  const openCreate = () => {
    setForm({ name: 'starter', displayName: '', maxProducts: 500, maxStaff: 1, monthlyFee: 1000, setupFee: 10000, features: [] });
    setEditPkg(null);
    setShowModal(true);
  };

  const openEdit = (pkg: Package) => {
    setForm({ name: pkg.name, displayName: pkg.displayName, maxProducts: pkg.maxProducts, maxStaff: pkg.maxStaff, monthlyFee: pkg.monthlyFee, setupFee: pkg.setupFee, features: [...pkg.features] });
    setEditPkg(pkg);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.displayName) {
      toast.error('Package name required');
      return;
    }
    const id = editPkg?.id || `pkg_${Date.now()}`;
    packageStorage.save({ id, ...form });

    // Sync price changes to all shops using this package
    const allShops = shopStorage.getAll();
    let syncCount = 0;
    allShops.forEach(shop => {
      if (shop.packageId === id) {
        shopStorage.update({
          ...shop,
          monthlyFee: form.monthlyFee,
          setupFee: form.setupFee
        });
        syncCount++;
      }
    });

    setPackages(packageStorage.getAll());
    setShowModal(false);
    toast.success(
      editPkg 
        ? `Package updated and synced to ${syncCount} shops` 
        : 'Package created'
    );
  };

  const handleDelete = (id: string) => {
    packageStorage.delete(id);
    setPackages(packageStorage.getAll());
    toast.success('Package deleted');
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm({ ...form, features: [...form.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const removeFeature = (idx: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  const pkgColors: Record<string, string> = {
    starter: 'from-gray-500 to-gray-600',
    standard: 'from-blue-600 to-blue-700',
    premium: 'from-[#D4A853] to-[#B8891F]',
  };

  return (
    <div>
      <PageHeader
        title="Packages"
        subtitle="Manage subscription packages"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> New Package
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`bg-gradient-to-r ${pkgColors[pkg.name] || 'from-gray-500 to-gray-600'} p-5 text-white`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wide opacity-80">{pkg.name} package</span>
                {pkg.name === 'premium' && <Star size={16} className="text-white" fill="white" />}
              </div>
              <div className="text-2xl" style={{ fontWeight: 700 }}>{formatCurrency(pkg.monthlyFee)}</div>
              <div className="text-xs opacity-80">/month</div>
              <div className="text-sm mt-1 opacity-90">Setup: {formatCurrency(pkg.setupFee)}</div>
            </div>
            <div className="p-5">
              <h3 className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>{pkg.displayName}</h3>
              <div className="text-xs text-gray-500 mb-3">
                {pkg.maxProducts === -1 ? 'Unlimited' : pkg.maxProducts} products · {pkg.maxStaff} staff
              </div>
              <ul className="space-y-1.5 mb-4">
                {(pkg.features || []).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button onClick={() => openEdit(pkg)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1">
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(pkg.id)} className="px-3 py-2 border border-red-200 rounded-lg text-xs text-red-600 hover:bg-red-50 flex items-center gap-1">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editPkg ? 'Edit Package' : 'Create Package'}
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" style={{ fontWeight: 500 }}>Save</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Package Type</label>
              <select value={form.name} onChange={e => setForm({ ...form, name: e.target.value as Package['name'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="starter">Starter</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Display Name</label>
              <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Standard" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Monthly Fee (৳)</label>
              <input type="number" value={form.monthlyFee} onChange={e => setForm({ ...form, monthlyFee: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Setup Fee (৳)</label>
              <input type="number" value={form.setupFee} onChange={e => setForm({ ...form, setupFee: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Max Products (-1 = unlimited)</label>
              <input type="number" value={form.maxProducts} onChange={e => setForm({ ...form, maxProducts: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Max Staff</label>
              <input type="number" value={form.maxStaff} onChange={e => setForm({ ...form, maxStaff: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-2" style={{ fontWeight: 500 }}>Features</label>
            <div className="flex gap-2 mb-2">
              <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFeature()} placeholder="Add a feature..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addFeature} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
            </div>
            <div className="space-y-1">
              {form.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <CheckCircle size={13} className="text-green-500" />
                  <span className="flex-1 text-xs text-gray-700">{f}</span>
                  <button onClick={() => removeFeature(i)} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}