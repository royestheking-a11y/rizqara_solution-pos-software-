import {
  userStorage, shopStorage, packageStorage, categoryStorage, brandStorage,
  supplierStorage, productStorage, customerStorage, saleStorage, expenseStorage,
  stockMovementStorage, activityLogStorage, isInitialized, markInitialized
} from './storage';

export async function seedInitialData() {
  // Check if we need to migrate to MongoDB
  let isMigrated = localStorage.getItem('rizqara_mongo_migrated') === 'true';
  
  // Safety check: If marked as migrated but we have local data and server might be empty
  // (e.g. previous attempt failed or server was down)
  if (isMigrated) {
    try {
      const existingShops = await fetch('/api/shops').then(r => r.json());
      if (Array.isArray(existingShops) && existingShops.length === 0) {
        console.log('Database appears empty despite migration flag. Retrying migration...');
        isMigrated = false;
      }
    } catch (e) {
      console.log('Could not verify database state, skipping re-migration check.');
    }
  }

  if (!isMigrated) {
    console.log('Migrating LocalStorage data to MongoDB...');
    try {
      const collections = [
        'users', 'shops', 'packages', 'categories', 'brands', 'suppliers',
        'products', 'sales', 'customers', 'purchases', 'expenses',
        'stockMovements', 'activityLogs', 'notifications', 'supportTickets',
        'heldOrders', 'registers'
      ];

      let migratedCount = 0;
      for (const key of collections) {
        const localData = localStorage.getItem(`rizqara_${key}`);
        if (localData) {
          const items = JSON.parse(localData);
          if (Array.isArray(items) && items.length > 0) {
            console.log(`Migrating ${items.length} items for ${key}...`);
            const res = await fetch(`/api/bulk/${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(items)
            });
            if (res.ok) migratedCount++;
          }
        }
      }
      
      if (migratedCount > 0) {
        localStorage.setItem('rizqara_mongo_migrated', 'true');
        console.log('Migration to MongoDB successful');
      } else {
        console.log('No local data found to migrate.');
        // Still mark as migrated if we found nothing, to avoid checking every time
        localStorage.setItem('rizqara_mongo_migrated', 'true');
      }
    } catch (err) {
      console.error('Migration to MongoDB failed:', err);
    }
  }

  // Ensure the primary demo owner exists for branding consistency
    // We are initialized but the rebrand user is missing, likely from an old session.
    // We'll look for the old owner and update them, or create a new one.
    const oldOwner = userStorage.getAll().find(u => u.email === 'karim@outfitretailer.com');
    if (oldOwner) {
      userStorage.update({
        ...oldOwner,
        name: 'Rubel Abdullah',
        email: 'rubel@maxwear.com',
        phone: '01717121245'
      });
      // Also update the shop name if it's the old one
      const shop = shopStorage.getById(oldOwner.shopId!);
      if (shop && shop.name === 'Outfit Retailer BD') {
        shopStorage.update({ 
          ...shop,
          name: 'Maxwear', 
          ownerName: 'Rubel Abdullah',
          ownerEmail: 'rubel@maxwear.com',
          phone: '01717121245',
          email: 'info@maxwear.tech',
          invoicePrefix: 'MW-',
          loyaltyRatio: 0.01,
          pointValue: 1
        });
      }
    }

  // Ensure all existing shops have loyalty fields
  if (isInitialized()) {
    shopStorage.getAll().forEach(s => {
      if (s.loyaltyRatio === undefined) {
        shopStorage.update({ ...s, loyaltyRatio: 0.01, pointValue: 1 });
      }
    });
    // Ensure all existing customers have points field
    customerStorage.getAll().forEach(c => {
      if (c.points === undefined) {
        customerStorage.update({ ...c, points: 0 });
      }
    });

    // Ensure Maxwear staff users exist for the new branding
    const maxwearShop = shopStorage.getAll().find(s => s.name === 'Maxwear');
    if (maxwearShop) {
      const managerExists = userStorage.getAll().find(u => u.email === 'rahim@maxwear.com');
      if (!managerExists) {
        userStorage.create({
          shopId: maxwearShop.id,
          name: 'Rahim Manager',
          email: 'rahim@maxwear.com',
          password: 'Manager@123',
          role: 'manager',
          phone: '01711234568',
          status: 'active',
          maxDiscountPercent: 15,
        });
      }
      const cashierExists = userStorage.getAll().find(u => u.email === 'salam@maxwear.com');
      if (!cashierExists) {
        userStorage.create({
          shopId: maxwearShop.id,
          name: 'Salam Cashier',
          email: 'salam@maxwear.com',
          password: 'Cashier@123',
          role: 'cashier',
          phone: '01711234569',
          status: 'active',
          maxDiscountPercent: 5,
        });
      }
    }
  }

  if (isInitialized()) return;

  // ===================== PACKAGES =====================
  const starterPkg = packageStorage.save({
    id: 'pkg_starter',
    name: 'starter',
    displayName: 'Starter',
    maxProducts: 500,
    maxStaff: 1,
    features: ['1 Cashier', '500 Products', 'Basic Sales', 'Basic Inventory', 'Invoice', 'Daily Report'],
    monthlyFee: 1000,
    setupFee: 10000,
  });

  const standardPkg = packageStorage.save({
    id: 'pkg_standard',
    name: 'standard',
    displayName: 'Standard',
    maxProducts: 2000,
    maxStaff: 3,
    features: ['3 Staff', '2,000 Products', 'Size/Color Variation', 'Return/Exchange', 'Customer Management', 'Supplier Management', 'Profit Report', 'Expense Management'],
    monthlyFee: 2000,
    setupFee: 20000,
  });

  const premiumPkg = packageStorage.save({
    id: 'pkg_premium',
    name: 'premium',
    displayName: 'Premium',
    maxProducts: -1,
    maxStaff: 10,
    features: ['Multi-branch', '10 Staff', 'Unlimited Products', 'Barcode', 'Advanced Analytics', 'WhatsApp Invoice', 'Loyalty System', 'Cloud Backup', 'Priority Support'],
    monthlyFee: 4500,
    setupFee: 45000,
  });

  // ===================== SUPER ADMIN =====================
  userStorage.create({
    shopId: null,
    name: 'Rizqara Admin',
    email: 'admin@rizqarasolution.com',
    password: 'Admin@123',
    role: 'super_admin',
    phone: '01700000000',
    status: 'active',
  });

  // ===================== DEMO SHOPS =====================
  const shop1 = shopStorage.create({
    name: 'Maxwear',
    ownerName: 'Rubel Abdullah',
    ownerEmail: 'rubel@maxwear.com',
    phone: '01717121245',
    email: 'info@maxwear.tech',
    address: 'House 12, Road 5, Dhanmondi, Dhaka',
    businessType: 'Clothing Shop',
    packageId: standardPkg.id,
    monthlyFee: 2000,
    setupFee: 18000,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    currency: 'BDT',
    taxRate: 5,
    invoicePrefix: 'MW-',
    loyaltyRatio: 0.01,
    pointValue: 1
  } as any);

  const shop2 = shopStorage.create({
    name: 'Style Zone BD',
    ownerName: 'Rahman Hossain',
    ownerEmail: 'rahman@stylezone.com',
    phone: '01822345678',
    email: 'rahman@stylezone.com',
    address: 'Shop 5, Bashundhara City, Dhaka',
    businessType: 'Boutique',
    packageId: premiumPkg.id,
    monthlyFee: 4500,
    setupFee: 45000,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    currency: 'BDT',
    taxRate: 0,
    invoicePrefix: 'SZ-',
    loyaltyRatio: 0.01,
    pointValue: 1
  } as any);

  const shop3 = shopStorage.create({
    name: 'Zara Fashion BD',
    ownerName: 'Fatema Begum',
    ownerEmail: 'fatema@zarafashion.com',
    phone: '01933456789',
    email: 'fatema@zarafashion.com',
    address: 'Gulshan 2, Dhaka',
    businessType: 'Fashion Reseller',
    packageId: starterPkg.id,
    monthlyFee: 1000,
    setupFee: 10000,
    expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // expired
    status: 'expired',
    currency: 'BDT',
    taxRate: 0,
    invoicePrefix: 'ZF-',
    loyaltyRatio: 0.01,
    pointValue: 1
  } as any);

  // ===================== SHOP USERS (Shop 1) =====================
  const owner1 = userStorage.create({
    shopId: shop1.id,
    name: 'Rubel Abdullah',
    email: 'rubel@maxwear.com',
    password: 'Owner@123',
    role: 'owner',
    phone: '01717121245',
    status: 'active',
    maxDiscountPercent: 100,
  });

  const manager1 = userStorage.create({
    shopId: shop1.id,
    name: 'Rahim Manager',
    email: 'rahim@maxwear.com',
    password: 'Manager@123',
    role: 'manager',
    phone: '01711234568',
    status: 'active',
    maxDiscountPercent: 15,
  });

  const cashier1 = userStorage.create({
    shopId: shop1.id,
    name: 'Salam Cashier',
    email: 'salam@maxwear.com',
    password: 'Cashier@123',
    role: 'cashier',
    phone: '01711234569',
    status: 'active',
    maxDiscountPercent: 5,
  });

  // ===================== SHOP 2 USERS =====================
  userStorage.create({
    shopId: shop2.id,
    name: 'Rahman Hossain',
    email: 'rahman@stylezone.com',
    password: 'Owner@123',
    role: 'owner',
    phone: '01822345678',
    status: 'active',
    maxDiscountPercent: 100,
  });

  // ===================== CATEGORIES (Shop 1) =====================
  const cat1 = categoryStorage.create({ shopId: shop1.id, name: "Men's Shirt" });
  const cat2 = categoryStorage.create({ shopId: shop1.id, name: "Men's Pant" });
  const cat3 = categoryStorage.create({ shopId: shop1.id, name: "Women's Dress" });
  const cat4 = categoryStorage.create({ shopId: shop1.id, name: "Women's Top" });
  const cat5 = categoryStorage.create({ shopId: shop1.id, name: "Kids Wear" });
  const cat6 = categoryStorage.create({ shopId: shop1.id, name: "Accessories" });

  // ===================== BRANDS (Shop 1) =====================
  const brand1 = brandStorage.create({ shopId: shop1.id, name: 'Cotton Comfort' });
  const brand2 = brandStorage.create({ shopId: shop1.id, name: 'Urban Style' });
  const brand3 = brandStorage.create({ shopId: shop1.id, name: 'FashionBD' });

  // ===================== SUPPLIERS (Shop 1) =====================
  const supplier1 = supplierStorage.create({
    shopId: shop1.id,
    name: 'Dhaka Textile',
    phone: '01812345678',
    company: 'Dhaka Textile Ltd.',
    address: 'Narsingdi, Dhaka',
    totalPurchase: 150000,
    dueAmount: 20000,
  });

  const supplier2 = supplierStorage.create({
    shopId: shop1.id,
    name: 'Mirpur Fashion House',
    phone: '01712345678',
    company: 'Mirpur Fashion House',
    address: 'Mirpur 10, Dhaka',
    totalPurchase: 80000,
    dueAmount: 0,
  });

  // ===================== PRODUCTS (Shop 1) =====================
  const product1 = productStorage.create({
    shopId: shop1.id,
    name: 'Premium Cotton Shirt',
    categoryId: cat1.id,
    brandId: brand1.id,
    sku: 'SHT-001',
    barcode: '1234567890',
    purchasePrice: 450,
    sellingPrice: 850,
    discountPrice: 750,
    supplierId: supplier1.id,
    description: 'High quality cotton shirt for men',
    status: 'active',
    lowStockAlert: 5,
    hasVariants: true,
    variants: [
      { id: 'v1', productId: '', shopId: shop1.id, color: 'Maroon', size: 'M', quantity: 15 },
      { id: 'v2', productId: '', shopId: shop1.id, color: 'Maroon', size: 'L', quantity: 20 },
      { id: 'v3', productId: '', shopId: shop1.id, color: 'Maroon', size: 'XL', quantity: 10 },
      { id: 'v4', productId: '', shopId: shop1.id, color: 'Black', size: 'M', quantity: 12 },
      { id: 'v5', productId: '', shopId: shop1.id, color: 'Black', size: 'L', quantity: 8 },
      { id: 'v6', productId: '', shopId: shop1.id, color: 'Black', size: 'XL', quantity: 4 },
      { id: 'v7', productId: '', shopId: shop1.id, color: 'White', size: 'M', quantity: 18 },
      { id: 'v8', productId: '', shopId: shop1.id, color: 'White', size: 'L', quantity: 14 },
    ],
    totalQuantity: 101,
  });

  const product2 = productStorage.create({
    shopId: shop1.id,
    name: 'Slim Fit Jeans',
    categoryId: cat2.id,
    brandId: brand2.id,
    sku: 'JNS-001',
    barcode: '2345678901',
    purchasePrice: 600,
    sellingPrice: 1200,
    supplierId: supplier1.id,
    description: 'Premium slim fit jeans',
    status: 'active',
    lowStockAlert: 5,
    hasVariants: true,
    variants: [
      { id: 'j1', productId: '', shopId: shop1.id, color: 'Blue', size: '30', quantity: 10 },
      { id: 'j2', productId: '', shopId: shop1.id, color: 'Blue', size: '32', quantity: 15 },
      { id: 'j3', productId: '', shopId: shop1.id, color: 'Blue', size: '34', quantity: 8 },
      { id: 'j4', productId: '', shopId: shop1.id, color: 'Black', size: '30', quantity: 6 },
      { id: 'j5', productId: '', shopId: shop1.id, color: 'Black', size: '32', quantity: 9 },
      { id: 'j6', productId: '', shopId: shop1.id, color: 'Black', size: '34', quantity: 3 },
    ],
    totalQuantity: 51,
  });

  const product3 = productStorage.create({
    shopId: shop1.id,
    name: 'Floral Summer Dress',
    categoryId: cat3.id,
    brandId: brand3.id,
    sku: 'DRS-001',
    barcode: '3456789012',
    purchasePrice: 500,
    sellingPrice: 1100,
    discountPrice: 950,
    supplierId: supplier2.id,
    description: 'Beautiful floral print summer dress',
    status: 'active',
    lowStockAlert: 3,
    hasVariants: true,
    variants: [
      { id: 'd1', productId: '', shopId: shop1.id, color: 'Red', size: 'S', quantity: 5 },
      { id: 'd2', productId: '', shopId: shop1.id, color: 'Red', size: 'M', quantity: 7 },
      { id: 'd3', productId: '', shopId: shop1.id, color: 'Blue', size: 'S', quantity: 4 },
      { id: 'd4', productId: '', shopId: shop1.id, color: 'Blue', size: 'M', quantity: 6 },
      { id: 'd5', productId: '', shopId: shop1.id, color: 'Pink', size: 'S', quantity: 3 },
      { id: 'd6', productId: '', shopId: shop1.id, color: 'Pink', size: 'M', quantity: 2 },
    ],
    totalQuantity: 27,
  });

  const product4 = productStorage.create({
    shopId: shop1.id,
    name: 'Casual T-Shirt',
    categoryId: cat1.id,
    sku: 'TSH-001',
    purchasePrice: 200,
    sellingPrice: 450,
    supplierId: supplier2.id,
    description: 'Comfortable casual t-shirt',
    status: 'active',
    lowStockAlert: 10,
    hasVariants: true,
    variants: [
      { id: 't1', productId: '', shopId: shop1.id, color: 'Navy', size: 'S', quantity: 20 },
      { id: 't2', productId: '', shopId: shop1.id, color: 'Navy', size: 'M', quantity: 25 },
      { id: 't3', productId: '', shopId: shop1.id, color: 'Navy', size: 'L', quantity: 15 },
      { id: 't4', productId: '', shopId: shop1.id, color: 'Grey', size: 'S', quantity: 12 },
      { id: 't5', productId: '', shopId: shop1.id, color: 'Grey', size: 'M', quantity: 18 },
    ],
    totalQuantity: 90,
  });

  const product5 = productStorage.create({
    shopId: shop1.id,
    name: 'Leather Belt',
    categoryId: cat6.id,
    sku: 'BLT-001',
    purchasePrice: 150,
    sellingPrice: 350,
    description: 'Premium leather belt',
    status: 'active',
    lowStockAlert: 5,
    hasVariants: false,
    variants: [],
    totalQuantity: 4, // low stock
  });

  // ===================== CUSTOMERS (Shop 1) =====================
  const customer1 = customerStorage.create({
    shopId: shop1.id,
    name: 'Nasrin Akter',
    phone: '01812345600',
    address: 'Mirpur, Dhaka',
    email: 'nasrin@email.com',
    totalPurchase: 8500,
    totalDue: 0,
    lastPurchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Regular customer',
    points: 100
  } as any);

  const customer2 = customerStorage.create({
    shopId: shop1.id,
    name: 'Habib Rahman',
    phone: '01912345601',
    address: 'Uttara, Dhaka',
    totalPurchase: 15200,
    totalDue: 2000,
    lastPurchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    points: 50
  } as any);

  const customer3 = customerStorage.create({
    shopId: shop1.id,
    name: 'Sultana Parvin',
    phone: '01712345602',
    address: 'Mohammadpur, Dhaka',
    totalPurchase: 4200,
    totalDue: 0,
    lastPurchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    points: 20
  } as any);

  // ===================== DEMO SALES (Shop 1) =====================
  const createDemoSale = (daysAgo: number, items: any[], cashierId: string, cashierName: string, customerId?: string, customerName?: string) => {
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const invoiceNum = saleStorage.generateInvoiceNumber(shop1.id, shop1.invoicePrefix);
    return saleStorage.create({
      shopId: shop1.id,
      cashierId,
      cashierName,
      customerId,
      customerName,
      invoiceNumber: invoiceNum,
      items,
      subtotal,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: subtotal,
      payments: [{ method: 'cash', amount: subtotal }],
      paidAmount: subtotal,
      dueAmount: 0,
      status: 'completed',
      createdAt: date,
    } as any);
  };

  // Today's sales
  createDemoSale(0, [
    { id: 's1', productId: product1.id, variantId: 'v1', productName: 'Premium Cotton Shirt', color: 'Maroon', size: 'M', quantity: 2, unitPrice: 850, discount: 0, total: 1700, purchasePrice: 450 },
  ], cashier1.id, cashier1.name, customer1.id, customer1.name);

  createDemoSale(0, [
    { id: 's2', productId: product2.id, variantId: 'j2', productName: 'Slim Fit Jeans', color: 'Blue', size: '32', quantity: 1, unitPrice: 1200, discount: 0, total: 1200, purchasePrice: 600 },
    { id: 's3', productId: product4.id, variantId: 't2', productName: 'Casual T-Shirt', color: 'Navy', size: 'M', quantity: 2, unitPrice: 450, discount: 0, total: 900, purchasePrice: 200 },
  ], cashier1.id, cashier1.name, customer2.id, customer2.name);

  // Yesterday
  createDemoSale(1, [
    { id: 's4', productId: product3.id, variantId: 'd2', productName: 'Floral Summer Dress', color: 'Red', size: 'M', quantity: 1, unitPrice: 950, discount: 0, total: 950, purchasePrice: 500 },
  ], cashier1.id, cashier1.name);

  createDemoSale(1, [
    { id: 's5', productId: product1.id, variantId: 'v5', productName: 'Premium Cotton Shirt', color: 'Black', size: 'L', quantity: 3, unitPrice: 850, discount: 50, total: 2400, purchasePrice: 450 },
  ], cashier1.id, cashier1.name, customer3.id, customer3.name);

  // 2 days ago
  createDemoSale(2, [
    { id: 's6', productId: product4.id, variantId: 't3', productName: 'Casual T-Shirt', color: 'Navy', size: 'L', quantity: 4, unitPrice: 450, discount: 0, total: 1800, purchasePrice: 200 },
  ], cashier1.id, cashier1.name);

  // 5 days ago  
  createDemoSale(5, [
    { id: 's7', productId: product2.id, variantId: 'j3', productName: 'Slim Fit Jeans', color: 'Blue', size: '34', quantity: 2, unitPrice: 1200, discount: 100, total: 2300, purchasePrice: 600 },
    { id: 's8', productId: product5.id, productName: 'Leather Belt', quantity: 1, unitPrice: 350, discount: 0, total: 350, purchasePrice: 150 },
  ], manager1.id, manager1.name, customer2.id, customer2.name);

  // 7 days ago
  createDemoSale(7, [
    { id: 's9', productId: product1.id, variantId: 'v7', productName: 'Premium Cotton Shirt', color: 'White', size: 'M', quantity: 5, unitPrice: 850, discount: 0, total: 4250, purchasePrice: 450 },
  ], cashier1.id, cashier1.name);

  // ===================== EXPENSES (Shop 1) =====================
  expenseStorage.create({
    shopId: shop1.id,
    category: 'Shop Rent',
    amount: 25000,
    description: 'Monthly shop rent - April 2026',
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: owner1.name,
  });

  expenseStorage.create({
    shopId: shop1.id,
    category: 'Electricity Bill',
    amount: 3500,
    description: 'Monthly electricity - April 2026',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: owner1.name,
  });

  expenseStorage.create({
    shopId: shop1.id,
    category: 'Staff Salary',
    amount: 18000,
    description: 'Staff salary - April 2026',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: owner1.name,
  });

  expenseStorage.create({
    shopId: shop1.id,
    category: 'Internet Bill',
    amount: 800,
    description: 'Monthly internet - April 2026',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: owner1.name,
  });

  expenseStorage.create({
    shopId: shop1.id,
    category: 'Packaging',
    amount: 2000,
    description: 'Shopping bags & packaging',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: manager1.name,
  });

  // ===================== ACTIVITY LOGS =====================
  activityLogStorage.create({
    shopId: shop1.id,
    userId: cashier1.id,
    userName: cashier1.name,
    action: 'Created invoice',
    details: 'Created invoice #OR-0001',
  });

  activityLogStorage.create({
    shopId: shop1.id,
    userId: manager1.id,
    userName: manager1.name,
    action: 'Updated stock',
    details: 'Updated stock for Premium Cotton Shirt (White - M)',
  });

  activityLogStorage.create({
    shopId: shop1.id,
    userId: owner1.id,
    userName: owner1.name,
    action: 'Added product',
    details: 'Added new product: Leather Belt',
  });

  markInitialized();
}
