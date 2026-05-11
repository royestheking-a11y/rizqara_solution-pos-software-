import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productStorage, stockMovementStorage, activityLogStorage } from '../../lib/storage';
import { Product } from '../../lib/types';
import { formatCurrency, formatDateTime, getLowStockProducts, getOutOfStockProducts } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Search, AlertTriangle, Package, Plus, Minus, History } from 'lucide-react';
import { toast } from 'sonner';

export default function Inventory() {
  const { shop, user } = useAuth();
  const shopId = shop?.id || '';
  const [products, setProducts] = useState(() => productStorage.getByShop(shopId));
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustReason, setAdjustReason] = useState('damaged');
  const [adjustVariantId, setAdjustVariantId] = useState('');

  const movements = useMemo(() => stockMovementStorage.getByShop(shopId), [shopId]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchStock = stockFilter === 'all' ||
        (stockFilter === 'low' && p.totalQuantity > 0 && p.totalQuantity <= p.lowStockAlert) ||
        (stockFilter === 'out' && p.totalQuantity === 0) ||
        (stockFilter === 'ok' && p.totalQuantity > p.lowStockAlert);
      return matchSearch && matchStock;
    });
  }, [products, search, stockFilter]);

  const lowStock = getLowStockProducts(products);
  const outOfStock = getOutOfStockProducts(products);
  const totalValue = products.reduce((sum, p) => sum + p.totalQuantity * p.purchasePrice, 0);

  const handleAdjust = () => {
    if (!adjustProduct) return;
    if (adjustQty <= 0 && adjustType !== 'set') { toast.error('Quantity must be > 0'); return; }

    let quantityChange = adjustQty;
    let actionType: any = 'adjusted';

    if (adjustType === 'add') {
      actionType = 'purchase_added';
    } else if (adjustType === 'remove') {
      quantityChange = -adjustQty;
      actionType = adjustReason === 'damaged' ? 'damaged' : 'lost';
    } else {
      // set
      const current = adjustVariantId
        ? adjustProduct.variants.find(v => v.id === adjustVariantId)?.quantity || 0
        : adjustProduct.totalQuantity;
      quantityChange = adjustQty - current;
    }

    if (adjustVariantId) {
      productStorage.updateVariantStock(adjustProduct.id, adjustVariantId, quantityChange);
    } else {
      productStorage.updateStock(adjustProduct.id, quantityChange);
    }

    stockMovementStorage.create({
      shopId,
      productId: adjustProduct.id,
      variantId: adjustVariantId || undefined,
      productName: adjustProduct.name,
      action: actionType,
      quantity: quantityChange,
      by: user?.name || '',
      date: new Date().toISOString(),
      note: adjustReason,
    });

    activityLogStorage.create({
      shopId,
      userId: user?.id || '',
      userName: user?.name || 'Unknown',
      action: 'Stock Manually Adjusted',
      details: `Product: ${adjustProduct.name}\nChange: ${quantityChange > 0 ? '+' : ''}${quantityChange}\nReason: ${adjustReason}\nType: ${adjustType}`
    });

    setProducts(productStorage.getByShop(shopId));
    setAdjustProduct(null);
    setAdjustQty(0);
    setAdjustVariantId('');
    toast.success('Stock adjusted');
  };

  const productMovements = historyProduct
    ? movements.filter(m => m.productId === historyProduct.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div>
      <PageHeader title="Inventory Management" subtitle="Stock tracking and adjustments" />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center mb-2">
            <Package size={16} className="text-white" />
          </div>
          <div className="text-2xl text-blue-700 mb-0.5" style={{ fontWeight: 800 }}>{products.length}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Total Products</div>
          <div className="text-xs text-gray-400 mt-1">{formatCurrency(totalValue)} value</div>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center mb-2">
            <Plus size={16} className="text-white" />
          </div>
          <div className="text-2xl text-green-700 mb-0.5" style={{ fontWeight: 800 }}>{products.filter(p => p.totalQuantity > p.lowStockAlert).length}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Well Stocked</div>
        </div>
        <div className="bg-white rounded-2xl border border-yellow-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center mb-2">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="text-2xl text-yellow-600 mb-0.5" style={{ fontWeight: 800 }}>{lowStock.length}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Low Stock</div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center mb-2">
            <Minus size={16} className="text-white" />
          </div>
          <div className="text-2xl text-red-600 mb-0.5" style={{ fontWeight: 800 }}>{outOfStock.length}</div>
          <div className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Out of Stock</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-800" style={{ fontWeight: 600 }}>Low Stock Alert ({lowStock.length} products)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {p.name}: {p.totalQuantity} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white" />
        </div>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">All Products</option>
          <option value="ok">Well Stocked</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Product</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">SKU</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Stock</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Value</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Variants</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Package size={14} className="text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{product.sku}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm px-2 py-0.5 rounded-full ${
                      product.totalQuantity === 0 ? 'bg-red-50 text-red-700' :
                      product.totalQuantity <= product.lowStockAlert ? 'bg-yellow-50 text-yellow-700' :
                      'bg-green-50 text-green-700'
                    }`} style={{ fontWeight: 700 }}>
                      {product.totalQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {product.totalQuantity === 0 ? (
                      <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle size={12} />Out of stock</span>
                    ) : product.totalQuantity <= product.lowStockAlert ? (
                      <span className="flex items-center gap-1 text-xs text-yellow-600"><AlertTriangle size={12} />Low stock</span>
                    ) : (
                      <span className="text-xs text-green-600">✓ OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(product.totalQuantity * product.purchasePrice)}</td>
                  <td className="px-4 py-3">
                    {product.hasVariants ? (
                      <div className="flex flex-wrap gap-1">
                        {product.variants.slice(0, 3).map(v => (
                          <span key={v.id} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {v.color} {v.size}: {v.quantity}
                          </span>
                        ))}
                        {product.variants.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{product.variants.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No variants</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setAdjustProduct(product); setAdjustVariantId(''); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1" title="Adjust Stock">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => setHistoryProduct(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Stock History">
                        <History size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      <Modal open={!!adjustProduct} onClose={() => setAdjustProduct(null)} title={`Adjust Stock — ${adjustProduct?.name}`} size="md" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setAdjustProduct(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleAdjust} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" style={{ fontWeight: 500 }}>Apply Adjustment</button>
        </div>
      }>
        {adjustProduct && (
          <div className="space-y-4">
            {adjustProduct.hasVariants && (
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Select Variant (optional)</label>
                <select value={adjustVariantId} onChange={e => setAdjustVariantId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All (total stock)</option>
                  {adjustProduct.variants.map(v => (
                    <option key={v.id} value={v.id}>{v.color} {v.size} — Current: {v.quantity}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'add', label: '+ Add Stock', color: 'bg-green-50 border-green-300 text-green-700' },
                  { value: 'remove', label: '- Remove Stock', color: 'bg-red-50 border-red-300 text-red-700' },
                  { value: 'set', label: 'Set Quantity', color: 'bg-blue-50 border-blue-300 text-blue-700' },
                ].map(type => (
                  <button key={type.value} onClick={() => setAdjustType(type.value as any)} className={`py-2 px-3 rounded-lg border-2 text-xs transition-all ${adjustType === type.value ? type.color : 'bg-white border-gray-200 text-gray-600'}`}>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>
                {adjustType === 'set' ? 'New Quantity' : 'Quantity'}
              </label>
              <input type="number" min={0} value={adjustQty || ''} onChange={e => setAdjustQty(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
            </div>
            {adjustType === 'remove' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Reason</label>
                <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="damaged">Damaged</option>
                  <option value="lost">Lost</option>
                  <option value="return">Return</option>
                  <option value="correction">Stock Correction</option>
                </select>
              </div>
            )}
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              Current stock: <span style={{ fontWeight: 700 }}>{
                adjustVariantId
                  ? adjustProduct.variants.find(v => v.id === adjustVariantId)?.quantity || 0
                  : adjustProduct.totalQuantity
              }</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Stock History Modal */}
      <Modal open={!!historyProduct} onClose={() => setHistoryProduct(null)} title={`Stock History — ${historyProduct?.name}`} size="lg">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {productMovements.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">No movement history</p>
          ) : (
            productMovements.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.quantity > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {m.quantity > 0 ? <Plus size={14} className="text-green-600" /> : <Minus size={14} className="text-red-600" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-800" style={{ fontWeight: 500 }}>{m.action.replace('_', ' ')}</div>
                  <div className="text-[10px] text-gray-400">
                    {m.color && `${m.color} ${m.size} · `}By {m.by} · {formatDateTime(m.date)}
                  </div>
                </div>
                <span className={`text-sm ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontWeight: 700 }}>
                  {m.quantity > 0 ? '+' : ''}{m.quantity}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}