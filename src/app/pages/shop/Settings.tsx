import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { shopStorage, userStorage } from '../../lib/storage';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  Settings as SettingsIcon, User, Store, Shield, Save,
  CreditCard, CheckCircle, AlertTriangle, Clock, Calendar, Package
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { shop, user, updateShop, updateUser } = useAuth();

  const [shopForm, setShopForm] = useState({
    name: shop?.name || '',
    phone: shop?.phone || '',
    email: shop?.email || '',
    address: shop?.address || '',
    currency: shop?.currency || 'BDT',
    taxRate: shop?.taxRate || 0,
    invoicePrefix: shop?.invoicePrefix || 'INV-',
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const saveShopSettings = () => {
    if (!shop) return;
    const updated = shopStorage.update({ ...shop, ...shopForm });
    updateShop(updated);
    toast.success('Shop settings saved');
  };

  const saveProfile = () => {
    if (!user) return;
    const updated = userStorage.update({ ...user, ...profileForm });
    updateUser(updated);
    toast.success('Profile updated');
  };

  const changePassword = () => {
    if (!user) return;
    if (user.password !== passwordForm.currentPassword) {
      toast.error('Current password is incorrect');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    userStorage.update({ ...user, password: passwordForm.newPassword });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success('Password changed successfully');
  };

  const daysLeft = shop?.expiryDate
    ? Math.ceil((new Date(shop.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const subStatusConfig = {
    active: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-700 border-green-200',
      dot: 'bg-green-500',
      title: 'text-green-800',
      sub: 'text-green-600',
      icon: <CheckCircle size={20} className="text-green-600" />,
      label: 'Active',
    },
    expired: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700 border-red-200',
      dot: 'bg-red-500',
      title: 'text-red-800',
      sub: 'text-red-600',
      icon: <AlertTriangle size={20} className="text-red-600" />,
      label: 'Expired',
    },
    suspended: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      dot: 'bg-yellow-500',
      title: 'text-yellow-800',
      sub: 'text-yellow-600',
      icon: <AlertTriangle size={20} className="text-yellow-600" />,
      label: 'Suspended',
    },
  };
  const subCfg = subStatusConfig[shop?.status || 'active'];

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  return (
    <div>
      <PageHeader title="Shop Settings" subtitle="Manage your shop configuration and account" />

      <div className="space-y-5">
        {/* ===== SUBSCRIPTION STATUS (Owner only, top of settings) ===== */}
        {user?.role === 'owner' && shop && (
          <div className={`rounded-2xl border ${subCfg.border} ${subCfg.bg} p-5`}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center shadow-sm flex-shrink-0">
                  {subCfg.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`${subCfg.title}`} style={{ fontWeight: 700 }}>Subscription Status</h3>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${subCfg.badge}`} style={{ fontWeight: 600 }}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${subCfg.dot} mr-1.5 align-middle`} />
                      {subCfg.label}
                    </span>
                  </div>
                  <div className={`text-sm ${subCfg.sub} space-y-1`}>
                    <div className="flex items-center gap-2">
                      <Package size={13} />
                      <span>Package: <strong>{shop.packageId?.replace('pkg_', '').replace('_', ' ') || 'Standard'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} />
                      <span>
                        Expiry: <strong>{shop.expiryDate ? new Date(shop.expiryDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</strong>
                      </span>
                    </div>
                    {shop.status === 'active' && daysLeft > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock size={13} />
                        <span>
                          {daysLeft <= 7
                            ? <strong className="text-red-600">⚠ Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left — Renew now!</strong>
                            : <><strong>{daysLeft}</strong> days remaining</>
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs ${subCfg.sub} mb-1`}>Monthly fee</div>
                <div className={`text-xl ${subCfg.title}`} style={{ fontWeight: 800 }}>৳{shop.monthlyFee?.toLocaleString()}</div>
                <div className={`text-[10px] ${subCfg.sub} mt-0.5`}>per month</div>
              </div>
            </div>
            {shop.status !== 'active' && (
              <div className="mt-4 pt-4 border-t border-white/30">
                <p className={`text-sm ${subCfg.sub}`} style={{ fontWeight: 500 }}>
                  {shop.status === 'expired'
                    ? '🔴 Your subscription has expired. Please contact Rizqara Solution support to renew.'
                    : '⚠️ Your account has been suspended. Please contact support for assistance.'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">Support: support@rizqarasolution.com</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Shop Settings */}
          {(user?.role === 'owner') && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Store size={18} className="text-blue-600" />
                <h3 className="text-gray-900" style={{ fontWeight: 600 }}>Shop Information</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Shop Name', key: 'name', type: 'text' },
                  { label: 'Phone', key: 'phone', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>{f.label}</label>
                    <input type={f.type} value={(shopForm as any)[f.key]} onChange={e => setShopForm({ ...shopForm, [f.key]: e.target.value })} className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Address</label>
                  <textarea value={shopForm.address} onChange={e => setShopForm({ ...shopForm, address: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Currency</label>
                    <select value={shopForm.currency} onChange={e => setShopForm({ ...shopForm, currency: e.target.value })} className={inputCls}>
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Tax Rate %</label>
                    <input type="number" min={0} max={100} value={shopForm.taxRate} onChange={e => setShopForm({ ...shopForm, taxRate: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Invoice Prefix</label>
                    <input value={shopForm.invoicePrefix} onChange={e => setShopForm({ ...shopForm, invoicePrefix: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <button onClick={saveShopSettings} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors" style={{ fontWeight: 500 }}>
                  <Save size={15} /> Save Shop Settings
                </button>
              </div>
            </div>
          )}

          {/* Profile */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-blue-600" />
              <h3 className="text-gray-900" style={{ fontWeight: 600 }}>My Profile</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Full Name</label>
                <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Email (cannot change)</label>
                <input value={user?.email || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>Phone</label>
                <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs text-gray-600">Role: <span className="capitalize text-blue-700" style={{ fontWeight: 600 }}>{user?.role}</span></div>
                <div className="text-xs text-gray-600 mt-1">Shop: <span className="text-gray-800" style={{ fontWeight: 600 }}>{shop?.name || 'N/A'}</span></div>
              </div>
              <button onClick={saveProfile} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors" style={{ fontWeight: 500 }}>
                <Save size={15} /> Save Profile
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} className="text-blue-600" />
              <h3 className="text-gray-900" style={{ fontWeight: 600 }}>Change Password</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Current Password', key: 'currentPassword' },
                { label: 'New Password', key: 'newPassword' },
                { label: 'Confirm New Password', key: 'confirmPassword' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-600 mb-1" style={{ fontWeight: 500 }}>{f.label}</label>
                  <input type="password" value={(passwordForm as any)[f.key]} onChange={e => setPasswordForm({ ...passwordForm, [f.key]: e.target.value })} className={inputCls} />
                </div>
              ))}
              <button onClick={changePassword} className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-lg text-sm hover:bg-gray-700 transition-colors" style={{ fontWeight: 500 }}>
                <Shield size={15} /> Change Password
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon size={18} className="text-blue-600" />
              <h3 className="text-gray-900" style={{ fontWeight: 600 }}>System Information</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Software', value: 'Rizqara Solution' },
                { label: 'Version', value: 'v1.0.0 Standard' },
                { label: 'Package', value: shop?.packageId?.replace('pkg_', '').replace('_', ' ') || 'N/A' },
                { label: 'Expiry', value: shop?.expiryDate ? new Date(shop.expiryDate).toLocaleDateString() : 'N/A' },
                { label: 'Data Storage', value: 'Local (Browser)' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm text-gray-800 capitalize" style={{ fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700" style={{ fontWeight: 500 }}>⚡ Rizqara Solution — Sell Faster. Track Smarter.</p>
              <p className="text-xs text-gray-500 mt-0.5">Support: support@rizqarasolution.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
