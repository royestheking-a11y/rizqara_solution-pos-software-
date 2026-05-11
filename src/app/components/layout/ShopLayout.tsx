import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, Package, Tag, Layers, Warehouse,
  TruckIcon, Users, UserCheck, BarChart3, Settings, LogOut, Bell,
  Menu, X, RefreshCcw, Banknote, Store, ChevronDown, Bookmark,
  ArrowLeftRight, ChevronRight, Search, Zap, AlertTriangle, Clock,
  ShoppingBag, History, Info
} from 'lucide-react';
import { notificationStorage } from '../../lib/storage';
import { Notification } from '../../lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  roles: string[];
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function ShopLayout() {
  const { user, shop, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navGroups: NavGroup[] = [
    {
      label: t('dashboard').toUpperCase(),
      items: [
        { icon: LayoutDashboard, label: t('dashboard'), to: '/shop', roles: ['owner', 'manager', 'cashier'] },
      ],
    },
    {
      label: t('sales').toUpperCase(),
      items: [
        { icon: ShoppingCart, label: t('pos'), to: '/shop/pos', roles: ['owner', 'manager', 'cashier'] },
        { icon: Layers, label: t('sales'), to: '/shop/sales', roles: ['owner', 'manager', 'cashier'] },
        { icon: ArrowLeftRight, label: t('returns'), to: '/shop/returns', roles: ['owner', 'manager', 'cashier'] },
        { icon: UserCheck, label: t('customers'), to: '/shop/customers', roles: ['owner', 'manager', 'cashier'] },
      ],
    },
    {
      label: t('inventory').toUpperCase(),
      items: [
        { icon: Package, label: t('products'), to: '/shop/products', roles: ['owner', 'manager'] },
        { icon: Tag, label: t('categories'), to: '/shop/categories', roles: ['owner', 'manager'] },
        { icon: Bookmark, label: t('brands'), to: '/shop/brands', roles: ['owner', 'manager'] },
        { icon: Warehouse, label: t('inventory'), to: '/shop/inventory', roles: ['owner', 'manager'] },
      ],
    },
    {
      label: t('purchases').toUpperCase(),
      items: [
        { icon: TruckIcon, label: t('purchases'), to: '/shop/purchases', roles: ['owner', 'manager'] },
        { icon: Store, label: t('suppliers'), to: '/shop/suppliers', roles: ['owner', 'manager'] },
      ],
    },
    {
      label: t('expenses').toUpperCase(),
      items: [
        { icon: Banknote, label: t('expenses'), to: '/shop/expenses', roles: ['owner', 'manager'] },
        { icon: Clock, label: t('registers'), to: '/shop/registers', roles: ['owner', 'manager'] },
        { icon: History, label: t('activity_logs'), to: '/shop/activity-logs', roles: ['owner'] },
      ],
    },
    {
      label: t('settings').toUpperCase(),
      items: [
        { icon: Users, label: t('staff'), to: '/shop/staff', roles: ['owner'] },
        { icon: BarChart3, label: t('reports'), to: '/shop/reports', roles: ['owner', 'manager'] },
        { icon: Settings, label: t('settings'), to: '/shop/settings', roles: ['owner'] },
      ],
    },
  ];
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const notifRef = useRef<HTMLDivElement>(null);

  const shopId = shop?.id || null;

  useEffect(() => {
    if (shopId) {
      setNotifications(notificationStorage.getByUser(shopId));
    }
  }, [shopId, showNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    if (shopId) {
      notificationStorage.markAllRead(shopId);
      setNotifications(notificationStorage.getByUser(shopId));
    }
  };

  const handleMarkRead = (id: string) => {
    notificationStorage.markRead(id);
    setNotifications(notificationStorage.getByUser(shopId));
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = () => {
    if (user?.role === 'owner') return 'Shop Owner';
    if (user?.role === 'manager') return 'Manager';
    if (user?.role === 'cashier') return 'Cashier';
    return user?.role;
  };

  const roleColor = () => {
    if (user?.role === 'owner') return 'bg-blue-600';
    if (user?.role === 'manager') return 'bg-emerald-500';
    if (user?.role === 'cashier') return 'bg-violet-500';
    return 'bg-gray-500';
  };

  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(user?.role || '')),
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex h-screen bg-[#F2F4F7] overflow-hidden">
      {/* ========== SIDEBAR ========== */}
      <aside className={`${sidebarOpen ? 'w-[230px]' : 'w-[64px]'} flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
        style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E3A5F 45%, #1E40AF 100%)' }}>

        {/* Logo */}
        <div className={`flex items-center gap-3 border-b border-white/10 flex-shrink-0 ${sidebarOpen ? 'px-4 py-4' : 'px-3.5 py-4'}`}
          style={{ minHeight: '64px' }}>
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
              <ShoppingBag size={20} className="text-white relative z-10" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0F172A]" style={{ boxShadow: '0 0 4px rgba(74,222,128,0.5)' }} />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <div className="text-white text-sm truncate" style={{ fontWeight: 700, letterSpacing: '-0.3px' }}>
                {shop?.name || 'Rizqara POS'}
              </div>
              <div className="text-blue-300 text-[10px] tracking-widest uppercase mt-0.5">Rizqara Solution</div>
            </div>
          )}
        </div>

        {/* Quick New Sale button */}
        {sidebarOpen && (
          <div className="px-3 py-3 border-b border-white/10">
            <NavLink
              to="/shop/pos"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-400 transition-colors text-white text-xs shadow-sm shadow-blue-500/30"
              style={{ fontWeight: 700 }}
            >
              <Zap size={13} />
              {t('pos')}
            </NavLink>
          </div>
        )}
        {!sidebarOpen && (
          <div className="px-2.5 py-3 border-b border-white/10">
            <NavLink
              to="/shop/pos"
              className="flex items-center justify-center w-full p-2 rounded-xl bg-blue-500 hover:bg-blue-400 transition-colors text-white"
              title="New Sale"
            >
              <Zap size={14} />
            </NavLink>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-0.5">
          {filteredGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
              {sidebarOpen && (
                <div className="px-2 pb-1.5 pt-2">
                  <span className="text-blue-200/60 text-[9px] tracking-[2.5px] uppercase" style={{ fontWeight: 700 }}>
                    {group.label}
                  </span>
                </div>
              )}
              {!sidebarOpen && gi > 0 && (
                <div className="mx-2 my-2 h-px bg-white/10" />
              )}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/shop'}
                  title={!sidebarOpen ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl mb-0.5 transition-all duration-150 text-sm relative group
                    ${sidebarOpen ? 'px-3 py-2' : 'px-0 py-2 justify-center'}
                    ${isActive
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/65 hover:text-white hover:bg-white/8'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-300 rounded-full" />
                      )}
                      <item.icon size={16} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`} />
                      {sidebarOpen && (
                        <span className="truncate text-[13px]" style={{ fontWeight: isActive ? 600 : 400 }}>
                          {item.label}
                        </span>
                      )}
                      {isActive && sidebarOpen && (
                        <ChevronRight size={12} className="ml-auto text-white/50" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User profile bottom */}
        <div className="border-t border-white/10 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 group">
              <div className={`w-9 h-9 rounded-xl ${roleColor()} flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm`} style={{ fontWeight: 700 }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs truncate" style={{ fontWeight: 600 }}>{user?.name}</div>
                <div className="text-blue-200/60 text-[10px]">{roleLabel()}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className={`w-9 h-9 rounded-xl ${roleColor()} flex items-center justify-center text-white text-sm flex-shrink-0`} style={{ fontWeight: 700 }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} title="Sign Out" className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-5 gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb / greeting */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-gray-500 text-xs hidden md:block">
                {greeting()}, <span className="text-gray-900" style={{ fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
              </div>
              <span className="text-gray-300 hidden md:block">·</span>
              <div className="flex items-center gap-1 text-gray-400 text-xs hidden md:flex">
                <Clock size={11} />
                {currentTime.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="text-xs text-gray-400 hidden lg:block truncate">{shop?.name}</div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors bg-white shadow-sm"
              style={{ fontWeight: 700, fontSize: '11px' }}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 text-[10px]">
                {language === 'en' ? '🇺🇸' : '🇧🇩'}
              </div>
              <span className="text-gray-700">{language === 'en' ? 'ENGLISH' : 'বাংলা'}</span>
            </button>
            {/* Subscription badge */}
            {shop && (
              <div className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] ${
                shop.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' :
                shop.status === 'expired' ? 'bg-red-50 text-red-700 border border-red-100' :
                'bg-yellow-50 text-yellow-700 border border-yellow-100'
              }`} style={{ fontWeight: 600 }}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  shop.status === 'active' ? 'bg-green-500' :
                  shop.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></span>
                {shop.status === 'active' ? 'Active' : shop.status === 'expired' ? 'Expired' : 'Suspended'}
              </div>
            )}

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Notifications</div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-300">
                          <Bell size={20} />
                        </div>
                        <div className="text-sm text-gray-400">No new notifications</div>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkRead(n.id)}
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative ${!n.read ? 'bg-blue-50/30' : ''}`}
                        >
                          {!n.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full" />}
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              n.type === 'low_stock' ? 'bg-orange-50 text-orange-600' :
                              n.type === 'sale' ? 'bg-green-50 text-green-600' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {n.type === 'low_stock' ? <AlertTriangle size={14} /> : 
                               n.type === 'sale' ? <ShoppingCart size={14} /> : <Info size={14} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-gray-800 leading-tight" style={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                              <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <Clock size={10} />
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30 text-center">
                    <button className="text-blue-600 text-[11px] font-bold">View all activity</button>
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
              <div className={`w-9 h-9 rounded-xl ${roleColor()} flex items-center justify-center text-white text-sm shadow-sm`} style={{ fontWeight: 700 }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{user?.name}</div>
                <div className="text-[10px] text-gray-400">{roleLabel()}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}