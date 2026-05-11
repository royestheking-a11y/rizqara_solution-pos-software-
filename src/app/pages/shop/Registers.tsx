import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { registerStorage } from '../../lib/storage';
import { Register } from '../../lib/types';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Search, Calculator, Calendar, Clock, User, Eye, AlertCircle } from 'lucide-react';

export default function Registers() {
  const { shop } = useAuth();
  const shopId = shop?.id || '';
  const [registers] = useState(() => registerStorage.getByShop(shopId));
  const [search, setSearch] = useState('');
  const [viewRegister, setViewRegister] = useState<Register | null>(null);

  const filtered = useMemo(() => {
    return registers.filter(r => 
      r.cashierName.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
  }, [registers, search]);

  const stats = useMemo(() => {
    const closedRegisters = registers.filter(r => r.status === 'closed');
    const totalCashSales = closedRegisters.reduce((sum, r) => sum + r.cashSales, 0);
    const totalDiscrepancy = closedRegisters.reduce((sum, r) => sum + (r.difference || 0), 0);
    return { totalCashSales, totalDiscrepancy, openCount: registers.filter(r => r.status === 'open').length };
  }, [registers]);

  return (
    <div>
      <PageHeader title="Registers & Shifts" subtitle="Track cashier sessions and cash reconciliation" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard title="Total Cash Sales" value={formatCurrency(stats.totalCashSales)} icon={<Calculator size={20} />} color="blue" />
        <StatCard title="Cash Discrepancy" value={formatCurrency(stats.totalDiscrepancy)} icon={<AlertCircle size={20} />} color={(stats.totalDiscrepancy < 0 ? 'red' : 'green') as any} />
        <StatCard title="Open Shifts" value={stats.openCount.toString()} icon={<Clock size={20} />} color="blue" />
        <StatCard title="Avg. Sales/Shift" value={formatCurrency(stats.totalCashSales / (registers.length || 1))} icon={<Calendar size={20} />} color="purple" />
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by cashier or status..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Cashier</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Session Start</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Opening Cash</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Cash Sales</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Final Cash</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Diff</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(reg => (
                <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{reg.cashierName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                      reg.status === 'open' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'
                    }`}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(reg.openTime)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(reg.openingBalance)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900 font-bold">{formatCurrency(reg.cashSales)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900 font-bold">{reg.actualBalance ? formatCurrency(reg.actualBalance) : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {reg.status === 'closed' ? (
                      <span className={`text-sm font-bold ${reg.difference! < 0 ? 'text-red-600' : reg.difference! > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {reg.difference! > 0 ? '+' : ''}{formatCurrency(reg.difference || 0)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setViewRegister(reg)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No register history found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewRegister && (
        <Modal open={!!viewRegister} onClose={() => setViewRegister(null)} title="Shift Details" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Cashier</div>
                <div className="text-sm font-bold text-gray-900">{viewRegister.cashierName}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</div>
                <div className="text-sm font-bold text-gray-900 uppercase">{viewRegister.status}</div>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Opening Balance</span><span className="font-medium">{formatCurrency(viewRegister.openingBalance)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Cash Sales</span><span className="font-bold text-green-700">{formatCurrency(viewRegister.cashSales)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Other Sales (Card/Mobile)</span><span className="font-medium">{formatCurrency(viewRegister.otherSales)}</span></div>
              <div className="flex justify-between border-t border-gray-50 pt-2 text-sm font-black"><span className="text-gray-900">Expected Final Cash</span><span>{formatCurrency(viewRegister.expectedBalance)}</span></div>
            </div>

            {viewRegister.status === 'closed' && (
              <div className="p-4 rounded-xl border border-blue-50 bg-blue-50/30 space-y-2">
                <div className="flex justify-between text-sm font-bold"><span className="text-gray-700">Actual Counted Cash</span><span className="text-blue-700">{formatCurrency(viewRegister.actualBalance || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Difference</span><span className={`font-black ${viewRegister.difference! < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(viewRegister.difference || 0)}</span></div>
                {viewRegister.note && <div className="text-[10px] text-gray-400 mt-2 italic">Note: {viewRegister.note}</div>}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
