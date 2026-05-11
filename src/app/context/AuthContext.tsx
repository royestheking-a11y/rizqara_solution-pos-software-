import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Shop, AuthState } from '../lib/types';
import { userStorage, shopStorage, activityLogStorage } from '../lib/storage';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (user: User) => void;
  updateShop: (shop: Shop) => void;
  refreshShop: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = 'rizqara_auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) {
        const { userId, shopId } = JSON.parse(saved);
        const user = userStorage.getById(userId);
        const shop = shopId ? shopStorage.getById(shopId) : null;
        if (user && user.status === 'active') {
          return { user, shop: shop || null, isAuthenticated: true };
        }
      }
    } catch {}
    return { user: null, shop: null, isAuthenticated: false };
  });

  const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const user = userStorage.authenticate(email, password);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    let shop: Shop | null = null;
    if (user.shopId) {
      shop = shopStorage.getById(user.shopId) || null;
      if (shop && shop.status === 'suspended') {
        return { success: false, error: 'Your shop has been suspended. Please contact support.' };
      }
      if (shop && shop.status === 'expired' && user.role !== 'owner') {
        return { success: false, error: 'Your shop subscription has expired.' };
      }
    }

    setState({ user, shop, isAuthenticated: true });
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: user.id, shopId: user.shopId }));

    activityLogStorage.create({
      shopId: user.shopId,
      userId: user.id,
      userName: user.name,
      action: 'Login',
      details: `${user.name} logged in`,
    });

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    if (state.user) {
      activityLogStorage.create({
        shopId: state.user.shopId,
        userId: state.user.id,
        userName: state.user.name,
        action: 'Logout',
        details: `${state.user.name} logged out`,
      });
    }
    setState({ user: null, shop: null, isAuthenticated: false });
    localStorage.removeItem(AUTH_KEY);
  }, [state.user]);

  const updateUser = useCallback((user: User) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  const updateShop = useCallback((shop: Shop) => {
    setState(prev => ({ ...prev, shop }));
  }, []);

  const refreshShop = useCallback(() => {
    if (state.user?.shopId) {
      const shop = shopStorage.getById(state.user.shopId) || null;
      setState(prev => ({ ...prev, shop }));
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, updateShop, refreshShop }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
