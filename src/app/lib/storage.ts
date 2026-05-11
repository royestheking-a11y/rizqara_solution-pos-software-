import { 
  User, Shop, Package, Category, Brand, Supplier, Product, ProductVariant,
  Sale, Customer, Purchase, Return, Expense, StockMovement, ActivityLog,
  Notification, SupportTicket, HeldOrder
} from './types';
import { Register } from './types';

// ===================== STORAGE KEYS =====================
const KEYS = {
  USERS: 'users',
  SHOPS: 'shops',
  PACKAGES: 'packages',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  SUPPLIERS: 'suppliers',
  PRODUCTS: 'products',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  PURCHASES: 'purchases',
  RETURNS: 'returns',
  EXPENSES: 'expenses',
  STOCK_MOVEMENTS: 'stockMovements',
  ACTIVITY_LOGS: 'activityLogs',
  NOTIFICATIONS: 'notifications',
  SUPPORT_TICKETS: 'supportTickets',
  HELD_ORDERS: 'heldOrders',
  REGISTERS: 'registers',
  ANNOUNCEMENTS: 'announcements',
  SYSTEM_SETTINGS: 'system_settings',
  INVOICE_COUNTER: 'invoice_counter',
  INITIALIZED: 'initialized',
  SYNC_QUEUE: 'sync_queue',
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ===================== GENERIC STORAGE HELPERS =====================
function getAll<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(`rizqara_${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setAll<T>(key: string, items: T[]): void {
  localStorage.setItem(`rizqara_${key}`, JSON.stringify(items));
}

function getAuthHeaders(): Record<string, string> {
  try {
    const saved = localStorage.getItem('rizqara_auth_session');
    if (!saved) return {};
    const { userId } = JSON.parse(saved);
    const usersData = localStorage.getItem('rizqara_users');
    if (!usersData) return {};
    const users = JSON.parse(usersData);
    const user = users.find((u: any) => u.id === userId);
    if (!user) return {};
    return {
      'x-user-id': String(user.id),
      'x-user-name': String(user.name)
    };
  } catch {
    return {};
  }
}

// API Helpers
async function apiGet<T>(key: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}/${key}`);
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch ${key}:`, err);
    return [];
  }
}

async function apiPost<T>(key: string, data: any): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/${key}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Post failed');
    return await res.json();
  } catch (err) {
    console.warn(`Post failed for ${key}, adding to queue:`, err);
    addToSyncQueue('POST', key, data);
    return null;
  }
}

async function apiPut<T>(key: string, id: string, data: any): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/${key}/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Put failed');
    return await res.json();
  } catch (err) {
    console.warn(`Put failed for ${key}/${id}, adding to queue:`, err);
    addToSyncQueue('PUT', key, data);
    return null;
  }
}

async function apiDelete(key: string, id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/${key}/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Delete failed');
  } catch (err) {
    console.warn(`Delete failed for ${key}/${id}, adding to queue:`, err);
    addToSyncQueue('DELETE', key, { id });
  }
}

// ===================== SYNC QUEUE LOGIC =====================
interface SyncItem {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  key: string;
  data: any;
  timestamp: string;
}

function getSyncQueue(): SyncItem[] {
  try {
    const data = localStorage.getItem(`rizqara_${KEYS.SYNC_QUEUE}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setSyncQueue(queue: SyncItem[]): void {
  localStorage.setItem(`rizqara_${KEYS.SYNC_QUEUE}`, JSON.stringify(queue));
}

function addToSyncQueue(method: 'POST' | 'PUT' | 'DELETE', key: string, data: any) {
  const queue = getSyncQueue();
  // For PUT/DELETE, if there's already a pending operation for the same ID, update it or keep the latest
  if (method === 'PUT' || method === 'DELETE') {
    const existingIdx = queue.findIndex(item => item.key === key && item.data.id === data.id);
    if (existingIdx >= 0) {
      // If we are deleting something that was pending an update, just delete it
      if (method === 'DELETE') {
        queue[existingIdx] = { id: generateId(), method, key, data, timestamp: new Date().toISOString() };
      } else {
        // Update existing pending data
        queue[existingIdx].data = { ...queue[existingIdx].data, ...data };
      }
      setSyncQueue(queue);
      return;
    }
  }
  
  queue.push({ id: generateId(), method, key, data, timestamp: new Date().toISOString() });
  setSyncQueue(queue);
  
  // Try processing immediately if online
  if (navigator.onLine) {
    processSyncQueue();
  }
}

let isProcessingQueue = false;
export async function processSyncQueue() {
  if (isProcessingQueue || !navigator.onLine) return;
  
  const queue = getSyncQueue();
  if (queue.length === 0) return;
  
  isProcessingQueue = true;
  console.log(`Processing sync queue: ${queue.length} items...`);
  
  const remainingQueue: SyncItem[] = [];
  
  for (const item of queue) {
    try {
      let res;
      if (item.method === 'POST') {
        res = await fetch(`${API_BASE}/${item.key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
      } else if (item.method === 'PUT') {
        res = await fetch(`${API_BASE}/${item.key}/${item.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
      } else if (item.method === 'DELETE') {
        res = await fetch(`${API_BASE}/${item.key}/${item.data.id}`, {
          method: 'DELETE'
        });
      }
      
      if (!res?.ok) {
        console.error(`Failed to sync item ${item.id}, keeping in queue.`);
        remainingQueue.push(item);
      }
    } catch (err) {
      console.error(`Network error syncing item ${item.id}, keeping in queue.`, err);
      remainingQueue.push(item);
      // Stop processing for now if it's a network error
      break;
    }
  }
  
  setSyncQueue(remainingQueue);
  isProcessingQueue = false;
  console.log(`Sync queue processing finished. ${remainingQueue.length} items remaining.`);
}

// Global Online Listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Internet back! Starting sync...');
    processSyncQueue();
  });
  
  // Also check periodically
  setInterval(processSyncQueue, 60000); // Every minute
}

// Global Sync
export async function syncWithMongoDB(specificKey?: string) {
  const isMigrated = localStorage.getItem('rizqara_mongo_migrated') === 'true';
  if (!isMigrated) {
    console.log('Skipping sync: migration not yet complete.');
    return;
  }

  console.log(specificKey ? `Partial sync: ${specificKey}...` : 'Full sync with MongoDB...');
  const collections = specificKey 
    ? [specificKey] 
    : Object.values(KEYS).filter(k => 
        k !== KEYS.INVOICE_COUNTER && 
        k !== KEYS.INITIALIZED && 
        k !== KEYS.SYNC_QUEUE
      );
  
  for (const key of collections) {
    try {
      const remoteData = await apiGet(key);
      if (remoteData && Array.isArray(remoteData)) {
        // Safety check: Don't wipe local data if remote is empty and we have local items
        const localData = getAll(key);
        if (remoteData.length === 0 && localData.length > 0 && !specificKey) {
          console.log(`Skipping sync for ${key}: remote is empty but local has ${localData.length} items.`);
          continue;
        }
        setAll(key, remoteData);
      }
    } catch (err) {
      console.error(`Sync failed for ${key}:`, err);
    }
  }
  console.log(specificKey ? `Partial sync for ${specificKey} complete.` : 'Sync complete');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function now(): string {
  return new Date().toISOString();
}

// ===================== PACKAGES =====================
export const packageStorage = {
  getAll: (): Package[] => getAll<Package>(KEYS.PACKAGES),
  getById: (id: string): Package | undefined => getAll<Package>(KEYS.PACKAGES).find(p => p.id === id),
  save: (pkg: Package): Package => {
    const packages = getAll<Package>(KEYS.PACKAGES);
    const idx = packages.findIndex(p => p.id === pkg.id);
    if (idx >= 0) {
      packages[idx] = pkg;
      apiPut(KEYS.PACKAGES, pkg.id, pkg);
    } else {
      packages.push(pkg);
      apiPost(KEYS.PACKAGES, pkg);
    }
    setAll(KEYS.PACKAGES, packages);
    return pkg;
  },
  delete: (id: string): void => {
    const packages = getAll<Package>(KEYS.PACKAGES).filter(p => p.id !== id);
    setAll(KEYS.PACKAGES, packages);
    apiDelete(KEYS.PACKAGES, id);
  },
};

// ===================== USERS =====================
export const userStorage = {
  getAll: (): User[] => getAll<User>(KEYS.USERS),
  getById: (id: string): User | undefined => getAll<User>(KEYS.USERS).find(u => u.id === id),
  getByEmail: (email: string): User | undefined => getAll<User>(KEYS.USERS).find(u => u.email.toLowerCase() === email.toLowerCase()),
  getByShop: (shopId: string): User[] => getAll<User>(KEYS.USERS).filter(u => u.shopId === shopId),
  create: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = { ...user, id: generateId(), createdAt: now() };
    const users = getAll<User>(KEYS.USERS);
    users.push(newUser);
    setAll(KEYS.USERS, users);
    apiPost(KEYS.USERS, newUser);
    return newUser;
  },
  update: (user: User): User => {
    const users = getAll<User>(KEYS.USERS);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    setAll(KEYS.USERS, users);
    apiPut(KEYS.USERS, user.id, user);
    return user;
  },
  delete: (id: string): void => {
    const users = getAll<User>(KEYS.USERS).filter(u => u.id !== id);
    setAll(KEYS.USERS, users);
    apiDelete(KEYS.USERS, id);
  },
  authenticate: (email: string, password: string): User | null => {
    const user = getAll<User>(KEYS.USERS).find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.status === 'active'
    );
    return user || null;
  },
};

// ===================== SHOPS =====================
export const shopStorage = {
  getAll: (): Shop[] => getAll<Shop>(KEYS.SHOPS),
  getById: (id: string): Shop | undefined => getAll<Shop>(KEYS.SHOPS).find(s => s.id === id),
  getByOwner: (targetOwnerId: string): Shop[] => getAll<Shop>(KEYS.SHOPS).filter(s => s.ownerId === targetOwnerId),
  create: (shop: Omit<Shop, 'id' | 'createdAt'>): Shop => {
    const newShop: Shop = { 
      ...shop, 
      id: generateId(), 
      createdAt: now(),
      loyaltyRatio: 0.01, // default 1%
      pointValue: 1,      // 1 point = 1 TK
    };
    const shops = getAll<Shop>(KEYS.SHOPS);
    shops.push(newShop);
    setAll(KEYS.SHOPS, shops);
    apiPost(KEYS.SHOPS, newShop);
    return newShop;
  },
  update: (shop: Shop): Shop => {
    const shops = getAll<Shop>(KEYS.SHOPS);
    const idx = shops.findIndex(s => s.id === shop.id);
    if (idx >= 0) shops[idx] = shop;
    setAll(KEYS.SHOPS, shops);
    apiPut(KEYS.SHOPS, shop.id, shop);
    return shop;
  },
  delete: (id: string): void => {
    const shops = getAll<Shop>(KEYS.SHOPS).filter(s => s.id !== id);
    setAll(KEYS.SHOPS, shops);
    apiDelete(KEYS.SHOPS, id);
  },
};

// ===================== CATEGORIES =====================
export const categoryStorage = {
  getAll: (): Category[] => getAll<Category>(KEYS.CATEGORIES),
  getByShop: (shopId: string): Category[] => getAll<Category>(KEYS.CATEGORIES).filter(c => c.shopId === shopId),
  create: (category: Omit<Category, 'id' | 'createdAt'>): Category => {
    const newCategory: Category = { ...category, id: generateId(), createdAt: now() };
    const categories = getAll<Category>(KEYS.CATEGORIES);
    categories.push(newCategory);
    setAll(KEYS.CATEGORIES, categories);
    apiPost(KEYS.CATEGORIES, newCategory);
    return newCategory;
  },
  update: (category: Category): Category => {
    const categories = getAll<Category>(KEYS.CATEGORIES);
    const idx = categories.findIndex(c => c.id === category.id);
    if (idx >= 0) categories[idx] = category;
    setAll(KEYS.CATEGORIES, categories);
    apiPut(KEYS.CATEGORIES, category.id, category);
    return category;
  },
  delete: (id: string): void => {
    const categories = getAll<Category>(KEYS.CATEGORIES).filter(c => c.id !== id);
    setAll(KEYS.CATEGORIES, categories);
    apiDelete(KEYS.CATEGORIES, id);
  },
};

// ===================== BRANDS =====================
export const brandStorage = {
  getAll: (): Brand[] => getAll<Brand>(KEYS.BRANDS),
  getByShop: (shopId: string): Brand[] => getAll<Brand>(KEYS.BRANDS).filter(b => b.shopId === shopId),
  create: (brand: Omit<Brand, 'id' | 'createdAt'>): Brand => {
    const newBrand: Brand = { ...brand, id: generateId(), createdAt: now() };
    const brands = getAll<Brand>(KEYS.BRANDS);
    brands.push(newBrand);
    setAll(KEYS.BRANDS, brands);
    apiPost(KEYS.BRANDS, newBrand);
    return newBrand;
  },
  update: (brand: Brand): Brand => {
    const brands = getAll<Brand>(KEYS.BRANDS);
    const idx = brands.findIndex(b => b.id === brand.id);
    if (idx >= 0) brands[idx] = brand;
    setAll(KEYS.BRANDS, brands);
    apiPut(KEYS.BRANDS, brand.id, brand);
    return brand;
  },
  delete: (id: string): void => {
    const brands = getAll<Brand>(KEYS.BRANDS).filter(b => b.id !== id);
    setAll(KEYS.BRANDS, brands);
    apiDelete(KEYS.BRANDS, id);
  },
};

// ===================== SUPPLIERS =====================
export const supplierStorage = {
  getAll: (): Supplier[] => getAll<Supplier>(KEYS.SUPPLIERS),
  getByShop: (shopId: string): Supplier[] => getAll<Supplier>(KEYS.SUPPLIERS).filter(s => s.shopId === shopId),
  getById: (id: string): Supplier | undefined => getAll<Supplier>(KEYS.SUPPLIERS).find(s => s.id === id),
  create: (supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newSupplier: Supplier = { ...supplier, id: generateId(), createdAt: now() };
    const suppliers = getAll<Supplier>(KEYS.SUPPLIERS);
    suppliers.push(newSupplier);
    setAll(KEYS.SUPPLIERS, suppliers);
    apiPost(KEYS.SUPPLIERS, newSupplier);
    return newSupplier;
  },
  update: (supplier: Supplier): Supplier => {
    const suppliers = getAll<Supplier>(KEYS.SUPPLIERS);
    const idx = suppliers.findIndex(s => s.id === supplier.id);
    if (idx >= 0) suppliers[idx] = supplier;
    setAll(KEYS.SUPPLIERS, suppliers);
    apiPut(KEYS.SUPPLIERS, supplier.id, supplier);
    return supplier;
  },
  delete: (id: string): void => {
    const suppliers = getAll<Supplier>(KEYS.SUPPLIERS).filter(s => s.id !== id);
    setAll(KEYS.SUPPLIERS, suppliers);
    apiDelete(KEYS.SUPPLIERS, id);
  },
};

// ===================== PRODUCTS =====================
export const productStorage = {
  getAll: (): Product[] => getAll<Product>(KEYS.PRODUCTS),
  getByShop: (shopId: string): Product[] => getAll<Product>(KEYS.PRODUCTS).filter(p => p.shopId === shopId),
  getById: (id: string): Product | undefined => getAll<Product>(KEYS.PRODUCTS).find(p => p.id === id),
  create: (product: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct: Product = { ...product, id: generateId(), createdAt: now() };
    const products = getAll<Product>(KEYS.PRODUCTS);
    products.push(newProduct);
    setAll(KEYS.PRODUCTS, products);
    apiPost(KEYS.PRODUCTS, newProduct);
    return newProduct;
  },
  update: (product: Product): Product => {
    const products = getAll<Product>(KEYS.PRODUCTS);
    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) products[idx] = product;
    setAll(KEYS.PRODUCTS, products);
    apiPut(KEYS.PRODUCTS, product.id, product);
    return product;
  },
  delete: (id: string): void => {
    const products = getAll<Product>(KEYS.PRODUCTS).filter(p => p.id !== id);
    setAll(KEYS.PRODUCTS, products);
    apiDelete(KEYS.PRODUCTS, id);
  },
  updateVariantStock: (productId: string, variantId: string, quantityChange: number): void => {
    const products = getAll<Product>(KEYS.PRODUCTS);
    const productIdx = products.findIndex(p => p.id === productId);
      if (productIdx >= 0) {
        const variantIdx = products[productIdx].variants.findIndex(v => v.id === variantId);
        if (variantIdx >= 0) {
          products[productIdx].variants[variantIdx].quantity += quantityChange;
          products[productIdx].totalQuantity = products[productIdx].variants.reduce((sum, v) => sum + v.quantity, 0);
          
          // Sync with MongoDB
          apiPut(KEYS.PRODUCTS, productId, products[productIdx]);
        }
        setAll(KEYS.PRODUCTS, products);
      }
  },
  updateStock: (productId: string, quantityChange: number): void => {
    const products = getAll<Product>(KEYS.PRODUCTS);
    const productIdx = products.findIndex(p => p.id === productId);
    if (productIdx >= 0) {
      products[productIdx].totalQuantity += quantityChange;
      setAll(KEYS.PRODUCTS, products);
      
      // Sync with MongoDB
      apiPut(KEYS.PRODUCTS, productId, products[productIdx]);
    }
  },
};

// ===================== SALES =====================
export const saleStorage = {
  getAll: (): Sale[] => getAll<Sale>(KEYS.SALES),
  getByShop: (shopId: string): Sale[] => getAll<Sale>(KEYS.SALES).filter(s => s.shopId === shopId),
  getById: (id: string): Sale | undefined => getAll<Sale>(KEYS.SALES).find(s => s.id === id),
  create: (sale: Omit<Sale, 'id' | 'createdAt'>): Sale => {
    const newSale: Sale = { ...sale, id: generateId(), createdAt: now() };
    const sales = getAll<Sale>(KEYS.SALES);
    sales.push(newSale);
    setAll(KEYS.SALES, sales);
    apiPost(KEYS.SALES, newSale);

    // Update customer points
    if (sale.customerId) {
      const customer = customerStorage.getById(sale.customerId);
      if (customer) {
        let updatedPoints = customer.points;
        if (sale.pointsRedeemed) {
          updatedPoints -= sale.pointsRedeemed;
        }
        if (sale.pointsEarned) {
          updatedPoints += sale.pointsEarned;
        }
        customerStorage.update({ ...customer, points: updatedPoints });
      }
    }

    return newSale;
  },
  update: (sale: Sale): Sale => {
    const sales = getAll<Sale>(KEYS.SALES);
    const idx = sales.findIndex(s => s.id === sale.id);
    if (idx >= 0) {
      sales[idx] = sale;
      apiPut(KEYS.SALES, sale.id, sale);
    }
    setAll(KEYS.SALES, sales);
    return sale;
  },
  generateInvoiceNumber: (shopId: string, prefix: string): string => {
    const key = `${KEYS.INVOICE_COUNTER}_${shopId}`;
    const current = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, current.toString());
    return `${prefix}${current.toString().padStart(4, '0')}`;
  },
  delete: (id: string): void => {
    const sales = getAll<Sale>(KEYS.SALES).filter(s => s.id !== id);
    setAll(KEYS.SALES, sales);
    apiDelete(KEYS.SALES, id);
  },
};

// ===================== CUSTOMERS =====================
export const customerStorage = {
  getAll: (): Customer[] => getAll<Customer>(KEYS.CUSTOMERS),
  getByShop: (shopId: string): Customer[] => getAll<Customer>(KEYS.CUSTOMERS).filter(c => c.shopId === shopId),
  getById: (id: string): Customer | undefined => getAll<Customer>(KEYS.CUSTOMERS).find(c => c.id === id),
  getByPhone: (shopId: string, phone: string): Customer | undefined => 
    getAll<Customer>(KEYS.CUSTOMERS).find(c => c.shopId === shopId && c.phone === phone),
  create: (customer: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = { ...customer, id: generateId(), createdAt: now(), points: 0 };
    const customers = getAll<Customer>(KEYS.CUSTOMERS);
    customers.push(newCustomer);
    setAll(KEYS.CUSTOMERS, customers);
    apiPost(KEYS.CUSTOMERS, newCustomer);
    return newCustomer;
  },
  update: (customer: Customer): Customer => {
    const customers = getAll<Customer>(KEYS.CUSTOMERS);
    const idx = customers.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
      apiPut(KEYS.CUSTOMERS, customer.id, customer);
    }
    setAll(KEYS.CUSTOMERS, customers);
    return customer;
  },
  delete: (id: string): void => {
    const customers = getAll<Customer>(KEYS.CUSTOMERS).filter(c => c.id !== id);
    setAll(KEYS.CUSTOMERS, customers);
    apiDelete(KEYS.CUSTOMERS, id);
  },
};

// ===================== PURCHASES =====================
export const purchaseStorage = {
  getAll: (): Purchase[] => getAll<Purchase>(KEYS.PURCHASES),
  getByShop: (shopId: string): Purchase[] => getAll<Purchase>(KEYS.PURCHASES).filter(p => p.shopId === shopId),
  create: (purchase: Omit<Purchase, 'id' | 'createdAt'>): Purchase => {
    const newPurchase: Purchase = { ...purchase, id: generateId(), createdAt: now() };
    const purchases = getAll<Purchase>(KEYS.PURCHASES);
    purchases.push(newPurchase);
    setAll(KEYS.PURCHASES, purchases);
    apiPost(KEYS.PURCHASES, newPurchase);
    return newPurchase;
  },
  update: (purchase: Purchase): Purchase => {
    const purchases = getAll<Purchase>(KEYS.PURCHASES);
    const idx = purchases.findIndex(p => p.id === purchase.id);
    if (idx >= 0) {
      purchases[idx] = purchase;
      apiPut(KEYS.PURCHASES, purchase.id, purchase);
    }
    setAll(KEYS.PURCHASES, purchases);
    return purchase;
  },
  delete: (id: string): void => {
    const purchases = getAll<Purchase>(KEYS.PURCHASES).filter(p => p.id !== id);
    setAll(KEYS.PURCHASES, purchases);
    apiDelete(KEYS.PURCHASES, id);
  },
};

// ===================== RETURNS =====================
export const returnStorage = {
  getAll: (): Return[] => getAll<Return>(KEYS.RETURNS),
  getByShop: (shopId: string): Return[] => getAll<Return>(KEYS.RETURNS).filter(r => r.shopId === shopId),
  create: (ret: Omit<Return, 'id' | 'createdAt'>): Return => {
    const newReturn: Return = { ...ret, id: generateId(), createdAt: now() };
    const returns = getAll<Return>(KEYS.RETURNS);
    returns.push(newReturn);
    setAll(KEYS.RETURNS, returns);
    apiPost(KEYS.RETURNS, newReturn);
    return newReturn;
  },
  update: (ret: Return): Return => {
    const returns = getAll<Return>(KEYS.RETURNS);
    const idx = returns.findIndex(r => r.id === ret.id);
    if (idx >= 0) {
      returns[idx] = ret;
      apiPut(KEYS.RETURNS, ret.id, ret);
    }
    setAll(KEYS.RETURNS, returns);
    return ret;
  },
};

// ===================== EXPENSES =====================
export const expenseStorage = {
  getAll: (): Expense[] => getAll<Expense>(KEYS.EXPENSES),
  getByShop: (shopId: string): Expense[] => getAll<Expense>(KEYS.EXPENSES).filter(e => e.shopId === shopId),
  create: (expense: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const newExpense: Expense = { ...expense, id: generateId(), createdAt: now() };
    const expenses = getAll<Expense>(KEYS.EXPENSES);
    expenses.push(newExpense);
    setAll(KEYS.EXPENSES, expenses);
    apiPost(KEYS.EXPENSES, newExpense);
    return newExpense;
  },
  update: (expense: Expense): Expense => {
    const expenses = getAll<Expense>(KEYS.EXPENSES);
    const idx = expenses.findIndex(e => e.id === expense.id);
    if (idx >= 0) {
      expenses[idx] = expense;
      apiPut(KEYS.EXPENSES, expense.id, expense);
    }
    setAll(KEYS.EXPENSES, expenses);
    return expense;
  },
  delete: (id: string): void => {
    const expenses = getAll<Expense>(KEYS.EXPENSES).filter(e => e.id !== id);
    setAll(KEYS.EXPENSES, expenses);
    apiDelete(KEYS.EXPENSES, id);
  },
};

// ===================== STOCK MOVEMENTS =====================
export const stockMovementStorage = {
  getAll: (): StockMovement[] => getAll<StockMovement>(KEYS.STOCK_MOVEMENTS),
  getByShop: (shopId: string): StockMovement[] => getAll<StockMovement>(KEYS.STOCK_MOVEMENTS).filter(s => s.shopId === shopId),
  create: (movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement => {
    const newMovement: StockMovement = { ...movement, id: generateId(), createdAt: now() } as any;
    const movements = getAll<StockMovement>(KEYS.STOCK_MOVEMENTS);
    movements.push(newMovement);
    setAll(KEYS.STOCK_MOVEMENTS, movements);
    apiPost(KEYS.STOCK_MOVEMENTS, newMovement);
    return newMovement;
  },
};

// ===================== ACTIVITY LOGS =====================
export const activityLogStorage = {
  getAll: (): ActivityLog[] => getAll<ActivityLog>(KEYS.ACTIVITY_LOGS),
  getByShop: (shopId: string): ActivityLog[] => getAll<ActivityLog>(KEYS.ACTIVITY_LOGS).filter(l => l.shopId === shopId),
  create: (log: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog => {
    const newLog: ActivityLog = { ...log, id: generateId(), createdAt: now() };
    const logs = getAll<ActivityLog>(KEYS.ACTIVITY_LOGS);
    logs.unshift(newLog); // Add to front
    // Keep only last 1000 logs
    if (logs.length > 1000) logs.splice(1000);
    setAll(KEYS.ACTIVITY_LOGS, logs);
    apiPost(KEYS.ACTIVITY_LOGS, newLog);
    return newLog;
  },
};

// ===================== NOTIFICATIONS =====================
export const notificationStorage = {
  getAll: (): Notification[] => getAll<Notification>(KEYS.NOTIFICATIONS),
  getByUser: (shopId: string | null): Notification[] => 
    getAll<Notification>(KEYS.NOTIFICATIONS).filter(n => n.shopId === shopId),
  create: (notification: Omit<Notification, 'id' | 'createdAt'>): Notification => {
    const newNotif: Notification = { ...notification, id: generateId(), createdAt: now() };
    const notifications = getAll<Notification>(KEYS.NOTIFICATIONS);
    notifications.unshift(newNotif);
    setAll(KEYS.NOTIFICATIONS, notifications);
    apiPost(KEYS.NOTIFICATIONS, newNotif);
    return newNotif;
  },
  markRead: (id: string): void => {
    const notifications = getAll<Notification>(KEYS.NOTIFICATIONS);
    const idx = notifications.findIndex(n => n.id === id);
    if (idx >= 0) {
      notifications[idx].read = true;
      apiPut(KEYS.NOTIFICATIONS, id, notifications[idx]);
    }
    setAll(KEYS.NOTIFICATIONS, notifications);
  },
  markAllRead: (shopId: string | null): void => {
    const notifications = getAll<Notification>(KEYS.NOTIFICATIONS).map(n =>
      n.shopId === shopId ? { ...n, read: true } : n
    );
    setAll(KEYS.NOTIFICATIONS, notifications);
    // Note: apiPut might need to be called per item here
  },
};

// ===================== SUPPORT TICKETS =====================
export const supportTicketStorage = {
  getAll: (): SupportTicket[] => getAll<SupportTicket>(KEYS.SUPPORT_TICKETS),
  getByShop: (shopId: string): SupportTicket[] => getAll<SupportTicket>(KEYS.SUPPORT_TICKETS).filter(t => t.shopId === shopId),
  create: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): SupportTicket => {
    const newTicket: SupportTicket = { ...ticket, id: generateId(), createdAt: now(), updatedAt: now() };
    const tickets = getAll<SupportTicket>(KEYS.SUPPORT_TICKETS);
    tickets.push(newTicket);
    setAll(KEYS.SUPPORT_TICKETS, tickets);
    apiPost(KEYS.SUPPORT_TICKETS, newTicket);
    return newTicket;
  },
  update: (ticket: SupportTicket): SupportTicket => {
    const tickets = getAll<SupportTicket>(KEYS.SUPPORT_TICKETS);
    const idx = tickets.findIndex(t => t.id === ticket.id);
    if (idx >= 0) {
      tickets[idx] = { ...ticket, updatedAt: now() };
      apiPut(KEYS.SUPPORT_TICKETS, ticket.id, tickets[idx]);
    }
    setAll(KEYS.SUPPORT_TICKETS, tickets);
    return ticket;
  },
};

// ===================== HELD ORDERS =====================
export const heldOrderStorage = {
  getAll: (): HeldOrder[] => getAll<HeldOrder>(KEYS.HELD_ORDERS),
  getByShop: (shopId: string): HeldOrder[] => getAll<HeldOrder>(KEYS.HELD_ORDERS).filter(o => o.shopId === shopId),
  create: (order: Omit<HeldOrder, 'id' | 'createdAt'>): HeldOrder => {
    const newOrder: HeldOrder = { ...order, id: generateId(), createdAt: now() };
    const orders = getAll<HeldOrder>(KEYS.HELD_ORDERS);
    orders.push(newOrder);
    setAll(KEYS.HELD_ORDERS, orders);
    apiPost(KEYS.HELD_ORDERS, newOrder);
    return newOrder;
  },
  delete: (id: string): void => {
    const orders = getAll<HeldOrder>(KEYS.HELD_ORDERS).filter(o => o.id !== id);
    setAll(KEYS.HELD_ORDERS, orders);
    apiDelete(KEYS.HELD_ORDERS, id);
  },
};

// ===================== REGISTERS =====================
export const registerStorage = {
  getAll: (): Register[] => getAll<Register>(KEYS.REGISTERS),
  getByShop: (shopId: string): Register[] => getAll<Register>(KEYS.REGISTERS).filter(r => r.shopId === shopId),
  getOpenByCashier: (shopId: string, cashierId: string): Register | undefined => 
    getAll<Register>(KEYS.REGISTERS).find(r => r.shopId === shopId && r.cashierId === cashierId && r.status === 'open'),
  create: (register: Omit<Register, 'id' | 'createdAt'>): Register => {
    const newRegister: Register = { ...register, id: generateId(), createdAt: now() };
    const registers = getAll<Register>(KEYS.REGISTERS);
    registers.push(newRegister);
    setAll(KEYS.REGISTERS, registers);
    apiPost(KEYS.REGISTERS, newRegister);
    return newRegister;
  },
  update: (register: Register): Register => {
    const registers = getAll<Register>(KEYS.REGISTERS);
    const idx = registers.findIndex(r => r.id === register.id);
    if (idx >= 0) {
      registers[idx] = register;
      apiPut(KEYS.REGISTERS, register.id, register);
    }
    setAll(KEYS.REGISTERS, registers);
    return register;
  },
};

// ===================== ANNOUNCEMENTS =====================
export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'maintenance';
  audience: 'all' | 'owners' | 'managers' | 'cashiers';
  pinned: boolean;
  active: boolean;
  createdAt: string;
}

export const announcementStorage = {
  getAll: (): Announcement[] => getAll<Announcement>(KEYS.ANNOUNCEMENTS),
  create: (ann: Omit<Announcement, 'id' | 'createdAt'>): Announcement => {
    const newAnn: Announcement = { ...ann, id: generateId(), createdAt: now() };
    const announcements = getAll<Announcement>(KEYS.ANNOUNCEMENTS);
    announcements.push(newAnn);
    setAll(KEYS.ANNOUNCEMENTS, announcements);
    apiPost(KEYS.ANNOUNCEMENTS, newAnn);
    return newAnn;
  },
  update: (ann: Announcement): Announcement => {
    const announcements = getAll<Announcement>(KEYS.ANNOUNCEMENTS);
    const idx = announcements.findIndex(a => a.id === ann.id);
    if (idx >= 0) {
      announcements[idx] = ann;
      apiPut(KEYS.ANNOUNCEMENTS, ann.id, ann);
    }
    setAll(KEYS.ANNOUNCEMENTS, announcements);
    return ann;
  },
  delete: (id: string): void => {
    const announcements = getAll<Announcement>(KEYS.ANNOUNCEMENTS).filter(a => a.id !== id);
    setAll(KEYS.ANNOUNCEMENTS, announcements);
    apiDelete(KEYS.ANNOUNCEMENTS, id);
  },
};

// ===================== SYSTEM SETTINGS =====================
export interface SystemSettings {
  id: string;
  softwareName: string;
  version: string;
  contactEmail: string;
  contactPhone: string;
  maintenanceMode: boolean;
  defaultCurrency: string;
  defaultTaxRate: number;
  updatedAt: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  id: 'system_settings',
  softwareName: 'Rizqara Solution',
  version: 'v1.0.0',
  contactEmail: 'support@rizqara.com',
  contactPhone: '+880 1234567890',
  maintenanceMode: false,
  defaultCurrency: 'BDT',
  defaultTaxRate: 0,
  updatedAt: now(),
};

export const systemSettingsStorage = {
  get: (): SystemSettings => {
    const settings = localStorage.getItem(`rizqara_${KEYS.SYSTEM_SETTINGS}`);
    if (!settings) {
      setAll(KEYS.SYSTEM_SETTINGS, [DEFAULT_SETTINGS]);
      return DEFAULT_SETTINGS;
    }
    try {
      const items = JSON.parse(settings);
      return items[0] || DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  save: (settings: SystemSettings): SystemSettings => {
    const updated = { ...settings, updatedAt: now() };
    setAll(KEYS.SYSTEM_SETTINGS, [updated]);
    apiPut(KEYS.SYSTEM_SETTINGS, updated.id, updated);
    return updated;
  },
};

// ===================== INITIALIZATION CHECK =====================
export const isInitialized = (): boolean => {
  return localStorage.getItem(KEYS.INITIALIZED) === 'true';
};

export const markInitialized = (): void => {
  localStorage.setItem(KEYS.INITIALIZED, 'true');
};
