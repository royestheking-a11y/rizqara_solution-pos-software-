import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import {
  productStorage, customerStorage, saleStorage, stockMovementStorage,
  heldOrderStorage, activityLogStorage, categoryStorage, registerStorage, notificationStorage
} from '../../lib/storage';
import { notificationService } from '../../lib/notificationService';
import { Product, ProductVariant, SaleItem, PaymentEntry, PaymentMethod, Customer, Register } from '../../lib/types';
import { formatCurrency, PAYMENT_METHOD_LABELS } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard,
  Printer, Pause, Play, X, CheckCircle, Barcode, Grid3X3, List,
  ChevronDown, RotateCcw, ArrowLeftRight, Tag, Zap, Package,
  ChevronRight, Clock, Phone, MapPin, Hash, Banknote, Smartphone, Building2, Coins, Wallet, Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { POSInvoice } from '../../components/shop/POSInvoice';
import { RetailInvoice } from '../../components/shop/RetailInvoice';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bkash', 'nagad', 'rocket', 'card', 'bank_transfer', 'due'];

const PAYMENT_METHODS_CONFIG: Record<PaymentMethod, { label: string; icon: any; color: string }> = {
  cash: { label: 'Cash', icon: Banknote, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  bkash: { label: 'bKash', icon: Smartphone, color: 'bg-pink-50 text-pink-600 border-pink-100' },
  nagad: { label: 'Nagad', icon: Smartphone, color: 'bg-red-50 text-red-600 border-red-100' },
  rocket: { label: 'Rocket', icon: Smartphone, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  card: { label: 'Card', icon: CreditCard, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  bank_transfer: { label: 'Bank', icon: Building2, color: 'bg-slate-50 text-slate-600 border-slate-100' },
  due: { label: 'Due', icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100' },
};

interface CartItem extends SaleItem {
  maxStock: number;
}

export default function POS() {
  const { shop, user } = useAuth();
  const shopId = shop?.id || '';
  const maxDiscount = user?.maxDiscountPercent || 0;

  const [products] = useState(() => productStorage.getByShop(shopId).filter(p => p.status === 'active'));
  const [customers, setCustomers] = useState(() => customerStorage.getByShop(shopId));
  const [categories] = useState(() => categoryStorage.getByShop(shopId));

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [note, setNote] = useState('');

  const [payments, setPayments] = useState<PaymentEntry[]>([{ method: 'cash', amount: 0 }]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [heldOrders, setHeldOrders] = useState(() => heldOrderStorage.getByShop(shopId));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [printType, setPrintType] = useState<'thermal' | 'retail'>('thermal');
  const [custSearch, setCustSearch] = useState('');
  
  // Register state
  const [openRegister, setOpenRegister] = useState<Register | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ openingBalance: 0, note: '' });
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
  const [closeRegisterForm, setCloseRegisterForm] = useState({ actualBalance: 0, note: '' });

  // Loyalty state
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  // New customer form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  // Unique categories in stock
  const categoriesInUse = useMemo(() => {
    const usedIds = new Set(products.map(p => p.categoryId));
    return categories.filter(c => usedIds.has(c.id));
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode || '').includes(search);
      const matchCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  // Check register
  useEffect(() => {
    if (shopId && user?.id) {
      const reg = registerStorage.getOpenByCashier(shopId, user.id);
      setOpenRegister(reg || null);
      if (!reg) setShowRegisterModal(true);
    }
  }, [shopId, user?.id]);

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmt = Math.min(invoiceDiscount, subtotal);
  const taxRate = shop?.taxRate || 0;
  const taxAmt = Math.round(((subtotal - discountAmt) * taxRate) / 100);
  
  const pointValue = shop?.pointValue || 1;
  const redeemedValue = redeemedPoints * pointValue;
  const totalAmount = Math.max(0, subtotal - discountAmt + taxAmt - redeemedValue);

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const dueAmount = Math.max(0, totalAmount - totalPaid);
  const changeAmount = Math.max(0, totalPaid - totalAmount);

  const filteredCustomers = useMemo(() =>
    customers.filter(c =>
      c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
      c.phone.includes(custSearch)
    ), [customers, custSearch]);

  // Register Handlers
  const handleOpenRegister = () => {
    if (registerForm.openingBalance < 0) { toast.error('Balance cannot be negative'); return; }
    const reg = registerStorage.create({
      shopId,
      cashierId: user?.id || '',
      cashierName: user?.name || '',
      openTime: new Date().toISOString(),
      openingBalance: registerForm.openingBalance,
      cashSales: 0,
      otherSales: 0,
      expectedBalance: registerForm.openingBalance,
      status: 'open',
      note: registerForm.note,
    });
    setOpenRegister(reg);
    setShowRegisterModal(false);
    activityLogStorage.create({
      shopId,
      userId: user?.id || '',
      userName: user?.name || 'Unknown',
      action: 'Register Opened',
      details: `Opening Balance: ${registerForm.openingBalance} ৳\nNote: ${registerForm.note || '-'}`
    });
    toast.success('Register opened successfully');
  };

  const handleCloseRegister = () => {
    if (!openRegister) return;
    const diff = closeRegisterForm.actualBalance - openRegister.expectedBalance;
    registerStorage.update({
      ...openRegister,
      status: 'closed',
      closeTime: new Date().toISOString(),
      actualBalance: closeRegisterForm.actualBalance,
      difference: diff,
      note: closeRegisterForm.note
    });
    setOpenRegister(null);
    setShowCloseRegisterModal(false);
    setShowRegisterModal(true); 
    activityLogStorage.create({
      shopId,
      userId: user?.id || '',
      userName: user?.name || 'Unknown',
      action: 'Register Closed',
      details: `Expected: ${openRegister.expectedBalance} ৳\nActual: ${closeRegisterForm.actualBalance} ৳\nDifference: ${diff} ৳\nNote: ${closeRegisterForm.note || '-'}`
    });
    toast.success('Register closed successfully');
  };

  const addToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    if (product.hasVariants && !variant) {
      setSelectedProduct(product);
      setQty(1);
      setShowVariantModal(true);
      return;
    }

    const maxStock = variant ? variant.quantity : product.totalQuantity;
    const existingIdx = cart.findIndex(item =>
      item.productId === product.id && item.variantId === (variant?.id || undefined)
    );

    if (existingIdx >= 0) {
      const newCart = [...cart];
      const newQty = newCart[existingIdx].quantity + quantity;
      if (newQty > maxStock) { toast.error('Insufficient stock'); return; }
      newCart[existingIdx].quantity = newQty;
      newCart[existingIdx].total = newQty * (newCart[existingIdx].unitPrice - newCart[existingIdx].discount / newQty);
      setCart(newCart);
    } else {
      const price = product.discountPrice || product.sellingPrice;
      const item: CartItem = {
        id: Date.now().toString(36),
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        color: variant?.color,
        size: variant?.size,
        quantity,
        unitPrice: price,
        discount: 0,
        total: price * quantity,
        purchasePrice: product.purchasePrice,
        maxStock,
      };
      setCart([...cart, item]);
    }
    toast.success(`${product.name} added to cart`, { duration: 1500 });
  };

  const handleVariantSelect = () => {
    if (!selectedProduct || !selectedVariant) { toast.error('Select a variant'); return; }
    if (qty > selectedVariant.quantity) { toast.error('Insufficient stock'); return; }
    addToCart(selectedProduct, selectedVariant, qty);
    setShowVariantModal(false);
    setSelectedVariant(null);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(1, Math.min(item.quantity + delta, item.maxStock));
      return { ...item, quantity: newQty, total: newQty * item.unitPrice - item.discount };
    }));
  };

  const updateItemDiscount = (id: string, discountAmount: number) => {
    setCart(cart.map(item => {
      if (item.id !== id) return item;
      const maxItemDiscount = (item.unitPrice * item.quantity * maxDiscount) / 100;
      const safeDiscount = Math.min(discountAmount, maxItemDiscount, item.unitPrice * item.quantity);
      return { ...item, discount: safeDiscount, total: item.unitPrice * item.quantity - safeDiscount };
    }));
  };

  const removeItem = (id: string) => setCart(cart.filter(item => item.id !== id));
  const clearCart = () => {
    setCart([]);
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setInvoiceDiscount(0);
    setPayments([{ method: 'cash', amount: 0 }]);
    setNote('');
  };

  const openPayment = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (!customerName || !customerPhone) {
      toast.error('Please select or add a customer first');
      setShowCustomerModal(true);
      return;
    }
    setPayments([{ method: 'cash', amount: totalAmount }]);
    setShowPaymentModal(true);
  };

  const completeSale = () => {
    if (totalPaid < totalAmount && !payments.some(p => p.method === 'due')) {
      toast.error('Payment amount is less than total. Add "Due" payment for partial payment.');
      return;
    }

    const invoiceNumber = saleStorage.generateInvoiceNumber(shopId, shop?.invoicePrefix || 'INV-');

    cart.forEach(item => {
      const product = productStorage.getById(item.productId);
      if (!product) return;
      if (item.variantId) {
        productStorage.updateVariantStock(item.productId, item.variantId, -item.quantity);
      } else {
        productStorage.updateStock(item.productId, -item.quantity);
      }
      stockMovementStorage.create({
        shopId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        color: item.color,
        size: item.size,
        action: 'sold',
        quantity: -item.quantity,
        by: user?.name || '',
        date: new Date().toISOString(),
      });
    });

    if (customerId) {
      const cust = customerStorage.getById(customerId);
      if (cust) {
        customerStorage.update({
          ...cust,
          totalPurchase: cust.totalPurchase + totalAmount,
          totalDue: cust.totalDue + dueAmount,
          lastPurchaseDate: new Date().toISOString(),
        });
      }
    }

    const sale = saleStorage.create({
      shopId,
      cashierId: user?.id || '',
      cashierName: user?.name || '',
      customerId: customerId || undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      invoiceNumber,
      items: cart,
      subtotal,
      discountAmount: discountAmt,
      taxAmount: taxAmt,
      totalAmount,
      payments: payments.filter(p => p.amount > 0),
      paidAmount: Math.min(totalPaid, totalAmount),
      dueAmount,
      pointsEarned: Math.floor(totalAmount * (shop?.loyaltyRatio || 0)),
      pointsRedeemed: redeemedPoints,
      status: 'completed',
      note: note || undefined,
    });

    // Update Register
    if (openRegister) {
      const cashPay = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
      const otherPay = payments.filter(p => p.method !== 'cash').reduce((sum, p) => sum + p.amount, 0);
      registerStorage.update({
        ...openRegister,
        cashSales: openRegister.cashSales + cashPay,
        otherSales: openRegister.otherSales + otherPay,
        expectedBalance: openRegister.expectedBalance + cashPay
      });
      setOpenRegister(registerStorage.getOpenByCashier(shopId, user?.id || '') || null);
    }

    activityLogStorage.create({
      shopId,
      userId: user?.id || '',
      userName: user?.name || '',
      action: 'Sale completed',
      details: `Invoice ${invoiceNumber} — ${formatCurrency(totalAmount)}`,
    });

    // Check for low stock notifications
    cart.forEach(item => {
      const p = productStorage.getById(item.productId);
      if (p) notificationService.checkLowStock(shopId, p);
    });

    setLastSale(sale);
    setShowPaymentModal(false);
    setShowInvoiceModal(true);
    clearCart();
    toast.success(`✅ Sale completed! Invoice: ${invoiceNumber}`);
  };

  const holdOrder = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    const orderName = `Order #${Date.now().toString().slice(-4)}`;
    heldOrderStorage.create({
      shopId,
      name: orderName,
      items: cart,
      customerId: customerId || undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
    });
    setHeldOrders(heldOrderStorage.getByShop(shopId));
    clearCart();
    toast.success(`Order held as "${orderName}"`);
  };

  const resumeHeldOrder = (order: any) => {
    setCart(order.items.map((item: any) => ({ ...item, maxStock: 999 })));
    setCustomerId(order.customerId || '');
    setCustomerName(order.customerName || '');
    setCustomerPhone(order.customerPhone || '');
    heldOrderStorage.delete(order.id);
    setHeldOrders(heldOrderStorage.getByShop(shopId));
    setShowHeldModal(false);
    toast.success('Order resumed');
  };

  const selectCustomer = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setShowCustomerModal(false);
    setCustSearch('');
  };

  const addNewCustomer = () => {
    if (!newCustName || !newCustPhone) { toast.error('Name and phone required'); return; }
    
    // Check if customer already exists by phone
    const existing = customerStorage.getByPhone(shopId, newCustPhone);
    if (existing) {
      selectCustomer(existing);
      setNewCustName(''); 
      setNewCustPhone(''); 
      setNewCustAddress('');
      toast.success('Existing customer selected');
      return;
    }

    const cust = customerStorage.create({
      shopId,
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddress,
      totalPurchase: 0,
      totalDue: 0,
      points: 0
    });
    setCustomers(customerStorage.getByShop(shopId));
    selectCustomer(cust);
    setNewCustName(''); 
    setNewCustPhone(''); 
    setNewCustAddress('');
    toast.success('Customer added');
  };

  // Quick amount buttons for payment
  const quickAmounts = useMemo(() => {
    const base = Math.ceil(totalAmount / 100) * 100;
    const amounts = [base, base + 100, base + 200, base + 500, base + 1000].filter(a => a !== totalAmount);
    return [totalAmount, ...amounts.slice(0, 3)];
  }, [totalAmount]);

  return (
    <div className="flex h-[calc(100vh-64px)] gap-4 overflow-hidden">
      {/* ============================
          LEFT: Product Panel
      ============================ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Search Bar */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, SKU or barcode..."
              className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
            title={viewMode === 'grid' ? 'List view' : 'Grid view'}
          >
            {viewMode === 'grid' ? <List size={17} /> : <Grid3X3 size={17} />}
          </button>
        </div>

        {/* Category tabs */}
        {categoriesInUse.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition-all ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
              style={{ fontWeight: categoryFilter === 'all' ? 700 : 500 }}
            >
              All ({products.length})
            </button>
            {categoriesInUse.map(cat => {
              const count = products.filter(p => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
                  style={{ fontWeight: categoryFilter === cat.id ? 700 : 500 }}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Products Grid/List */}
        <div className="flex-1 overflow-y-auto p-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <Package size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm" style={{ fontWeight: 500 }}>No products found</p>
              <p className="text-gray-400 text-xs mt-1">Try a different search or category</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map(product => {
                const isOut = product.totalQuantity === 0;
                const isLow = !isOut && product.totalQuantity <= product.lowStockAlert;
                return (
                  <button
                    key={product.id}
                    onClick={() => !isOut && addToCart(product)}
                    disabled={isOut}
                    className={`bg-white border-2 rounded-xl p-3 text-left transition-all group ${
                      isOut
                        ? 'border-gray-100 opacity-50 cursor-not-allowed'
                        : 'border-gray-100 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Product Image Placeholder */}
                    <div className={`w-full aspect-square rounded-lg flex items-center justify-center mb-2 transition-colors ${
                      isOut ? 'bg-gray-50' : 'bg-blue-50 group-hover:bg-blue-100'
                    }`}>
                      <ShoppingCart size={22} className={isOut ? 'text-gray-300' : 'text-blue-500 opacity-60 group-hover:opacity-80'} />
                    </div>

                    <div className="text-xs text-gray-800 truncate mb-0.5" style={{ fontWeight: 600 }}>{product.name}</div>
                    <div className="text-[10px] text-gray-400 truncate mb-2 font-mono">{product.sku}</div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-700" style={{ fontWeight: 800 }}>
                          {formatCurrency(product.discountPrice || product.sellingPrice)}
                        </div>
                        {product.discountPrice && (
                          <div className="text-[10px] text-gray-300 line-through">{formatCurrency(product.sellingPrice)}</div>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                        isOut ? 'bg-red-50 text-red-600 border-red-100' :
                        isLow ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        'bg-green-50 text-green-700 border-green-100'
                      }`} style={{ fontWeight: 600 }}>
                        {isOut ? 'Out' : `${product.totalQuantity}`}
                      </span>
                    </div>

                    {product.hasVariants && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-600">
                        <ChevronRight size={10} />
                        <span>Select variant</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredProducts.map(product => {
                const isOut = product.totalQuantity === 0;
                const isLow = !isOut && product.totalQuantity <= product.lowStockAlert;
                return (
                  <button
                    key={product.id}
                    onClick={() => !isOut && addToCart(product)}
                    disabled={isOut}
                    className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-left flex items-center gap-3 transition-all ${
                      isOut ? 'border-gray-100 opacity-50 cursor-not-allowed' :
                      'border-gray-100 hover:border-blue-400 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isOut ? 'bg-gray-50' : 'bg-blue-50'
                    }`}>
                      <ShoppingCart size={16} className={isOut ? 'text-gray-300' : 'text-blue-500 opacity-60'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800 truncate" style={{ fontWeight: 600 }}>{product.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{product.sku}{product.hasVariants ? ' · Has variants' : ''}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-blue-700" style={{ fontWeight: 800 }}>
                        {formatCurrency(product.discountPrice || product.sellingPrice)}
                      </div>
                      <span className={`text-[10px] ${
                        isOut ? 'text-red-500' : isLow ? 'text-yellow-600' : 'text-gray-400'
                      }`}>Stock: {product.totalQuantity}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Held Orders bar */}
        {heldOrders.length > 0 && (
          <button
            onClick={() => setShowHeldModal(true)}
            className="mt-3 w-full flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-700 text-sm hover:bg-amber-100 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <Pause size={15} />
            <span>{heldOrders.length} held order(s) — Click to resume</span>
            <ChevronRight size={14} className="ml-auto" />
          </button>
        )}
      </div>

      {/* ============================
          RIGHT: Cart Panel
      ============================ */}
      <div className="w-[320px] flex flex-col bg-white border-2 border-gray-100 rounded-2xl shadow-sm overflow-hidden">

        {/* Cart Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1E3A5F, #1E40AF)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <ShoppingCart size={14} className="text-white" />
              </div>
              <span className="text-white text-sm" style={{ fontWeight: 700 }}>
                Cart {cart.length > 0 && `(${cart.length})`}
              </span>
              {cart.length > 0 && (
                <span className="text-white/60 text-xs">
                  · {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <button onClick={holdOrder} title="Hold Order" className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors" >
                <Pause size={14} />
              </button>
              <button 
                onClick={() => setShowCloseRegisterModal(true)} 
                title="Close Register" 
                className="p-1.5 rounded-lg hover:bg-red-500/30 text-white/70 hover:text-white transition-colors"
              >
                <Clock size={14} />
              </button>
              <button onClick={clearCart} title="Clear Cart" className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Customer selector */}
        <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
          {customerName ? (
            <div className="flex items-center gap-2.5 bg-blue-50 rounded-xl p-2.5 border border-blue-100">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                {(customerName || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-900 truncate" style={{ fontWeight: 600 }}>{customerName}</div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Phone size={9} /> {customerPhone}
                </div>
              </div>
              <button onClick={() => { setCustomerId(''); setCustomerName(''); setCustomerPhone(''); }} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border-2 border-dashed border-gray-200 hover:border-blue-300"
            >
              <User size={14} />
              <span className="text-xs" style={{ fontWeight: 500 }}>Add Customer (optional)</span>
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <ShoppingCart size={28} className="text-gray-200" />
              </div>
              <p className="text-gray-400 text-sm" style={{ fontWeight: 500 }}>Cart is empty</p>
              <p className="text-gray-300 text-xs mt-1">Click products to add them</p>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-2">
              {cart.map((item, idx) => (
                <div key={item.id} className="border border-gray-100 rounded-xl p-2.5 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0 mr-2">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] flex-shrink-0 mt-0.5" style={{ fontWeight: 700 }}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-800 truncate" style={{ fontWeight: 600 }}>{item.productName}</div>
                        {(item.color || item.size) && (
                          <div className="flex gap-1 mt-0.5">
                            {item.color && <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{item.color}</span>}
                            {item.size && <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{item.size}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 p-0.5 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Qty stepper */}
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-xs" style={{ fontWeight: 700 }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                        <Plus size={11} />
                      </button>
                    </div>
                    {/* Discount */}
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">৳</span>
                      <input
                        type="number"
                        value={item.discount || ''}
                        onChange={e => updateItemDiscount(item.id, Number(e.target.value))}
                        placeholder="Discount"
                        className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        title={maxDiscount > 0 ? `Max: ৳${Math.round(item.unitPrice * item.quantity * maxDiscount / 100)}` : 'No discount allowed'}
                      />
                    </div>
                    {/* Line total */}
                    <div className="text-sm text-blue-700 text-right flex-shrink-0" style={{ fontWeight: 700 }}>
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                  {/* Unit price */}
                  <div className="text-[10px] text-gray-400 mt-1 text-right">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                    {item.discount > 0 && <span className="text-red-400 ml-1">-{formatCurrency(item.discount)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Invoice Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">৳</span>
              <input
                type="number"
                value={invoiceDiscount || ''}
                onChange={e => setInvoiceDiscount(Math.min(Number(e.target.value), subtotal * maxDiscount / 100))}
                className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>Discount Applied</span>
              <span style={{ fontWeight: 600 }}>-{formatCurrency(discountAmt)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(taxAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5 mt-1">
            <span className="text-gray-900" style={{ fontWeight: 700 }}>Total Due</span>
            <span className="text-blue-700 text-lg" style={{ fontWeight: 800 }}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="px-3 pb-3 flex-shrink-0 space-y-2">
          <button
            onClick={openPayment}
            disabled={cart.length === 0}
            className="w-full text-white py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            style={{
              fontWeight: 700,
              background: cart.length > 0
                ? 'linear-gradient(135deg, #4F46E5, #3730A3)'
                : '#D1D5DB',
              boxShadow: cart.length > 0 ? '0 10px 20px rgba(79, 70, 229, 0.2)' : 'none',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard size={16} />
              {cart.length === 0 ? 'Cart is Empty' : `Checkout — ${formatCurrency(totalAmount)}`}
            </div>
          </button>
          {cart.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={holdOrder} className="flex items-center justify-center gap-1.5 py-2 border-2 border-gray-200 rounded-xl text-gray-500 hover:border-amber-300 hover:text-amber-600 text-xs transition-colors" style={{ fontWeight: 600 }}>
                <Pause size={12} /> Hold
              </button>
              <button onClick={clearCart} className="flex items-center justify-center gap-1.5 py-2 border-2 border-gray-200 rounded-xl text-gray-500 hover:border-red-200 hover:text-red-500 text-xs transition-colors" style={{ fontWeight: 600 }}>
                <Trash2 size={12} /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================
          VARIANT MODAL
      ============================ */}
      <Modal
        open={showVariantModal}
        onClose={() => { setShowVariantModal(false); setSelectedVariant(null); }}
        title={`Select Variant — ${selectedProduct?.name}`}
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowVariantModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700">Cancel</button>
            <button onClick={handleVariantSelect} disabled={!selectedVariant} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-40 hover:bg-blue-700" style={{ fontWeight: 600 }}>
              Add to Cart
            </button>
          </div>
        }
      >
        {selectedProduct && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 max-h-64 overflow-y-auto pr-1">
              {selectedProduct.variants.filter(v => v.quantity > 0).map(variant => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`p-3 border-2 rounded-xl text-left transition-all ${
                    selectedVariant?.id === variant.id
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-wrap gap-1 mb-2">
                    {variant.color && <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-full">{variant.color}</span>}
                    {variant.size && <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-full">{variant.size}</span>}
                  </div>
                  <div className={`text-xs ${variant.quantity <= 3 ? 'text-red-500' : 'text-gray-400'}`} style={{ fontWeight: 600 }}>
                    {variant.quantity} in stock
                  </div>
                  {selectedVariant?.id === variant.id && (
                    <CheckCircle size={14} className="text-blue-600 mt-1" />
                  )}
                </button>
              ))}
              {selectedProduct.variants.filter(v => v.quantity === 0).map(variant => (
                <div key={variant.id} className="p-3 border-2 border-gray-100 rounded-xl opacity-40 cursor-not-allowed">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {variant.color && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{variant.color}</span>}
                    {variant.size && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{variant.size}</span>}
                  </div>
                  <div className="text-xs text-red-400">Out of stock</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <label className="text-sm text-gray-600" style={{ fontWeight: 500 }}>Quantity:</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors"><Minus size={14} /></button>
                <span className="w-12 text-center text-sm" style={{ fontWeight: 700 }}>{qty}</span>
                <button onClick={() => setQty(Math.min(qty + 1, selectedVariant?.quantity || 99))} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors"><Plus size={14} /></button>
              </div>
              {selectedVariant && <span className="text-xs text-gray-400">Max: {selectedVariant.quantity}</span>}
            </div>
          </div>
        )}
      </Modal>

      {/* ============================
          PAYMENT MODAL
      ============================ */}
      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Payment"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700">Cancel</button>
            <button onClick={completeSale} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 shadow-sm" style={{ fontWeight: 700 }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} />
                Complete Sale
              </div>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Grand total banner */}
          <div className="relative overflow-hidden rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #1E3A5F, #1E40AF)' }}>
            <div className="text-white/70 text-xs mb-1">Total Amount</div>
            <div className="text-white text-3xl" style={{ fontWeight: 900, letterSpacing: '-1px' }}>{formatCurrency(totalAmount)}</div>
            {customerName && (
              <div className="mt-2 text-white/70 text-xs flex items-center justify-center gap-1">
                <User size={11} /> {customerName}
              </div>
            )}
          </div>

          {/* Loyalty Points */}
          {customerId && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-700 font-medium flex items-center gap-1"><Tag size={12}/> Customer Loyalty</span>
                <span className="text-blue-900 font-black">{customers.find(c => c.id === customerId)?.points || 0} Points Available</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={redeemedPoints || ''} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    const max = customers.find(c => c.id === customerId)?.points || 0;
                    setRedeemedPoints(Math.min(val, max));
                  }}
                  placeholder="Redeem points..." 
                  className="flex-1 px-3 py-1.5 border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={() => setRedeemedPoints(customers.find(c => c.id === customerId)?.points || 0)}
                  className="px-2 py-1.5 bg-blue-600 text-white text-[10px] rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Apply Max
                </button>
              </div>
              {redeemedPoints > 0 && (
                <div className="text-[10px] text-blue-600 italic">
                  Redeeming {redeemedPoints} points for {formatCurrency(redeemedValue)} discount
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 shadow-inner">
            <div className="flex justify-between text-xs text-gray-500"><span>Items ({cart.reduce((s, i) => s + i.quantity, 0)})</span><span>{formatCurrency(subtotal)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-xs text-green-600 font-medium"><span>Store Discount</span><span>-{formatCurrency(discountAmt)}</span></div>}
            {redeemedValue > 0 && <div className="flex justify-between text-xs text-blue-600 font-medium"><span>Points Redeemed</span><span>-{formatCurrency(redeemedValue)}</span></div>}
            {taxAmt > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmt)}</span></div>}
          </div>

          {/* Quick amount buttons */}
          <div>
            <div className="text-xs text-gray-500 mb-2" style={{ fontWeight: 500 }}>Quick Cash Amounts</div>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.slice(0, 4).map(amt => (
                <button
                  key={amt}
                  onClick={() => setPayments([{ method: 'cash', amount: amt }])}
                  className={`py-2 rounded-xl text-xs border-2 transition-all ${
                    payments.length === 1 && payments[0].amount === amt && payments[0].method === 'cash'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-400'
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  ৳{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment methods */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700" style={{ fontWeight: 600 }}>Payment Methods</label>
              {payments.length < PAYMENT_METHODS.length && (
                <button
                  onClick={() => setPayments([...payments, { method: 'bkash', amount: 0 }])}
                  className="text-xs text-blue-600 hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  + Add method
                </button>
              )}
            </div>
            <div className="space-y-2">
              {payments.map((payment, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1 relative group">
                      <div className="relative">
                        <select
                          value={payment.method}
                          onChange={e => {
                            const newPay = [...payments];
                            newPay[idx].method = e.target.value as PaymentMethod;
                            setPayments(newPay);
                          }}
                          className="w-full pl-10 pr-10 py-3 border-2 border-gray-100 rounded-xl text-sm appearance-none focus:outline-none focus:border-blue-500 bg-white transition-all hover:border-gray-200"
                        >
                          {PAYMENT_METHODS.map(m => (
                            <option key={m} value={m}>{PAYMENT_METHODS_CONFIG[m].label}</option>
                          ))}
                        </select>
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {React.createElement(PAYMENT_METHODS_CONFIG[payment.method].icon, { 
                            size: 18, 
                            className: PAYMENT_METHODS_CONFIG[payment.method].color.split(' ')[1] 
                          })}
                        </div>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
                    <input
                      type="number"
                      value={payment.amount || ''}
                      onChange={e => {
                        const newPay = [...payments];
                        newPay[idx].amount = Number(e.target.value);
                        setPayments(newPay);
                      }}
                      className="w-32 pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  {payments.length > 1 && (
                    <button onClick={() => setPayments(payments.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>Invoice Note (optional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Special instructions, reference..."
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Change / Due */}
          <div className="grid grid-cols-2 gap-3">
            {changeAmount > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-500 mb-0.5">Change</div>
                <div className="text-green-700 text-lg" style={{ fontWeight: 800 }}>{formatCurrency(changeAmount)}</div>
              </div>
            )}
            {dueAmount > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-500 mb-0.5">Remaining Due</div>
                <div className="text-red-700 text-lg" style={{ fontWeight: 800 }}>{formatCurrency(dueAmount)}</div>
              </div>
            )}
            {changeAmount === 0 && dueAmount === 0 && totalPaid >= totalAmount && (
              <div className="col-span-2 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <CheckCircle size={20} className="text-green-500 mx-auto mb-1" />
                <div className="text-green-700 text-sm" style={{ fontWeight: 600 }}>Exact amount — Fully paid!</div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ============================
          HELD ORDERS MODAL
      ============================ */}
      <Modal
        open={showHeldModal}
        onClose={() => setShowHeldModal(false)}
        title="Held Orders"
        size="md"
      >
        <div className="space-y-2">
          {heldOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Pause size={36} className="mx-auto mb-3 opacity-30" />
              <p>No held orders</p>
            </div>
          ) : (
            heldOrders.map(order => (
              <div key={order.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Pause size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{order.name}</div>
                  <div className="text-xs text-gray-400">{order.items.length} items · {order.customerName || 'Walk-in'}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resumeHeldOrder(order)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1"
                    style={{ fontWeight: 600 }}
                  >
                    <Play size={11} /> Resume
                  </button>
                  <button
                    onClick={() => {
                      heldOrderStorage.delete(order.id);
                      setHeldOrders(heldOrderStorage.getByShop(shopId));
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* ============================
          CUSTOMER MODAL
      ============================ */}
      <Modal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Add Customer Details"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>Full Name *</label>
              <input
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>Phone Number *</label>
              <input
                value={newCustPhone}
                onChange={e => setNewCustPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>Address (Optional)</label>
              <input
                value={newCustAddress}
                onChange={e => setNewCustAddress(e.target.value)}
                placeholder="Customer address"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={addNewCustomer}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              style={{ fontWeight: 700 }}
            >
              <CheckCircle size={18} /> Confirm Customer
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================
          INVOICE MODAL
      ============================ */}
      {lastSale && (
        <Modal
          open={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          title=""
          size="md"
          footer={
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowInvoiceModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700">Done</button>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setPrintType('retail');
                    setTimeout(() => window.print(), 100);
                  }} 
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800 flex items-center gap-2" 
                  style={{ fontWeight: 600 }}
                >
                  <Printer size={14} /> Standard
                </button>
                <button 
                  onClick={() => {
                    setPrintType('thermal');
                    setTimeout(() => window.print(), 100);
                  }} 
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 flex items-center gap-2" 
                  style={{ fontWeight: 600 }}
                >
                  <Printer size={14} /> Thermal
                </button>
              </div>
            </div>
          }
        >
          <div className="text-center">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-gray-900 text-xl mb-1" style={{ fontWeight: 800 }}>Sale Complete!</h3>
            <p className="text-gray-500 text-sm mb-5">Invoice generated successfully</p>

            <div className="bg-blue-50 rounded-2xl p-5 mb-5">
              <div className="text-blue-700 text-3xl mb-1" style={{ fontWeight: 900, letterSpacing: '-1px' }}>
                {formatCurrency(lastSale.totalAmount)}
              </div>
              <div className="text-blue-600/70 text-sm">{lastSale.invoiceNumber}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">Customer</div>
                <div className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{lastSale.customerName || 'Walk-in'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">Items</div>
                <div className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{lastSale.items.length} product(s)</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">Paid</div>
                <div className="text-sm text-green-700" style={{ fontWeight: 600 }}>{formatCurrency(lastSale.paidAmount)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">Due</div>
                <div className={`text-sm ${lastSale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`} style={{ fontWeight: 600 }}>
                  {lastSale.dueAmount > 0 ? formatCurrency(lastSale.dueAmount) : 'Fully Paid ✓'}
                </div>
              </div>
            </div>

            {/* Hidden Invoices for printing via Portal */}
            {createPortal(
              <div className="print-container">
                {printType === 'thermal' && (
                  <div id="invoice-print">
                    <POSInvoice shop={shop!} sale={lastSale} />
                  </div>
                )}
                {printType === 'retail' && (
                  <div id="retail-invoice-print">
                    <RetailInvoice shop={shop!} sale={lastSale} />
                  </div>
                )}
              </div>,
              document.body
            )}
          </div>
        </Modal>
      )}

      {/* Register Modals */}
      <RegisterModals 
        showOpen={showRegisterModal}
        setShowOpen={setShowRegisterModal}
        onOpen={handleOpenRegister}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        showClose={showCloseRegisterModal}
        setShowClose={setShowCloseRegisterModal}
        onCloseRegister={handleCloseRegister}
        closeRegisterForm={closeRegisterForm}
        setCloseRegisterForm={setCloseRegisterForm}
        openRegister={openRegister}
      />
    </div>
  );
}

// ===================== NEW MODALS =====================

function RegisterModals({ 
  showOpen, setShowOpen, onOpen, registerForm, setRegisterForm,
  showClose, setShowClose, onCloseRegister, closeRegisterForm, setCloseRegisterForm, openRegister 
}: any) {
  return (
    <>
      {/* Open Register Modal */}
      <Modal open={showOpen} onClose={() => setShowOpen(false)} title="Open Register" size="sm">
        <div className="space-y-4 py-2">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-sm font-black text-blue-900">Start New Session</div>
              <div className="text-[10px] text-blue-600">Initialize your cash drawer for the day</div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-bold ml-1">Opening Cash Balance (৳)</label>
            <div className="relative">
              <Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="number" 
                value={registerForm.openingBalance || ''} 
                onChange={e => setRegisterForm({...registerForm, openingBalance: Number(e.target.value)})}
                placeholder="0.00" 
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-bold ml-1">Notes (Optional)</label>
            <textarea 
              value={registerForm.note} 
              onChange={e => setRegisterForm({...registerForm, note: e.target.value})}
              placeholder="Shift notes..." 
              className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20"
            />
          </div>

          <button 
            onClick={onOpen}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Open Register & Start
          </button>
        </div>
      </Modal>

      {/* Close Register Modal */}
      <Modal open={showClose} onClose={() => setShowClose(false)} title="Close Register" size="sm">
        <div className="space-y-4 py-2">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
            <div className="flex justify-between text-xs text-gray-500"><span>Opening Cash</span><span>{formatCurrency(openRegister?.openingBalance || 0)}</span></div>
            <div className="flex justify-between text-xs text-green-600 font-bold"><span>Cash Sales (+)</span><span>{formatCurrency(openRegister?.cashSales || 0)}</span></div>
            <div className="flex justify-between text-xs text-gray-500"><span>Other Sales</span><span>{formatCurrency(openRegister?.otherSales || 0)}</span></div>
            <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black text-gray-900">
              <span>Expected Cash</span>
              <span>{formatCurrency(openRegister?.expectedBalance || 0)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-bold ml-1">Actual Counted Cash (৳)</label>
            <div className="relative">
              <Calculator size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="number" 
                value={closeRegisterForm.actualBalance || ''} 
                onChange={e => setCloseRegisterForm({...closeRegisterForm, actualBalance: Number(e.target.value)})}
                placeholder="0.00" 
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-bold ml-1">Closing Note</label>
            <textarea 
              value={closeRegisterForm.note} 
              onChange={e => setCloseRegisterForm({...closeRegisterForm, note: e.target.value})}
              placeholder="Any discrepancies?" 
              className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20"
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setShowClose(false)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600"
            >
              Cancel
            </button>
            <button 
              onClick={onCloseRegister}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 shadow-lg shadow-red-100"
            >
              Close Register
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}