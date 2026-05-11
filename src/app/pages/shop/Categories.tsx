import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { categoryStorage, brandStorage } from '../../lib/storage';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Tag, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

export default function Categories() {
  const { shop } = useAuth();
  const shopId = shop?.id || '';
  const [categories, setCategories] = useState(() => categoryStorage.getByShop(shopId));
  const [brands, setBrands] = useState(() => brandStorage.getByShop(shopId));
  const [showCatModal, setShowCatModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [editBrand, setEditBrand] = useState<any>(null);
  const [catName, setCatName] = useState('');
  const [brandName, setBrandName] = useState('');

  const saveCat = () => {
    if (!catName) { toast.error('Name required'); return; }
    if (editCat) {
      categoryStorage.update({ ...editCat, name: catName });
      toast.success('Category updated');
    } else {
      categoryStorage.create({ shopId, name: catName });
      toast.success('Category created');
    }
    setCategories(categoryStorage.getByShop(shopId));
    setShowCatModal(false);
    setCatName('');
    setEditCat(null);
  };

  const deleteCat = (id: string) => {
    categoryStorage.delete(id);
    setCategories(categoryStorage.getByShop(shopId));
    toast.success('Deleted');
  };

  const saveBrand = () => {
    if (!brandName) { toast.error('Name required'); return; }
    if (editBrand) {
      brandStorage.update({ ...editBrand, name: brandName });
      toast.success('Brand updated');
    } else {
      brandStorage.create({ shopId, name: brandName });
      toast.success('Brand created');
    }
    setBrands(brandStorage.getByShop(shopId));
    setShowBrandModal(false);
    setBrandName('');
    setEditBrand(null);
  };

  const deleteBrand = (id: string) => {
    brandStorage.delete(id);
    setBrands(brandStorage.getByShop(shopId));
    toast.success('Deleted');
  };

  return (
    <div>
      <PageHeader title="Categories & Brands" subtitle="Organize your products" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Categories */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Tag size={15} className="text-white" />
              </div>
              <h3 className="text-gray-900" style={{ fontWeight: 600 }}>Categories ({categories.length})</h3>
            </div>
            <button
              onClick={() => { setCatName(''); setEditCat(null); setShowCatModal(true); }}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
              style={{ fontWeight: 600 }}
            >
              <Plus size={13} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-50 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Tag size={12} className="text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{cat.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditCat(cat); setCatName(cat.name); setShowCatModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => deleteCat(cat.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <Tag size={20} className="text-blue-400" />
                </div>
                <p className="text-gray-400 text-sm">No categories yet</p>
                <p className="text-gray-300 text-xs mt-1">Add your first category</p>
              </div>
            )}
          </div>
        </div>

        {/* Brands */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <Bookmark size={15} className="text-white" />
              </div>
              <h3 className="text-gray-900" style={{ fontWeight: 600 }}>Brands ({brands.length})</h3>
            </div>
            <button
              onClick={() => { setBrandName(''); setEditBrand(null); setShowBrandModal(true); }}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-xl text-xs hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20"
              style={{ fontWeight: 600 }}
            >
              <Plus size={13} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {brands.map(brand => (
              <div key={brand.id} className="flex items-center justify-between p-3 bg-purple-50/50 rounded-xl border border-purple-50 hover:bg-purple-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Bookmark size={12} className="text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{brand.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditBrand(brand); setBrandName(brand.name); setShowBrandModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => deleteBrand(brand.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {brands.length === 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                  <Bookmark size={20} className="text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm">No brands yet</p>
                <p className="text-gray-300 text-xs mt-1">Add your first brand</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title={editCat ? 'Edit Category' : 'Add Category'} size="sm" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowCatModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={saveCat} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm" style={{ fontWeight: 600 }}>Save</button>
        </div>
      }>
        <div>
          <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>Category Name *</label>
          <input
            value={catName}
            onChange={e => setCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveCat()}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
            placeholder="e.g. Men's Shirt"
            autoFocus
          />
        </div>
      </Modal>

      <Modal open={showBrandModal} onClose={() => setShowBrandModal(false)} title={editBrand ? 'Edit Brand' : 'Add Brand'} size="sm" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowBrandModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={saveBrand} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors shadow-sm" style={{ fontWeight: 600 }}>Save</button>
        </div>
      }>
        <div>
          <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>Brand Name *</label>
          <input
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveBrand()}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
            placeholder="e.g. Cotton Comfort"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
