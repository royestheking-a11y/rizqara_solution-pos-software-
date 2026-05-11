import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productStorage, categoryStorage, brandStorage, supplierStorage, activityLogStorage } from '../../lib/storage';
import { notificationService } from '../../lib/notificationService';
import { Product, ProductVariant } from '../../lib/types';
import { formatCurrency, generateSKU } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, Package, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['Maroon', 'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Navy', 'Grey', 'Brown', 'Orange', 'Purple', 'Beige'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40'];

export default function Products() {
  const { shop, user } = useAuth();
  const shopId = shop?.id || '';

  const [products, setProducts] = useState(() => productStorage.getByShop(shopId));
  const [categories] = useState(() => categoryStorage.getByShop(shopId));
  const [brands] = useState(() => brandStorage.getByShop(shopId));
  const [suppliers] = useState(() => supplierStorage.getByShop(shopId));

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '', categoryId: '', brandId: '', sku: '', barcode: '',
    purchasePrice: 0, sellingPrice: 0, discountPrice: 0,
    supplierId: '', description: '', status: 'active' as 'active' | 'inactive',
    lowStockAlert: 5, hasVariants: false,
  });

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [simpleQty, setSimpleQty] = useState(0);
  const [variantColor, setVariantColor] = useState('');
  const [variantSize, setVariantSize] = useState('');
  const [variantQty, setVariantQty] = useState(0);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'all' || p.categoryId === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const openCreate = () => {
    setForm({
      name: '', categoryId: categories[0]?.id || '', brandId: '', sku: generateSKU(),
      barcode: '', purchasePrice: 0, sellingPrice: 0, discountPrice: 0,
      supplierId: '', description: '', status: 'active', lowStockAlert: 5, hasVariants: false,
    });
    setVariants([]);
    setSimpleQty(0);
    setEditProduct(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name, categoryId: product.categoryId, brandId: product.brandId || '',
      sku: product.sku, barcode: product.barcode || '', purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice, discountPrice: product.discountPrice || 0,
      supplierId: product.supplierId || '', description: product.description || '',
      status: product.status, lowStockAlert: product.lowStockAlert, hasVariants: product.hasVariants,
    });
    setVariants(product.variants.map(v => ({ ...v })));
    setSimpleQty(product.totalQuantity);
    setEditProduct(product);
    setShowModal(true);
  };

  const addVariant = () => {
    if (!variantColor && !variantSize) { toast.error('Select color or size'); return; }
    const existing = variants.find(v => v.color === variantColor && v.size === variantSize);
    if (existing) { toast.error('Variant already exists'); return; }
    const newVariant: ProductVariant = {
      id: `v_${Date.now()}`,
      productId: editProduct?.id || '',
      shopId,
      color: variantColor,
      size: variantSize,
      quantity: variantQty,
    };
    setVariants([...variants, newVariant]);
    setVariantColor('');
    setVariantSize('');
    setVariantQty(0);
  };

  const removeVariant = (id: string) => setVariants(variants.filter(v => v.id !== id));

  const handleSave = () => {
    if (!form.name || !form.categoryId) { toast.error('Name and category required'); return; }
    if (form.sellingPrice <= 0) { toast.error('Selling price required'); return; }

    const totalQuantity = form.hasVariants
      ? variants.reduce((sum, v) => sum + v.quantity, 0)
      : simpleQty;

    const productData = {
      shopId,
      ...form,
      brandId: form.brandId || undefined,
      supplierId: form.supplierId || undefined,
      discountPrice: form.discountPrice > 0 ? form.discountPrice : undefined,
      variants: form.hasVariants ? variants.map(v => ({ ...v, productId: editProduct?.id || 'new' })) : [],
      totalQuantity,
    };

    if (editProduct) {
      // Check for sensitive changes
      let changes = [];
      if (editProduct.sellingPrice !== form.sellingPrice) {
        changes.push(`Selling Price: ${editProduct.sellingPrice} ৳ -> ${form.sellingPrice} ৳`);
      }
      if (editProduct.purchasePrice !== form.purchasePrice) {
        changes.push(`Purchase Price: ${editProduct.purchasePrice} ৳ -> ${form.purchasePrice} ৳`);
      }
      if (editProduct.totalQuantity !== totalQuantity) {
        changes.push(`Stock: ${editProduct.totalQuantity} -> ${totalQuantity}`);
      }

      productStorage.update({ ...editProduct, ...productData });
      
      if (changes.length > 0) {
        activityLogStorage.create({
          shopId,
          userId: user?.id || '',
          userName: user?.name || 'Owner',
          action: 'Product Updated',
          details: `Product: ${editProduct.name}\n${changes.join('\n')}`
        });
      }
      toast.success('Product updated');
    } else {
      productStorage.create(productData);
      activityLogStorage.create({
        shopId,
        userId: user?.id || '',
        userName: user?.name || 'Owner',
        action: 'Product Created',
        details: `Product: ${form.name}\nInitial Stock: ${totalQuantity}`
      });
      toast.success('Product created');
    }
    const updatedList = productStorage.getByShop(shopId);
    setProducts(updatedList);
    
    // Check for low stock alert
    const p = updatedList.find(x => x.sku === form.sku);
    if (p) notificationService.checkLowStock(shopId, p);

    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    productStorage.delete(deleteConfirm.id);
    activityLogStorage.create({
      shopId,
      userId: user?.id || '',
      userName: user?.name || 'Owner',
      action: 'Product Deleted',
      details: `Product: ${deleteConfirm.name}\nSKU: ${deleteConfirm.sku}`
    });
    setProducts(productStorage.getByShop(shopId));
    setDeleteConfirm(null);
    toast.success('Product deleted');
  };

  const toggleStatus = (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' as const : 'active' as const;
    const updated = { ...product, status: newStatus };
    productStorage.update(updated);
    activityLogStorage.create({
      shopId,
      userId: user?.id || '',
      userName: user?.name || 'Owner',
      action: 'Product Status Changed',
      details: `Product: ${product.name}\nStatus: ${product.status} -> ${newStatus}`
    });
    setProducts(productStorage.getByShop(shopId));
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '-';

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} total products in catalog`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 shadow-sm transition-colors" style={{ fontWeight: 600 }}>
            <Plus size={15} /> Add Product
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
          <div className="text-2xl text-blue-700 mb-0.5" style={{ fontWeight: 800 }}>{products.filter(p => p.status === 'active').length}</div>
          <div className="text-gray-500 text-xs" style={{ fontWeight: 500 }}>Active</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
          <div className="text-2xl text-gray-400 mb-0.5" style={{ fontWeight: 800 }}>{products.filter(p => p.status === 'inactive').length}</div>
          <div className="text-gray-500 text-xs" style={{ fontWeight: 500 }}>Inactive</div>
        </div>
        <div className="bg-white rounded-2xl border border-yellow-100 p-4 shadow-sm text-center">
          <div className="text-2xl text-yellow-600 mb-0.5" style={{ fontWeight: 800 }}>{products.filter(p => p.totalQuantity <= p.lowStockAlert && p.totalQuantity > 0).length}</div>
          <div className="text-gray-500 text-xs" style={{ fontWeight: 500 }}>Low Stock</div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm text-center">
          <div className="text-2xl text-red-600 mb-0.5" style={{ fontWeight: 800 }}>{products.filter(p => p.totalQuantity === 0).length}</div>
          <div className="text-gray-500 text-xs" style={{ fontWeight: 500 }}>Out of Stock</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..." className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-400 px-5 py-3.5">Product</th>
                <th className="text-left text-xs text-gray-400 px-4 py-3.5 hidden md:table-cell">Category</th>
                <th className="text-right text-xs text-gray-400 px-4 py-3.5 hidden lg:table-cell">Purchase</th>
                <th className="text-right text-xs text-gray-400 px-4 py-3.5">Selling</th>
                <th className="text-right text-xs text-gray-400 px-4 py-3.5 hidden lg:table-cell">Margin</th>
                <th className="text-center text-xs text-gray-400 px-4 py-3.5">Stock</th>
                <th className="text-center text-xs text-gray-400 px-4 py-3.5">Status</th>
                <th className="text-right text-xs text-gray-400 px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const margin = product.purchasePrice > 0
                  ? Math.round(((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100)
                  : 0;
                return (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{product.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{product.sku} {product.hasVariants ? '· Variants' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full" style={{ fontWeight: 500 }}>
                        {getCategoryName(product.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{formatCurrency(product.purchasePrice)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{formatCurrency(product.sellingPrice)}</div>
                      {product.discountPrice && (
                        <div className="text-[10px] text-green-600" style={{ fontWeight: 600 }}>Offer: {formatCurrency(product.discountPrice)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      <span className={`text-xs ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-500'}`} style={{ fontWeight: 700 }}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${
                        product.totalQuantity === 0 ? 'bg-red-50 text-red-700 border-red-100' :
                        product.totalQuantity <= product.lowStockAlert ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        'bg-green-50 text-green-700 border-green-100'
                      }`} style={{ fontWeight: 700 }}>
                        {product.totalQuantity === 0 ? 'Out' : product.totalQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => toggleStatus(product)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        product.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                      }`} style={{ fontWeight: 600 }}>
                        {product.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Edit"><Edit2 size={13} /></button>
                        <button onClick={() => setDeleteConfirm(product)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Package size={40} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editProduct ? `Edit: ${editProduct.name}` : 'Add New Product'}
        size="2xl"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 shadow-sm" style={{ fontWeight: 600 }}>
              {editProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Basic Info */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Product Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Premium Cotton Shirt" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Category *</label>
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Brand</label>
                <select value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>SKU</label>
                <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Barcode</label>
                <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Supplier</label>
                <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Low Stock Alert</label>
                <input type="number" value={form.lowStockAlert} onChange={e => setForm({ ...form, lowStockAlert: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Pricing</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Purchase Price (৳) *</label>
                <input type="number" value={form.purchasePrice || ''} onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Selling Price (৳) *</label>
                <input type="number" value={form.sellingPrice || ''} onChange={e => setForm({ ...form, sellingPrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Discount Price (৳)</label>
                <input type="number" value={form.discountPrice || ''} onChange={e => setForm({ ...form, discountPrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide">Stock & Variants</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-600">Has Size/Color Variants</span>
                <div
                  onClick={() => { setForm({ ...form, hasVariants: !form.hasVariants }); setVariants([]); }}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${form.hasVariants ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${form.hasVariants ? 'left-5' : 'left-0.5'}`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                </div>
              </label>
            </div>

            {!form.hasVariants ? (
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Stock Quantity</label>
                <input type="number" value={simpleQty || ''} onChange={e => setSimpleQty(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
            ) : (
              <div>
                {/* Add variant */}
                <div className="flex gap-2 mb-3">
                  <select value={variantColor} onChange={e => setVariantColor(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Color</option>
                    {COLORS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={variantSize} onChange={e => setVariantSize(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Size</option>
                    {SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <input type="number" value={variantQty || ''} onChange={e => setVariantQty(Number(e.target.value))} className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Qty" />
                  <button onClick={addVariant} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
                    <Plus size={14} />
                  </button>
                </div>
                {/* Variant list */}
                {variants.length > 0 && (
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-xs text-gray-500 px-3 py-2 text-left">Color</th>
                          <th className="text-xs text-gray-500 px-3 py-2 text-left">Size</th>
                          <th className="text-xs text-gray-500 px-3 py-2 text-right">Quantity</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map(v => (
                          <tr key={v.id} className="border-t border-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{v.color || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{v.size || '-'}</td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={v.quantity}
                                onChange={e => setVariants(variants.map(vv => vv.id === v.id ? { ...vv, quantity: Number(e.target.value) } : vv))}
                                className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => removeVariant(v.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-xs text-gray-500">Total Stock</td>
                          <td className="px-3 py-2 text-right text-sm text-gray-900" style={{ fontWeight: 700 }}>
                            {variants.reduce((sum, v) => sum + v.quantity, 0)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Product description..." />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Product" size="sm" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Delete</button>
        </div>
      }>
        <p className="text-gray-600 text-sm">Delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}