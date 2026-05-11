import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { expenseStorage } from '../../lib/storage';
import { Expense } from '../../lib/types';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, isToday, isThisMonth } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

export default function Expenses() {
  const { shop, user } = useAuth();
  const shopId = shop?.id || '';
  const [expenses, setExpenses] = useState(() => expenseStorage.getByShop(shopId));
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase());
      const matchDate = dateFilter === 'all' ||
        (dateFilter === 'today' && isToday(e.date)) ||
        (dateFilter === 'month' && isThisMonth(e.date));
      return matchSearch && matchDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, search, dateFilter]);

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const categoryData = EXPENSE_CATEGORIES.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter(d => d.value > 0);

  const openCreate = () => {
    setForm({ category: EXPENSE_CATEGORIES[0], amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
    setEditExpense(null);
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setForm({ category: e.category, amount: e.amount, description: e.description, date: e.date.split('T')[0] });
    setEditExpense(e);
    setShowModal(true);
  };

  const handleSave = () => {
    if (form.amount <= 0) { toast.error('Amount must be greater than 0'); return; }
    if (editExpense) {
      expenseStorage.update({ ...editExpense, ...form, date: new Date(form.date).toISOString() });
      toast.success('Expense updated');
    } else {
      expenseStorage.create({ shopId, ...form, date: new Date(form.date).toISOString(), createdBy: user?.name || '' });
      toast.success('Expense added');
    }
    setExpenses(expenseStorage.getByShop(shopId));
    setShowModal(false);
  };

  const handleDelete = (expense: Expense) => {
    expenseStorage.delete(expense.id);
    setExpenses(expenseStorage.getByShop(shopId));
    toast.success('Expense deleted');
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${expenses.length} expense records`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> Add Expense
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>Summary</h3>
          <div className="text-2xl text-blue-700 mb-1" style={{ fontWeight: 800 }}>{formatCurrency(totalAmount)}</div>
          <div className="text-xs text-gray-400 mb-4">Total Expenses ({filtered.length} records)</div>
          <div className="space-y-2">
            {EXPENSE_CATEGORIES.slice(0, 5).map((cat, i) => {
              const amt = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
              if (amt === 0) return null;
              return (
                <div key={cat} className="flex justify-between text-xs">
                  <span className="text-gray-600">{cat}</span>
                  <span className="text-gray-900" style={{ fontWeight: 600 }}>{formatCurrency(amt)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-gray-900 mb-3" style={{ fontWeight: 600 }}>Expenses by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="40%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No expense data</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Category</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Description</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Amount</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Date</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">By</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(expense => (
                <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{expense.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{expense.description}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{formatCurrency(expense.amount)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(expense.date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{expense.createdBy}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(expense)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(expense)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No expenses found</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-xs text-gray-500" style={{ fontWeight: 600 }}>Total</td>
                  <td className="px-4 py-3 text-right text-sm text-blue-700" style={{ fontWeight: 700 }}>{formatCurrency(totalAmount)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editExpense ? 'Edit Expense' : 'Add Expense'} size="md" footer={
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" style={{ fontWeight: 500 }}>Save</button>
        </div>
      }>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Category *</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {EXPENSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Amount (৳) *</label>
            <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Expense description" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </Modal>
    </div>
  );
}