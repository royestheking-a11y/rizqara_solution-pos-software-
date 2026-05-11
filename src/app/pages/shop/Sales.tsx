import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { saleStorage, activityLogStorage } from '../../lib/storage';
import { Sale } from '../../lib/types';
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS, calculateSaleProfit, isToday, isThisMonth } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Search, Eye, Printer, FileText, TrendingUp, ShoppingBag, Trash2 } from 'lucide-react';
import { POSInvoice } from '../../components/shop/POSInvoice';
import { RetailInvoice } from '../../components/shop/RetailInvoice';

export default function Sales() {
  const { shop, user } = useAuth();
  const shopId = shop?.id || '';
  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [sales, setSales] = useState(() => saleStorage.getByShop(shopId).filter(s => s.status === 'completed').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [printType, setPrintType] = useState<'thermal' | 'retail'>('retail');
  const [deleteSale, setDeleteSale] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const matchSearch = s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        (s.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        s.cashierName.toLowerCase().includes(search.toLowerCase());
      const matchDate = dateFilter === 'all' ||
        (dateFilter === 'today' && isToday(s.createdAt)) ||
        (dateFilter === 'month' && isThisMonth(s.createdAt));
      return matchSearch && matchDate;
    });
  }, [sales, search, dateFilter]);

  const stats = useMemo(() => {
    const totalSales = filtered.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = filtered.reduce((sum, s) => sum + calculateSaleProfit(s), 0);
    const totalDue = filtered.reduce((sum, s) => sum + s.dueAmount, 0);
    return { totalSales, totalProfit, totalDue };
  }, [filtered]);

  const handleDelete = () => {
    if (!deleteSale) return;
    saleStorage.delete(deleteSale.id);
    activityLogStorage.create({
      shopId,
      userId: user?.id || '',
      userName: user?.name || 'Unknown',
      action: 'Sale Deleted',
      details: `Invoice: ${deleteSale.invoiceNumber}\nCustomer: ${deleteSale.customerName || 'Walk-in'}\nAmount: ${deleteSale.totalAmount}`
    });
    setSales(saleStorage.getByShop(shopId).filter(s => s.status === 'completed').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setDeleteSale(null);
  };

  return (
    <div>
      <PageHeader title="Sales" subtitle={`${sales.length} total invoices`} />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Total Sales</span>
          </div>
          <div className="text-2xl text-blue-700" style={{ fontWeight: 800 }}>{formatCurrency(stats.totalSales)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{filtered.length} invoices</div>
        </div>
        {isOwnerOrManager && (
          <div className="bg-white rounded-2xl border border-green-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Gross Profit</span>
            </div>
            <div className="text-2xl text-green-700" style={{ fontWeight: 800 }}>{formatCurrency(stats.totalProfit)}</div>
            <div className="text-xs text-gray-400 mt-0.5">From filtered invoices</div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <span className="text-xs text-gray-500" style={{ fontWeight: 500 }}>Due Amount</span>
          </div>
          <div className="text-2xl text-red-600" style={{ fontWeight: 800 }}>{formatCurrency(stats.totalDue)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Outstanding dues</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by invoice, customer, cashier..." className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-400 px-5 py-3.5">Invoice</th>
                <th className="text-left text-xs text-gray-400 px-4 py-3.5">Customer</th>
                <th className="text-left text-xs text-gray-400 px-4 py-3.5 hidden md:table-cell">Cashier</th>
                <th className="text-left text-xs text-gray-400 px-4 py-3.5 hidden lg:table-cell">Payment</th>
                <th className="text-right text-xs text-gray-400 px-4 py-3.5">Amount</th>
                {isOwnerOrManager && <th className="text-right text-xs text-gray-400 px-4 py-3.5 hidden lg:table-cell">Profit</th>}
                <th className="text-center text-xs text-gray-400 px-4 py-3.5">Status</th>
                <th className="text-right text-xs text-gray-400 px-4 py-3.5 hidden md:table-cell">Date</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-blue-600 text-sm" style={{ fontWeight: 700 }}>{sale.invoiceNumber}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{sale.customerName || 'Walk-in'}</div>
                    {sale.customerPhone && <div className="text-[10px] text-gray-400">{sale.customerPhone}</div>}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] text-blue-600" style={{ fontWeight: 700 }}>
                        {(sale.cashierName || 'S').charAt(0)}
                      </div>
                      <span className="text-xs text-gray-600">{(sale.cashierName || 'Staff').split(' ')[0]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {sale.payments.map((p, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200" style={{ fontWeight: 500 }}>
                          {PAYMENT_METHOD_LABELS[p.method]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{formatCurrency(sale.totalAmount)}</span>
                  </td>
                  {isOwnerOrManager && (
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      <span className="text-sm text-green-700" style={{ fontWeight: 600 }}>{formatCurrency(calculateSaleProfit(sale))}</span>
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center">
                    {sale.dueAmount > 0 ? (
                      <span className="text-[10px] px-2.5 py-1 bg-red-50 text-red-700 rounded-full border border-red-100" style={{ fontWeight: 600 }}>
                        Due {formatCurrency(sale.dueAmount)}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100" style={{ fontWeight: 600 }}>
                        ✓ Paid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right hidden md:table-cell text-xs text-gray-400">{formatDateTime(sale.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setViewSale(sale)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="View Details">
                        <Eye size={14} />
                      </button>
                      {isOwnerOrManager && (
                        <button onClick={() => setDeleteSale(sale)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete Sale">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No sales found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Sale Modal */}
      {viewSale && (
        <Modal
          open={!!viewSale}
          onClose={() => setViewSale(null)}
          title={`Invoice: ${viewSale.invoiceNumber}`}
          size="md"
          footer={
            <div className="flex gap-3 justify-end">
              <button onClick={() => setViewSale(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700">Close</button>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setPrintType('retail');
                    setTimeout(() => window.print(), 100);
                  }} 
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm flex items-center gap-2" 
                  style={{ fontWeight: 600 }}
                >
                  <Printer size={14} /> Print Standard
                </button>
                <button 
                  onClick={() => {
                    setPrintType('thermal');
                    setTimeout(() => window.print(), 100);
                  }} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2" 
                  style={{ fontWeight: 600 }}
                >
                  <Printer size={14} /> Print Thermal
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Invoice:</span> <span className="text-blue-600" style={{ fontWeight: 600 }}>{viewSale.invoiceNumber}</span></div>
              <div><span className="text-gray-500">Date:</span> {formatDateTime(viewSale.createdAt)}</div>
              <div><span className="text-gray-500">Cashier:</span> {viewSale.cashierName}</div>
              <div><span className="text-gray-500">Customer:</span> {viewSale.customerName || 'Walk-in'}</div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-xs text-gray-500 px-3 py-2 text-left">Item</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-center">Qty</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-right">Price</th>
                    <th className="text-xs text-gray-500 px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewSale.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-800">{item.productName}</div>
                        {(item.color || item.size) && <div className="text-xs text-gray-400">{item.color} {item.size}</div>}
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-sm text-gray-700">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right text-sm text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(viewSale.subtotal)}</span></div>
              {viewSale.discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatCurrency(viewSale.discountAmount)}</span></div>}
              {viewSale.taxAmount > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Tax</span><span>{formatCurrency(viewSale.taxAmount)}</span></div>}
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2" style={{ fontWeight: 700 }}><span>Total</span><span>{formatCurrency(viewSale.totalAmount)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>Paid</span><span>{formatCurrency(viewSale.paidAmount)}</span></div>
              {viewSale.dueAmount > 0 && <div className="flex justify-between text-sm text-red-600" style={{ fontWeight: 600 }}><span>Due</span><span>{formatCurrency(viewSale.dueAmount)}</span></div>}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Payment Methods</p>
              <div className="flex gap-2 flex-wrap">
                {viewSale.payments.map((p, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                    {PAYMENT_METHOD_LABELS[p.method]}: {formatCurrency(p.amount)}
                  </span>
                ))}
              </div>
            </div>

            {/* Hidden Invoices for printing via Portal */}
            {createPortal(
              <div className="print-container">
                {printType === 'thermal' && (
                  <div id="invoice-print">
                    <POSInvoice shop={shop!} sale={viewSale} />
                  </div>
                )}
                {printType === 'retail' && (
                  <div id="retail-invoice-print">
                    <RetailInvoice shop={shop!} sale={viewSale} />
                  </div>
                )}
              </div>,
              document.body
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteSale}
        onClose={() => setDeleteSale(null)}
        title="Delete Sale"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteSale(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700">Cancel</button>
            <button onClick={handleDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700" style={{ fontWeight: 600 }}>Delete Invoice</button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Invoice?</h3>
          <p className="text-gray-500 text-sm">
            Are you sure you want to delete invoice <strong>{deleteSale?.invoiceNumber}</strong>? 
            This action cannot be undone and will remove it from the sales history.
          </p>
        </div>
      </Modal>
    </div>
  );
}