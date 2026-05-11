import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { returnStorage, productStorage, saleStorage, stockMovementStorage } from '../../lib/storage';
import { Return, ReturnType } from '../../lib/types';
import { formatCurrency, formatDateTime, RETURN_REASONS } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Eye, CheckCircle, XCircle, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

const returnTypeLabels: Record<ReturnType, string> = {
  full_return: 'Full Return',
  partial_return: 'Partial Return',
  exchange: 'Exchange',
  store_credit: 'Store Credit',
};

export default function Returns() {
  const { shop, user } = useAuth();
  const shopId = shop?.id || '';
  const [returns, setReturns] = useState(() => returnStorage.getByShop(shopId));
  const [showModal, setShowModal] = useState(false);
  const [viewReturn, setViewReturn] = useState<Return | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    invoiceNumber: '',
    customerName: '',
    type: 'full_return' as ReturnType,
    reason: RETURN_REASONS[0],
    refundAmount: 0,
    refundMethod: 'cash' as any,
    returnedToStock: true,
    note: '',
    items: [] as any[],
  });

  // Find sale by invoice number
  const [foundSale, setFoundSale] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const searchSale = () => {
    const sale = saleStorage.getByShop(shopId).find(s => s.invoiceNumber === form.invoiceNumber);
    if (sale) {
      setFoundSale(sale);
      toast.success('Invoice found');
    } else {
      setFoundSale(null);
      toast.error('Invoice not found');
    }
  };

  const filteredReturns = useMemo(() => {
    return returns.filter(r =>
      (r.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.customerName || '').toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [returns, search]);

  const handleCreateReturn = () => {
    if (!form.reason) { toast.error('Reason required'); return; }
    if (form.refundAmount < 0) { toast.error('Invalid refund amount'); return; }

    const returnItems = foundSale ? foundSale.items
      .filter((item: any) => (selectedItems[item.id] || 0) > 0)
      .map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        color: item.color,
        size: item.size,
        quantity: selectedItems[item.id] || 0,
        unitPrice: item.unitPrice,
        total: item.unitPrice * (selectedItems[item.id] || 0),
      })) : [];

    const newReturn = returnStorage.create({
      shopId,
      saleId: foundSale?.id,
      invoiceNumber: form.invoiceNumber,
      customerName: form.customerName || foundSale?.customerName,
      type: form.type,
      items: returnItems,
      reason: form.reason,
      refundAmount: form.refundAmount,
      refundMethod: form.refundMethod,
      returnedToStock: form.returnedToStock,
      approvedBy: user?.name || '',
      status: user?.role === 'cashier' ? 'pending' : 'approved',
    });

    // Update stock if returned to stock
    if (form.returnedToStock && user?.role !== 'cashier') {
      returnItems.forEach((item: any) => {
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
          action: 'returned',
          quantity: item.quantity,
          by: user?.name || '',
          date: new Date().toISOString(),
          note: `Return: ${form.reason}`,
        });
      });
    }

    setReturns(returnStorage.getByShop(shopId));
    setShowModal(false);
    setFoundSale(null);
    setSelectedItems({});
    setForm({ invoiceNumber: '', customerName: '', type: 'full_return', reason: RETURN_REASONS[0], refundAmount: 0, refundMethod: 'cash', returnedToStock: true, note: '', items: [] });
    toast.success(user?.role === 'cashier' ? 'Return request created (pending approval)' : 'Return processed');
  };

  const handleApprove = (ret: Return) => {
    returnStorage.update({ ...ret, status: 'approved' });
    if (ret.returnedToStock) {
      ret.items.forEach(item => {
        if (item.variantId) {
          productStorage.updateVariantStock(item.productId, item.variantId, item.quantity);
        } else {
          productStorage.updateStock(item.productId, item.quantity);
        }
      });
    }
    setReturns(returnStorage.getByShop(shopId));
    toast.success('Return approved');
  };

  const handleReject = (ret: Return) => {
    returnStorage.update({ ...ret, status: 'rejected' });
    setReturns(returnStorage.getByShop(shopId));
    toast.success('Return rejected');
  };

  return (
    <div>
      <PageHeader
        title="Returns & Exchanges"
        subtitle={`${returns.length} total returns`}
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> New Return
          </button>
        }
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by invoice number or customer..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Invoice</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Type</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Reason</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Refund</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Date</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map(ret => (
                <tr key={ret.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3 text-sm text-blue-600" style={{ fontWeight: 600 }}>{ret.invoiceNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ret.customerName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{returnTypeLabels[ret.type]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{ret.reason}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(ret.refundAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ret.status === 'approved' ? 'bg-green-50 text-green-700' :
                      ret.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>{ret.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(ret.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setViewReturn(ret)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                      {ret.status === 'pending' && user?.role !== 'cashier' && (
                        <>
                          <button onClick={() => handleApprove(ret)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle size={14} /></button>
                          <button onClick={() => handleReject(ret)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No returns found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Return Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setFoundSale(null); setSelectedItems({}); }} title="New Return / Exchange" size="xl" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => { setShowModal(false); setFoundSale(null); setSelectedItems({}); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleCreateReturn} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" style={{ fontWeight: 500 }}>Process Return</button>
        </div>
      }>
        <div className="space-y-4">
          {/* Search Invoice */}
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Invoice Number</label>
            <div className="flex gap-2">
              <input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="e.g. OR-0001" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={searchSale} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700">Find Invoice</button>
            </div>
          </div>

          {/* Found Sale Items */}
          {foundSale && (
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">Customer: {foundSale.customerName || 'Walk-in'} · {new Date(foundSale.createdAt).toLocaleDateString()}</div>
              <div className="space-y-2">
                {foundSale.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 text-sm text-gray-800">{item.productName} {item.color && `(${item.color} ${item.size})`}</div>
                    <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Return:</span>
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={selectedItems[item.id] || ''}
                        onChange={e => setSelectedItems({ ...selectedItems, [item.id]: Math.min(Number(e.target.value), item.quantity) })}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Return Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ReturnType })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(returnTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Reason</label>
              <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {RETURN_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Refund Amount (৳)</label>
              <input type="number" value={form.refundAmount || ''} onChange={e => setForm({ ...form, refundAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Customer Name</label>
              <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Customer name" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              onClick={() => setForm({ ...form, returnedToStock: !form.returnedToStock })}
              className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${form.returnedToStock ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${form.returnedToStock ? 'left-5' : 'left-0.5'}`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
            </div>
            <span className="text-sm text-gray-700">Return items to stock</span>
          </div>
        </div>
      </Modal>

      {/* View Return Modal */}
      {viewReturn && (
        <Modal open={!!viewReturn} onClose={() => setViewReturn(null)} title="Return Details" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Invoice:</span> {viewReturn.invoiceNumber || '-'}</div>
              <div><span className="text-gray-500">Type:</span> {returnTypeLabels[viewReturn.type]}</div>
              <div><span className="text-gray-500">Customer:</span> {viewReturn.customerName || '-'}</div>
              <div><span className="text-gray-500">Reason:</span> {viewReturn.reason}</div>
              <div><span className="text-gray-500">Approved by:</span> {viewReturn.approvedBy}</div>
              <div><span className="text-gray-500">Status:</span> <span className={viewReturn.status === 'approved' ? 'text-green-600' : viewReturn.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'} style={{ fontWeight: 600 }}>{viewReturn.status}</span></div>
            </div>
            {viewReturn.items.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Returned Items</p>
                <div className="space-y-1">
                  {viewReturn.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span>{item.productName} {item.color && `(${item.color} ${item.size})`} × {item.quantity}</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500">Refund Amount</div>
              <div className="text-xl text-blue-700" style={{ fontWeight: 800 }}>{formatCurrency(viewReturn.refundAmount)}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}