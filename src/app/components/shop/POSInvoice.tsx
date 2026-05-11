import React from 'react';
import { Shop, Sale } from '../../lib/types';
import { formatCurrency, PAYMENT_METHOD_LABELS } from '../../lib/utils';

interface POSInvoiceProps {
  shop: Shop;
  sale: Sale;
}

export const POSInvoice: React.FC<POSInvoiceProps> = ({ shop, sale }) => {
  return (
    <div id="invoice-print" className="bg-white text-black p-4 max-w-[80mm] mx-auto text-[12px] font-mono">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold uppercase">{shop.name}</h2>
        <p className="text-[10px] leading-tight">{shop.address}</p>
        <p className="text-[10px]">Phone: {shop.phone}</p>
        {shop.email && <p className="text-[10px]">Email: {shop.email}</p>}
      </div>

      <div className="border-b border-dashed border-black mb-2"></div>

      {/* Sale Info */}
      <div className="mb-2 space-y-0.5">
        <div className="flex justify-between">
          <span>Invoice:</span>
          <span className="font-bold">{sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(sale.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{sale.cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{sale.customerName || 'Walk-in'}</span>
        </div>
        {sale.customerPhone && (
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{sale.customerPhone}</span>
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-black mb-2"></div>

      {/* Items Header */}
      <div className="flex font-bold mb-1">
        <span className="flex-1 text-left">Item</span>
        <span className="w-12 text-center">Qty</span>
        <span className="w-20 text-right">Total</span>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-2">
        {sale.items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between items-start">
              <span className="flex-1 text-left leading-tight">
                {item.productName}
                {(item.color || item.size) && (
                  <span className="text-[10px] block opacity-70">
                    {item.color} {item.size}
                  </span>
                )}
              </span>
              <span className="w-12 text-center">x{item.quantity}</span>
              <span className="w-20 text-right">{formatCurrency(item.total)}</span>
            </div>
            <div className="text-[10px] text-right opacity-60">
              @{formatCurrency(item.unitPrice)} 
              {item.discount > 0 && ` (-${formatCurrency(item.discount)})`}
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-dashed border-black mb-2"></div>

      {/* Totals */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discountAmount)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({shop.taxRate}%):</span>
            <span>{formatCurrency(sale.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-0.5 text-[10px] mb-4">
        {sale.payments.map((p, idx) => (
          <div key={idx} className="flex justify-between italic">
            <span>Paid by {PAYMENT_METHOD_LABELS[p.method]}:</span>
            <span>{formatCurrency(p.amount)}</span>
          </div>
        ))}
        {sale.paidAmount > sale.totalAmount && (
          <div className="flex justify-between font-bold mt-1">
            <span>CHANGE:</span>
            <span>{formatCurrency(sale.paidAmount - sale.totalAmount)}</span>
          </div>
        )}
        {sale.dueAmount > 0 && (
          <div className="flex justify-between font-bold text-red-600 mt-1">
            <span>BALANCE DUE:</span>
            <span>{formatCurrency(sale.dueAmount)}</span>
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-black mb-4"></div>

      {/* Footer */}
      <div className="text-center space-y-1">
        <p className="font-bold">THANK YOU FOR YOUR PURCHASE!</p>
        <p className="text-[10px]">Please come again.</p>
        <div className="mt-4 opacity-50 text-[8px]">
          <p>Software by Rizqara Solution</p>
          <p>www.rizqara.tech</p>
        </div>
      </div>
    </div>
  );
};
