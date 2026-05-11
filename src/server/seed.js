import mongoose from 'mongoose';
import connectDB from './db.js';
import { Shop, User, Product, Category, Brand, Supplier } from './models/Core.js';
import { Customer, Sale, Expense, Return, StockMovement, Purchase } from './models/Transactions.js';
import { ActivityLog, Package, Notification, SupportTicket, Register, HeldOrder } from './models/Utility.js';

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB for FINAL Corrected Seeding...');

    // Clear EVERYTHING
    await Promise.all([
      Shop.deleteMany({}), User.deleteMany({}), Product.deleteMany({}), Category.deleteMany({}), Brand.deleteMany({}), Supplier.deleteMany({}),
      Customer.deleteMany({}), Sale.deleteMany({}), Expense.deleteMany({}), Return.deleteMany({}), StockMovement.deleteMany({}), Purchase.deleteMany({}),
      ActivityLog.deleteMany({}), Package.deleteMany({}), Notification.deleteMany({}), SupportTicket.deleteMany({}), Register.deleteMany({}), HeldOrder.deleteMany({})
    ]);

    const now = new Date();
    const isoNow = now.toISOString();
    const shop1Id = 'shop_1';
    
    // 1. Packages
    await Package.insertMany([
      { id: 'pkg_starter', name: 'starter', displayName: 'Starter', monthlyFee: 1000, setupFee: 10000, maxProducts: 500, maxStaff: 1, features: ['1 Cashier', '500 Products'], createdAt: isoNow },
      { id: 'pkg_standard', name: 'standard', displayName: 'Standard', monthlyFee: 2000, setupFee: 18000, maxProducts: 2000, maxStaff: 3, features: ['3 Staff', '2000 Products'], createdAt: isoNow },
      { id: 'pkg_premium', name: 'premium', displayName: 'Premium', monthlyFee: 4500, setupFee: 35000, maxProducts: -1, maxStaff: 10, features: ['Unlimited Everything'], createdAt: isoNow }
    ]);

    // 2. Super Admin
    await User.create({ id: 'admin_1', name: 'Rizqara Admin', email: 'admin@rizqarasolution.com', password: 'Admin@123', role: 'super_admin', status: 'active', createdAt: isoNow });

    // 3. MAXWEAR Shop
    await Shop.create({ id: shop1Id, name: 'MAXWEAR', ownerName: 'Abdullah Rubel', ownerEmail: 'owner@maxwear.com', phone: '01717121245', email: 'info@maxwear.com', address: 'Banani, Dhaka', businessType: 'Clothing Shop', packageId: 'pkg_premium', monthlyFee: 4500, setupFee: 35000, expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', currency: 'BDT', taxRate: 5, createdAt: isoNow });

    // 4. Shop Users (Working Credentials)
    const ownerId = 'user_1';
    const managerId = 'user_2';
    const cashierId = 'user_3';
    
    await User.insertMany([
      { id: ownerId, shopId: shop1Id, name: 'Abdullah Rubel', email: 'owner@maxwear.com', password: 'Owner@123', role: 'owner', status: 'active', createdAt: isoNow },
      { id: managerId, shopId: shop1Id, name: 'Karim Manager', email: 'manager@maxwear.com', password: 'Manager@123', role: 'manager', status: 'active', createdAt: isoNow },
      { id: cashierId, shopId: shop1Id, name: 'Salam Cashier', email: 'cashier@maxwear.com', password: 'Cashier@123', role: 'cashier', status: 'active', createdAt: isoNow }
    ]);

    // 5. Categories & Brands
    const categories = await Category.insertMany([
      { id: 'cat_1', shopId: shop1Id, name: 'Mens Fashion', createdAt: isoNow },
      { id: 'cat_2', shopId: shop1Id, name: 'Womens Fashion', createdAt: isoNow },
      { id: 'cat_3', shopId: shop1Id, name: 'Accessories', createdAt: isoNow }
    ]);

    const brands = await Brand.insertMany([
      { id: 'br_1', shopId: shop1Id, name: 'MAXWEAR Original', createdAt: isoNow },
      { id: 'br_2', shopId: shop1Id, name: 'Denim Co', createdAt: isoNow }
    ]);

    // 6. 10 Products
    const products = [];
    for (let i = 1; i <= 10; i++) {
      products.push({
        id: `p${i}`, shopId: shop1Id, name: `Premium Item ${i}`, categoryId: 'cat_1', brandId: 'br_1',
        sku: `MW-${1000 + i}`, purchasePrice: 400 + (i * 10), sellingPrice: 850 + (i * 20), totalQuantity: 50,
        status: 'active', createdAt: isoNow
      });
    }
    await Product.insertMany(products);

    // 7. Customers
    await Customer.create({ id: 'c1', shopId: shop1Id, name: 'Tanvir Ahmed', phone: '01819000000', email: 'tanvir@gmail.com', totalPurchase: 5000, totalDue: 0, createdAt: isoNow });

    // 8. Sales
    await Sale.create({
      id: 'sale_1', shopId: shop1Id, invoiceNumber: 'MW-1001', customerName: 'Tanvir Ahmed',
      cashierId: cashierId, cashierName: 'Salam Cashier',
      items: [{ id: 'si_1', productId: 'p1', productName: 'Premium Item 1', quantity: 1, sellingPrice: 870, total: 870 }],
      subtotal: 870, totalAmount: 870, paidAmount: 870, dueAmount: 0,
      status: 'completed', payments: [{ method: 'cash', amount: 870 }], createdAt: isoNow
    });

    // 9. Expenses
    await Expense.create({ id: 'e1', shopId: shop1Id, category: 'Rent', amount: 20000, date: isoNow, details: 'Showroom Rent', createdBy: ownerId, createdAt: isoNow });

    console.log('FINAL SEEDING COMPLETED SUCCESSFULLY!');
    console.log('-----------------------------------');
    console.log('Owner: owner@maxwear.com / Owner@123');
    console.log('Manager: manager@maxwear.com / Manager@123');
    console.log('Cashier: cashier@maxwear.com / Cashier@123');
    console.log('-----------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
