import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';

// Public
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import PublicSupport from './pages/public/Support';

// Super Admin
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Shops from './pages/superadmin/Shops';
import Packages from './pages/superadmin/Packages';
import Subscriptions from './pages/superadmin/Subscriptions';
import SuperAdminUsers from './pages/superadmin/Users';
import SuperAdminReports from './pages/superadmin/Reports';
import ActivityLogs from './pages/superadmin/ActivityLogs';
import SystemSettings from './pages/superadmin/SystemSettings';
import Support from './pages/superadmin/Support';
import Announcements from './pages/superadmin/Announcements';

// Shop
import ShopLayout from './components/layout/ShopLayout';
import ShopDashboard from './pages/shop/Dashboard';
import POS from './pages/shop/POS';
import Products from './pages/shop/Products';
import Categories from './pages/shop/Categories';
import Suppliers from './pages/shop/Suppliers';
import Inventory from './pages/shop/Inventory';
import Purchases from './pages/shop/Purchases';
import Sales from './pages/shop/Sales';
import Returns from './pages/shop/Returns';
import Customers from './pages/shop/Customers';
import Expenses from './pages/shop/Expenses';
import Staff from './pages/shop/Staff';
import Reports from './pages/shop/Reports';
import Settings from './pages/shop/Settings';
import Registers from './pages/shop/Registers';
import ShopActivityLogs from './pages/shop/ActivityLogs';

// Auth guards
function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== 'super_admin') return <Navigate to="/shop" replace />;
  return <>{children}</>;
}

function RequireShop({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />;
  return <Navigate to="/shop" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/terms',
    element: <TermsOfService />,
  },
  {
    path: '/support',
    element: <PublicSupport />,
  },

  // Super Admin Routes
  {
    path: '/super-admin',
    element: <RequireSuperAdmin><SuperAdminLayout /></RequireSuperAdmin>,
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: 'shops', element: <Shops /> },
      { path: 'packages', element: <Packages /> },
      { path: 'subscriptions', element: <Subscriptions /> },
      { path: 'users', element: <SuperAdminUsers /> },
      { path: 'reports', element: <SuperAdminReports /> },
      { path: 'activity', element: <ActivityLogs /> },
      { path: 'settings', element: <SystemSettings /> },
      { path: 'support', element: <Support /> },
      { path: 'announcements', element: <Announcements /> },
    ],
  },

  // Shop Routes
  {
    path: '/shop',
    element: <RequireShop><ShopLayout /></RequireShop>,
    children: [
      { index: true, element: <ShopDashboard /> },
      { path: 'pos', element: <POS /> },
      { path: 'products', element: <Products /> },
      { path: 'categories', element: <Categories /> },
      { path: 'brands', element: <Categories /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'purchases', element: <Purchases /> },
      { path: 'suppliers', element: <Suppliers /> },
      { path: 'sales', element: <Sales /> },
      { path: 'returns', element: <Returns /> },
      { path: 'customers', element: <Customers /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'staff', element: <Staff /> },
      { path: 'reports', element: <Reports /> },
      { path: 'settings', element: <Settings /> },
      { path: 'registers', element: <Registers /> },
      { path: 'activity-logs', element: <ShopActivityLogs /> },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);