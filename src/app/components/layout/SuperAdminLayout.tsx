import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Store, Package, Users, CreditCard, BarChart3,
  Settings, LogOut, Bell, Menu, X, Megaphone,
  Activity, LifeBuoy, ShieldCheck, ChevronRight, Zap, AlertTriangle,
  ShoppingBag, Info, Clock
} from 'lucide-react';
import { notificationStorage } from '../../lib/storage';
import { Notification } from '../../lib/types';
import { formatDistanceToNow } from 'date-fns';

interface NavGroup {
  label: string;
  items: { icon: React.ElementType; label: string; to: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/super-admin' },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { icon: Store, label: 'Shops', to: '/super-admin/shops' },
      { icon: Package, label: 'Packages', to: '/super-admin/packages' },
      { icon: CreditCard, label: 'Subscriptions', to: '/super-admin/subscriptions' },
      { icon: Users, label: 'All Users', to: '/super-admin/users' },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { icon: LifeBuoy, label: 'Support Tickets', to: '/super-admin/support' },
      { icon: Megaphone, label: 'Announcements', to: '/super-admin/announcements' },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { icon: BarChart3, label: 'Reports', to: '/super-admin/reports' },
      { icon: Activity, label: 'Activity Logs', to: '/super-admin/activity' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { icon: Settings, label: 'System Settings', to: '/super-admin/settings' },
    ],
  },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(notificationStorage.getByUser(null));
  }, [showNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    notificationStorage.markAllRead(null);
    setNotifications(notificationStorage.getByUser(null));
  };

  const handleMarkRead = (id: string) => {
    notificationStorage.markRead(id);
    setNotifications(notificationStorage.getByUser(null));
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

  return (
    <div className="flex h-screen bg-[#F2F4F7] overflow-hidden relative">
      {/* ========== MOBILE BACKDROP ========== */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`
          ${sidebarOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full lg:translate-x-0 lg:w-[64px]'} 
          fixed lg:relative inset-y-0 left-0 z-[70] lg:z-auto
          flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        `}
        style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E3A5F 45%, #1E40AF 100%)' }}
      >
        {/* Close Button (Mobile Only) */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute right-3 top-4 p-1.5 text-white/50 hover:text-white rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

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
              <ShieldCheck size={20} className="text-white relative z-10" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0F172A]" style={{ boxShadow: '0 0 4px rgba(74,222,128,0.5)' }} />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-base font-black tracking-tighter text-white">
                Rizqara <span className="text-blue-400">Solution</span>
              </div>
              <div className="text-blue-300 text-[10px] tracking-widest uppercase mt-0.5">Super Admin</div>
            </div>
          )}
        </div>

        {/* Super Admin badge */}
        {sidebarOpen && (
          <div className="px-3 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-white/80 text-[11px]" style={{ fontWeight: 600 }}>Super Admin Access</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-0.5">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
              {sidebarOpen && (
                <div className="px-2 pb-1.5 pt-2">
                  <span className="text-blue-200/60 text-[9px] tracking-[2.5px] uppercase" style={{ fontWeight: 700 }}>
                    {group.label}
                  </span>
                </div>
              )}
              {!sidebarOpen && gi > 0 && <div className="mx-2 my-2 h-px bg-white/10" />}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/super-admin'}
                  title={!sidebarOpen ? item.label : undefined}
                  onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl mb-0.5 transition-all duration-150 text-sm relative
                    ${sidebarOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'}
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

        {/* User */}
        <div className="border-t border-white/10 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm" style={{ fontWeight: 700 }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs truncate" style={{ fontWeight: 600 }}>{user?.name}</div>
                <div className="text-blue-200/60 text-[10px]">Super Admin</div>
              </div>
              <button onClick={handleLogout} title="Sign Out" className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm" style={{ fontWeight: 700 }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} title="Sign Out" className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========== MAIN ========== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-5 gap-3 md:gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>Super Admin Dashboard</div>
            <div className="text-gray-400 text-[11px] hidden md:block">
              {currentTime.toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] text-blue-700" style={{ fontWeight: 600 }}>
              <ShieldCheck size={12} />
              Super Admin
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>System Alerts</div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-300">
                          <Bell size={20} />
                        </div>
                        <div className="text-sm text-gray-400">No new alerts</div>
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
                              n.type === 'shop_expiry' ? 'bg-red-50 text-red-500' :
                              n.type === 'new_ticket' ? 'bg-blue-50 text-blue-500' :
                              'bg-gray-50 text-gray-500'
                            }`}>
                              {n.type === 'shop_expiry' ? <AlertTriangle size={14} /> : 
                               n.type === 'new_ticket' ? <LifeBuoy size={14} /> : <Info size={14} />}
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
                    <button className="text-blue-600 text-[11px] font-bold">View System Health</button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm shadow-sm" style={{ fontWeight: 700 }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{user?.name}</div>
                <div className="text-[10px] text-gray-400">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}