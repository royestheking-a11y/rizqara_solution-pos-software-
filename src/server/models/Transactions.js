import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  email: { type: String },
  totalPurchase: { type: Number, default: 0 },
  totalDue: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  lastPurchaseDate: { type: String },
  notes: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const saleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  customerId: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  items: [{
    id: String,
    productId: String,
    productName: String,
    variantId: String,
    color: String,
    size: String,
    quantity: Number,
    sellingPrice: Number,
    discountPrice: Number,
    total: Number
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  payments: [{
    method: String,
    amount: Number,
    transactionId: String,
    date: String
  }],
  paidAmount: { type: Number, required: true },
  dueAmount: { type: Number, required: true },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'partially_paid', 'returned', 'cancelled'], default: 'completed' },
  note: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const purchaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  items: [{
    id: String,
    productId: String,
    productName: String,
    variantId: String,
    color: String,
    size: String,
    quantity: Number,
    purchasePrice: Number,
    total: Number
  }],
  totalAmount: { type: Number, required: true },
  transportCost: { type: Number, default: 0 },
  paidAmount: { type: Number, required: true },
  dueAmount: { type: Number, required: true },
  date: { type: String, required: true },
  note: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const expenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const stockMovementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  productId: { type: String, required: true },
  variantId: { type: String },
  productName: { type: String, required: true },
  color: { type: String },
  size: { type: String },
  action: { type: String, enum: ['add', 'subtract', 'sale', 'return', 'purchase'], required: true },
  quantity: { type: Number, required: true },
  by: { type: String, required: true },
  date: { type: String, required: true },
  note: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

const returnSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  saleId: { type: String },
  invoiceNumber: { type: String },
  customerId: { type: String },
  customerName: { type: String },
  type: { type: String, enum: ['return', 'exchange'], required: true },
  items: [{
    id: String,
    productId: String,
    productName: String,
    variantId: String,
    color: String,
    size: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  reason: { type: String, required: true },
  refundAmount: { type: Number, default: 0 },
  refundMethod: { type: String },
  returnedToStock: { type: Boolean, default: true },
  approvedBy: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: String, required: true }
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
export const Sale = mongoose.model('Sale', saleSchema);
export const Purchase = mongoose.model('Purchase', purchaseSchema);
export const Expense = mongoose.model('Expense', expenseSchema);
export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export const Return = mongoose.model('Return', returnSchema);
