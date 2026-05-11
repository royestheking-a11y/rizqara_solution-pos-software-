import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String },
  userId: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success', 'low_stock', 'shop_expiry', 'new_ticket', 'sale'], required: true },
  read: { type: Boolean, default: false },
  details: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  shopName: { type: String },
  customerName: { type: String },
  email: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  messages: [{
    id: String,
    senderId: String,
    senderName: String,
    message: String,
    createdAt: String
  }],
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, { timestamps: true });

const registerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  cashierId: { type: String, required: true },
  cashierName: { type: String, required: true },
  openTime: { type: String, required: true },
  closeTime: { type: String },
  openingBalance: { type: Number, required: true },
  cashSales: { type: Number, default: 0 },
  otherSales: { type: Number, default: 0 },
  expectedBalance: { type: Number, required: true },
  actualBalance: { type: Number },
  difference: { type: Number },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  note: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const heldOrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  shopId: { type: String, required: true },
  name: { type: String, required: true },
  items: { type: Array, required: true },
  customerId: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const packageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  monthlyFee: { type: Number, required: true },
  setupFee: { type: Number, required: true },
  maxProducts: { type: Number, default: -1 },
  maxStaff: { type: Number, default: 1 },
  features: [String],
  createdAt: { type: String, required: true }
}, { timestamps: true });

const announcementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'maintenance'], required: true },
  audience: { type: String, enum: ['all', 'owners', 'managers', 'cashiers'], default: 'all' },
  pinned: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const systemSettingsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  softwareName: { type: String, required: true },
  version: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  maintenanceMode: { type: Boolean, default: false },
  defaultCurrency: { type: String, default: 'BDT' },
  defaultTaxRate: { type: Number, default: 0 },
  updatedAt: { type: String, required: true }
}, { timestamps: true });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export const Register = mongoose.model('Register', registerSchema);
export const HeldOrder = mongoose.model('HeldOrder', heldOrderSchema);
export const Package = mongoose.model('Package', packageSchema);
export const Announcement = mongoose.model('Announcement', announcementSchema);
export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
