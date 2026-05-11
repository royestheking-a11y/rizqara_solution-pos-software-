import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { purchaseStorage, supplierStorage, productStorage, stockMovementStorage } from '../../lib/storage';
import { Purchase, PurchaseItem } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Eye, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Purchases() {
  const { shop, user } = useAuth();
  const shopId = shop?.id || '';
  const [purchases, setPurchases] = useState(() => purchaseStorage.getByShop(shopId));
  const [suppliers] = useState(() => supplierStorage.getByShop(shopId));
  const [products] = useState(() => productStorage.getByShop(shopId));
  const [showModal, setShowModal] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    supplierId: suppliers[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    transportCost: 0,
    paidAmount: 0,
    note: '',
  });
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  const totalAmount = items.reduce((sum, i) => sum + i.total, 0) + (form.transportCost || 0);
  const dueAmount = Math.max(0, totalAmount - (form.paidAmount || 0));

  const addItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) { toast.error('Select product'); return; }
    if (itemQty <= 0 || itemPrice <= 0) { toast.error('Invalid qty or price'); return; }

    const variant = product.variants.find(v => v.id === selectedVariantId);
    const item: PurchaseItem = {
      id: `pi_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      variantId: selectedVariantId || undefined,
      color: variant?.color,
      size: variant?.size,
      quantity: itemQty,
      purchasePrice: itemPrice,
      total: itemQty * itemPrice,
    };
    setItems([...items, item]);
    setSelectedProductId('');
    setSelectedVariantId('');
    setItemQty(1);
    setItemPrice(0);
  };

  const handleSave = () => {
    if (!form.supplierId) { toast.error('Select supplier'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }

    const supplier = suppliers.find(s => s.id === form.supplierId);
    const purchase = purchaseStorage.create({
      shopId,
      supplierId: form.supplierId,
      supplierName: supplier?.name || '',
      items,
      totalAmount,
      transportCost: form.transportCost,
      paidAmount: form.paidAmount,
      dueAmount,
      date: new Date(form.date).toISOString(),
      note: form.note,
    });

    // Update stock
    items.forEach(item => {
      if (item.variantId) {
        productStorage.updateVariantStock(item.productId, item.variantId, item.quantity);
      } else {
        productStorage.updateStock(item.productId, item.quantity);
      }
      stockMovementStorage.create({
        shopId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        color: item.color,
        size: item.size,
        action: 'purchase_added',
        quantity: item.quantity,
        by: user?.name || '',
        date: new Date().toISOString(),
      });
    });

    // Update supplier
    if (supplier) {
      supplierStorage.update({
        ...supplier,
        totalPurchase: supplier.totalPurchase + totalAmount,
        dueAmount: supplier.dueAmount + dueAmount,
      });
    }

    setPurchases(purchaseStorage.getByShop(shopId));
    setShowModal(false);
    setItems([]);
    setForm({ supplierId: suppliers[0]?.id || '', date: new Date().toISOString().split('T')[0], transportCost: 0, paidAmount: 0, note: '' });
    toast.success('Purchase recorded & stock updated');
  };

  const filtered = purchases.filter(p =>
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div>
      <PageHeader
        title="Purchase Management"
        subtitle={`${purchases.length} purchase records`}
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25" style={{ fontWeight: 600 }}>
            <Plus size={16} /> New Purchase
          </button>
        }
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search purchases..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Supplier</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Items</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Total</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Paid</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Due</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Date</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(purchase => (
                <tr key={purchase.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3 text-sm text-gray-900" style={{ fontWeight: 500 }}>{purchase.supplierName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{purchase.items.length} items</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(purchase.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-sm text-green-700" style={{ fontWeight: 600 }}>{formatCurrency(purchase.paidAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    {purchase.dueAmount > 0 ? <span className="text-sm text-red-600" style={{ fontWeight: 600 }}>{formatCurrency(purchase.dueAmount)}</span> : <span className="text-xs text-green-600">Clear</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(purchase.date)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewPurchase(purchase)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No purchases found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setItems([]); }} title="New Purchase Entry" size="2xl" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => { setShowModal(false); setItems([]); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm" style={{ fontWeight: 600 }}>Save Purchase</button>
        </div>
      }>
        <div className="space-y-5">
          {/* Header */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Supplier *</label>
              <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400">
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Transport Cost (৳)</label>
              <input type="number" value={form.transportCost || ''} onChange={e => setForm({ ...form, transportCost: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400" placeholder="0" />
            </div>
          </div>

          {/* Add Item */}
          <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
            <h4 className="text-xs text-blue-700 uppercase tracking-wide mb-3" style={{ fontWeight: 700 }}>Add Products</h4>
            <div className="flex gap-2 flex-wrap">
              <select value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); setSelectedVariantId(''); const p = products.find(p => p.id === e.target.value); if (p) setItemPrice(p.purchasePrice); }} className="flex-1 min-w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {selectedProduct?.hasVariants && (
                <select value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)} className="flex-1 min-w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select variant</option>
                  {selectedProduct.variants.map(v => <option key={v.id} value={v.id}>{v.color} {v.size}</option>)}
                </select>
              )}
              <input type="number" value={itemQty || ''} onChange={e => setItemQty(Number(e.target.value))} className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Qty" />
              <input type="number" value={itemPrice || ''} onChange={e => setItemPrice(Number(e.target.value))} className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Price ৳" />
              <button onClick={addItem} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1" style={{ fontWeight: 600 }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-xs text-gray-500 px-3 py-2 text-left">Product</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-center">Qty</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-right">Price</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-t border-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-800">{item.productName} {item.color && `(${item.color} ${item.size})`}</td>
                      <td className="px-3 py-2 text-center text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-sm text-gray-700">{formatCurrency(item.purchasePrice)}</td>
                      <td className="px-3 py-2 text-right text-sm text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-xs text-gray-500">Subtotal</td>
                    <td className="px-3 py-2 text-right text-sm text-gray-900" style={{ fontWeight: 700 }}>{formatCurrency(items.reduce((s, i) => s + i.total, 0))}</td>
                    <td></td>
                  </tr>
                  {form.transportCost > 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-xs text-gray-500">Transport</td>
                      <td className="px-3 py-2 text-right text-sm text-gray-700">{formatCurrency(form.transportCost)}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="px-3 py-2 text-xs text-gray-500" style={{ fontWeight: 700 }}>Grand Total</td>
                    <td className="px-3 py-2 text-right text-sm text-blue-700" style={{ fontWeight: 800 }}>{formatCurrency(totalAmount)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Paid Amount (৳)</label>
              <input type="number" value={form.paidAmount || ''} onChange={e => setForm({ ...form, paidAmount: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400" placeholder="0" />
            </div>
            <div className="flex items-end">
              <div className={`w-full p-3 rounded-xl text-center ${dueAmount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="text-xs text-gray-500 mb-0.5">Due Amount</div>
                <div className={`text-lg ${dueAmount > 0 ? 'text-red-600' : 'text-green-700'}`} style={{ fontWeight: 700 }}>{formatCurrency(dueAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Purchase */}
      {viewPurchase && (
        <Modal open={!!viewPurchase} onClose={() => setViewPurchase(null)} title="Purchase Details" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Supplier:</span> {viewPurchase.supplierName}</div>
              <div><span className="text-gray-500">Date:</span> {formatDate(viewPurchase.date)}</div>
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-xs text-gray-500 px-3 py-2 text-left">Product</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-center">Qty</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-right">Price</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPurchase.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-800">{item.productName} {item.color && `(${item.color} ${item.size})`}</td>
                      <td className="px-3 py-2 text-center text-sm">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-sm">{formatCurrency(item.purchasePrice)}</td>
                      <td className="px-3 py-2 text-right text-sm" style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span style={{ fontWeight: 700 }}>{formatCurrency(viewPurchase.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="text-green-700" style={{ fontWeight: 600 }}>{formatCurrency(viewPurchase.paidAmount)}</span></div>
              {viewPurchase.dueAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Due</span><span className="text-red-600" style={{ fontWeight: 600 }}>{formatCurrency(viewPurchase.dueAmount)}</span></div>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}