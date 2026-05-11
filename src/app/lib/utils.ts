import { Sale, Expense, Product } from './types';

export function formatCurrency(amount: number | undefined | null, currency: string = 'BDT'): string {
  const val = amount || 0;
  if (currency === 'BDT') {
    return `৳${val.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `${currency} ${val.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-BD', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

export function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

export function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return date >= weekStart;
}

export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function calculateSaleProfit(sale: Sale): number {
  return sale.items.reduce((sum, item) => {
    const profit = (item.unitPrice - item.discount / item.quantity - item.purchasePrice) * item.quantity;
    return sum + profit;
  }, 0);
}

export function getTodayStats(sales: Sale[], expenses: Expense[]) {
  const todaySales = sales.filter(s => isToday(s.createdAt) && s.status === 'completed');
  const todayExpenses = expenses.filter(e => isToday(e.date));
  
  const totalSales = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = todaySales.reduce((sum, s) => sum + calculateSaleProfit(s), 0);
  const totalExpense = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalInvoices = todaySales.length;
  
  return { totalSales, totalProfit, totalExpense, totalInvoices, todaySales };
}

export function getMonthStats(sales: Sale[], expenses: Expense[]) {
  const monthSales = sales.filter(s => isThisMonth(s.createdAt) && s.status === 'completed');
  const monthExpenses = expenses.filter(e => isThisMonth(e.date));
  
  const totalSales = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = monthSales.reduce((sum, s) => sum + calculateSaleProfit(s), 0);
  const totalExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalProfit - totalExpense;
  
  return { totalSales, totalProfit, totalExpense, netProfit, count: monthSales.length };
}

export function getLowStockProducts(products: Product[]): Product[] {
  return products.filter(p => p.status === 'active' && p.totalQuantity <= p.lowStockAlert && p.totalQuantity > 0);
}

export function getOutOfStockProducts(products: Product[]): Product[] {
  return products.filter(p => p.status === 'active' && p.totalQuantity === 0);
}

export function getTopProducts(sales: Sale[], limit: number = 5) {
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  
  sales.filter(s => s.status === 'completed').forEach(sale => {
    sale.items.forEach(item => {
      const existing = productMap.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
      productMap.set(item.productId, {
        name: item.productName,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.total,
      });
    });
  });

  return Array.from(productMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function getPaymentMethodStats(sales: Sale[]) {
  const methodMap = new Map<string, number>();
  
  sales.filter(s => s.status === 'completed').forEach(sale => {
    sale.payments.forEach(payment => {
      methodMap.set(payment.method, (methodMap.get(payment.method) || 0) + payment.amount);
    });
  });

  return Array.from(methodMap.entries()).map(([method, amount]) => ({ method, amount }));
}

export function getSalesChartData(sales: Sale[], days: number = 7) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateStr = `${MONTHS[date.getMonth()]} ${date.getDate()}`;

    const daySales = sales.filter(s => {
      const saleDate = new Date(s.createdAt);
      return saleDate.getDate() === date.getDate() &&
        saleDate.getMonth() === date.getMonth() &&
        saleDate.getFullYear() === date.getFullYear() &&
        s.status === 'completed';
    });

    const revenue = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const profit = daySales.reduce((sum, s) => sum + calculateSaleProfit(s), 0);
    data.push({ date: dateStr, revenue, profit, orders: daySales.length });
  }
  return data;
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateSKU(prefix: string = 'SKU'): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  due: 'Due',
};

export const EXPENSE_CATEGORIES = [
  'Shop Rent',
  'Staff Salary',
  'Internet Bill',
  'Electricity Bill',
  'Packaging',
  'Delivery Charge',
  'Marketing Cost',
  'Transport Cost',
  'Other',
];

export const RETURN_REASONS = [
  'Size Issue',
  'Color Issue',
  'Defective Product',
  'Customer Changed Mind',
  'Wrong Product',
  'Quality Issue',
  'Other',
];