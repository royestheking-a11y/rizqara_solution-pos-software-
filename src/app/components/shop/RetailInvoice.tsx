import React from 'react';
import { Shop, Sale } from '../../lib/types';
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from '../../lib/utils';
import { ShoppingBag, Globe, Phone, MapPin, Mail } from 'lucide-react';

interface RetailInvoiceProps {
  shop: Shop;
  sale: Sale;
}

export const RetailInvoice: React.FC<RetailInvoiceProps> = ({ shop, sale }) => {
  return (
    <div id="retail-invoice-print" className="bg-white text-black p-8 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-gray-900 pb-6">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center text-white">
            <ShoppingBag size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">{shop.name}</h1>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{shop.businessType || 'Retail Store'}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black text-gray-200 uppercase mb-1">INVOICE</h2>
          <div className="text-sm space-y-1">
            <p><span className="font-bold">No:</span> {sale.invoiceNumber}</p>
            <p><span className="font-bold">Date:</span> {formatDateTime(sale.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Shop Details</h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0" /> {shop.address}</p>
            <p className="flex items-center gap-2"><Phone size={14} className="flex-shrink-0" /> {shop.phone}</p>
            {shop.email && <p className="flex items-center gap-2"><Mail size={14} className="flex-shrink-0" /> {shop.email}</p>}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Details</h3>
          <div className="space-y-2 text-sm">
            <p className="text-lg font-bold">{sale.customerName || 'Walk-in Customer'}</p>
            {sale.customerPhone && <p className="flex items-center gap-2 text-gray-600"><Phone size={14} className="flex-shrink-0" /> {sale.customerPhone}</p>}
            <p className="text-gray-500">Salesperson: {sale.cashierName}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-grow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y-2 border-gray-900">
              <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider">Item Description</th>
              <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider w-24">Quantity</th>
              <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider w-32">Unit Price</th>
              <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-4 px-4">
                  <div className="font-bold text-sm">{item.productName}</div>
                  {(item.color || item.size) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.color && `Color: ${item.color}`} {item.size && `Size: ${item.size}`}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-center text-sm">{item.quantity}</td>
                <td className="py-4 px-4 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                <td className="py-4 px-4 text-right text-sm font-bold">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="mt-10 flex justify-end">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-sm py-1">
            <span className="text-gray-500">Subtotal:</span>
            <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-sm py-1 text-green-700">
              <span>Discount:</span>
              <span>-{formatCurrency(sale.discountAmount)}</span>
            </div>
          )}
          {sale.taxAmount > 0 && (
            <div className="flex justify-between text-sm py-1">
              <span>Tax ({shop.taxRate}%):</span>
              <span>{formatCurrency(sale.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3 border-t-2 border-gray-900 bg-gray-50 px-4 -mx-4 rounded-b-xl">
            <span className="text-base font-black uppercase tracking-wider">Grand Total</span>
            <span className="text-2xl font-black text-blue-700">{formatCurrency(sale.totalAmount)}</span>
          </div>

          <div className="pt-4 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Information</p>
            {sale.payments.map((p, i) => (
              <div key={i} className="flex justify-between text-xs italic">
                <span>{PAYMENT_METHOD_LABELS[p.method]}</span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
            ))}
            {sale.dueAmount > 0 && (
              <div className="flex justify-between text-sm font-bold text-red-600 border-t border-red-100 pt-1 mt-1">
                <span>Due Balance:</span>
                <span>{formatCurrency(sale.dueAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-100 text-center">
        <p className="text-sm font-bold mb-1">Thank you for choosing {shop.name}!</p>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Terms & Conditions: Please keep this invoice for returns or exchanges within 7 days. 
          Goods once sold are only exchangeable with original tags.
        </p>
        <div className="mt-8 flex justify-center items-center gap-4 text-[10px] text-gray-400 uppercase tracking-[0.2em]">
          <span>Generated by Rizqara Solution</span>
          <div className="w-1 h-1 bg-gray-200 rounded-full" />
          <span>www.rizqara.tech</span>
        </div>
      </div>
    </div>
  );
};
