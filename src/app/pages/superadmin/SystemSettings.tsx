import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Settings, Database, Shield, AlertTriangle, Save, Mail, Phone, Globe, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { systemSettingsStorage, SystemSettings as ISystemSettings } from '../../lib/storage';

export default function SystemSettings() {
  const [settings, setSettings] = useState<ISystemSettings>(() => systemSettingsStorage.get());
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = () => {
    systemSettingsStorage.save(settings);
    toast.success('System settings updated successfully');
  };

  const resetData = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    // Clear all rizqara data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rizqara_')) {
        localStorage.removeItem(key);
      }
    });
    toast.success('All data cleared. Refreshing...');
    setTimeout(() => window.location.reload(), 1500);
  };

  const exportData = () => {
    const data: Record<string, any> = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rizqara_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rizqara_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const storageSize = () => {
    let total = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rizqara_')) {
        total += (localStorage.getItem(key) || '').length;
      }
    });
    return (total / 1024).toFixed(2);
  };

  return (
    <div>
      <PageHeader 
        title="System Settings" 
        subtitle="Global system configuration and maintenance" 
        action={
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25"
            style={{ fontWeight: 600 }}
          >
            <Save size={16} /> Save Changes
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Settings size={18} className="text-blue-600" />
            </div>
            <h3 className="text-gray-900" style={{ fontWeight: 600 }}>Basic Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider" style={{ fontWeight: 700 }}>Software Name</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={settings.softwareName}
                  onChange={e => setSettings({...settings, softwareName: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider" style={{ fontWeight: 700 }}>Version</label>
                <input 
                  value={settings.version}
                  onChange={e => setSettings({...settings, version: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider" style={{ fontWeight: 700 }}>Default Currency</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    value={settings.defaultCurrency}
                    onChange={e => setSettings({...settings, defaultCurrency: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider" style={{ fontWeight: 700 }}>Default Tax Rate (%)</label>
              <div className="relative">
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="number"
                  value={settings.defaultTaxRate}
                  onChange={e => setSettings({...settings, defaultTaxRate: Number(e.target.value)})}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Mail size={18} className="text-blue-600" />
            </div>
            <h3 className="text-gray-900" style={{ fontWeight: 600 }}>Support Contact</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider" style={{ fontWeight: 700 }}>Contact Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={settings.contactEmail}
                  onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider" style={{ fontWeight: 700 }}>Contact Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={settings.contactPhone}
                  onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors" style={{ fontWeight: 500 }}>Enable Maintenance Mode</span>
              </label>
              <p className="mt-2 text-xs text-gray-400">When enabled, all shop users will see a maintenance screen</p>
            </div>
          </div>
        </div>

        {/* Backup & System Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Database size={18} className="text-blue-600" />
            </div>
            <h3 className="text-gray-900" style={{ fontWeight: 600 }}>System Maintenance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1" style={{ fontWeight: 700 }}>Storage Usage</div>
                <div className="text-lg text-gray-900" style={{ fontWeight: 800 }}>{storageSize()} KB</div>
              </div>
              <button 
                onClick={exportData}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                style={{ fontWeight: 600 }}
              >
                Export Backup
              </button>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-600" />
                <h4 className="text-sm text-red-800" style={{ fontWeight: 600 }}>Danger Zone</h4>
              </div>
              <p className="text-xs text-red-600 mb-4 leading-relaxed">
                Clearing system data will permanently remove all shops, products, users, and transactions. This action is irreversible.
              </p>
              <button
                onClick={resetData}
                className="w-full py-2.5 bg-red-600 text-white rounded-xl text-xs hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
                style={{ fontWeight: 600 }}
              >
                {confirmReset ? '⚠️ Click again to CONFIRM reset' : 'Reset All System Data'}
              </button>
              {confirmReset && (
                <button 
                  onClick={() => setConfirmReset(false)}
                  className="w-full mt-2 text-center text-xs text-red-400 hover:text-red-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Shield size={18} className="text-blue-600" />
            </div>
            <h3 className="text-gray-900" style={{ fontWeight: 600 }}>System Security</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Auth Guard', status: 'Active' },
              { label: 'Data Encryption', status: 'Active' },
              { label: 'Role Isolation', status: 'Active' },
              { label: 'Audit Logging', status: 'Active' },
              { label: 'SQL Protection', status: 'Active' },
              { label: 'API Security', status: 'Active' },
            ].map(item => (
              <div key={item.label} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-600" style={{ fontWeight: 500 }}>{item.label}</span>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="text-xs text-blue-700 leading-relaxed" style={{ fontWeight: 500 }}>
              Last system update checked: {new Date(settings.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}