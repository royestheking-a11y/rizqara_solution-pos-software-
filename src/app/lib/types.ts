// ===================== TYPE DEFINITIONS =====================

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'cashier';
export type ShopStatus = 'active' | 'inactive' | 'suspended' | 'expired';
export type PackageName = 'starter' | 'standard' | 'premium';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'bank_transfer' | 'due';
export type SaleStatus = 'completed' | 'held' | 'cancelled';
export type ReturnType = 'full_return' | 'partial_return' | 'exchange' | 'store_credit';
export type StockAction = 'purchase_added' | 'sold' | 'returned' | 'damaged' | 'lost' | 'adjusted' | 'transferred';

export interface User {
  id: string;
  shopId: string | null; // null for super_admin
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
  maxDiscountPercent?: number; // for cashiers/managers
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  packageId: string;
  monthlyFee: number;
  setupFee: number;
  expiryDate: string;
  status: ShopStatus;
  logo?: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  loyaltyRatio: number; // e.g., 0.01 = 1% points
  pointValue: number;   // e.g., 1 point = 1 ৳
  ownerId: string;
  createdAt: string;
}

export interface Package {
  id: string;
  name: PackageName;
  displayName: string;
  maxProducts: number; // -1 = unlimited
  maxStaff: number;
  features: string[];
  monthlyFee: number;
  setupFee: number;
}

export interface Category {
  id: string;
  shopId: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  shopId: string;
  name: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  company: string;
  address: string;
  totalPurchase: number;
  dueAmount: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  shopId: string;
  color: string;
  size: string;
  quantity: number;
  sku?: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  categoryId: string;
  brandId?: string;
  sku: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  discountPrice?: number;
  image?: string;
  supplierId?: string;
  description?: string;
  status: 'active' | 'inactive';
  lowStockAlert: number;
  hasVariants: boolean;
  variants: ProductVariant[];
  totalQuantity: number; // computed
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  purchasePrice: number;
}

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface Sale {
  id: string;
  shopId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  invoiceNumber: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  payments: PaymentEntry[];
  paidAmount: number;
  dueAmount: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  status: SaleStatus;
  note?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  totalPurchase: number;
  totalDue: number;
  points: number;
  lastPurchaseDate?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  color?: string;
  size?: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  shopId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  transportCost: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Return {
  id: string;
  shopId: string;
  saleId?: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  type: ReturnType;
  items: ReturnItem[];
  reason: string;
  refundAmount: number;
  refundMethod?: PaymentMethod;
  returnedToStock: boolean;
  approvedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  exchangeItems?: SaleItem[];
  createdAt: string;
}

export interface Expense {
  id: string;
  shopId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  shopId: string;
  productId: string;
  variantId?: string;
  productName: string;
  color?: string;
  size?: string;
  action: StockAction;
  quantity: number; // + or -
  by: string;
  date: string;
  note?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  shopId: string | null;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  shopId: string | null;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'low_stock' | 'shop_expiry' | 'new_ticket' | 'sale';
  read: boolean;
  details?: any;
  createdAt: string;
}

export interface SupportTicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  shopId: string;
  shopName?: string;
  customerName?: string;
  email?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  messages?: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  shop: Shop | null;
  isAuthenticated: boolean;
}

export interface HeldOrder {
  id: string;
  shopId: string;
  name: string;
  items: SaleItem[];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

export interface Register {
  id: string;
  shopId: string;
  cashierId: string;
  cashierName: string;
  openTime: string;
  closeTime?: string;
  openingBalance: number;
  cashSales: number;
  otherSales: number;
  expectedBalance: number;
  actualBalance?: number;
  difference?: number;
  status: 'open' | 'closed';
  note?: string;
  createdAt: string;
}
