import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String },
  ownerName: { type: String },
  ownerEmail: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  logo: { type: String },
  packageId: { type: String, required: true },
  status: { type: String, enum: ['active', 'expired', 'suspended'], default: 'active' },
  currency: { type: String, default: '৳' },
  loyaltyRatio: { type: Number, default: 0.01 },
  pointValue: { type: Number, default: 1 },
  setupFee: { type: Number, default: 0 },
  monthlyFee: { type: Number, default: 0 },
  expiryDate: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, default: null },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'owner', 'manager', 'cashier'], required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  phone: { type: String },
  avatar: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  name: { type: String, required: true },
  categoryId: { type: String, required: true },
  brandId: { type: String },
  sku: { type: String, required: true },
  barcode: { type: String },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  discountPrice: { type: Number },
  totalQuantity: { type: Number, default: 0 },
  lowStockAlert: { type: Number, default: 5 },
  hasVariants: { type: Boolean, default: false },
  variants: [{
    id: String,
    productId: String,
    shopId: String,
    color: String,
    size: String,
    quantity: Number
  }],
  supplierId: { type: String },
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  name: { type: String, required: true },
  parentId: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const supplierSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  company: { type: String },
  address: { type: String },
  totalPurchase: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  createdAt: { type: String, required: true }
}, { timestamps: true });

export const Shop = mongoose.model('Shop', shopSchema);
export const User = mongoose.model('User', userSchema);
export const Category = mongoose.model('Category', categorySchema);
export const Brand = mongoose.model('Brand', brandSchema);
export const Supplier = mongoose.model('Supplier', supplierSchema);
export const Product = mongoose.model('Product', productSchema);
