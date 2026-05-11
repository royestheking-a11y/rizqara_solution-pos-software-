import React from 'react';
import { Hammer, Clock, Mail, Phone, Globe } from 'lucide-react';
import { systemSettingsStorage } from '../../lib/storage';

export default function MaintenanceMode() {
  const settings = systemSettingsStorage.get();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Hammer size={40} className="text-blue-600 animate-bounce" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Scheduled Maintenance</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          We're currently performing some essential updates to make {settings.softwareName} even better. We'll be back shortly!
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
            <Clock size={18} className="text-blue-600" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Estimated Time</p>
              <p className="text-sm text-gray-700 font-semibold">15 - 30 Minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
            <Globe size={18} className="text-blue-600" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
              <p className="text-sm text-gray-700 font-semibold">Database Optimization</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400 mb-4 uppercase font-bold">Need Urgent Access?</p>
          <div className="flex flex-col gap-2">
            <a 
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Mail size={14} /> {settings.contactEmail}
            </a>
            <a 
              href={`tel:${settings.contactPhone}`}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Phone size={14} /> {settings.contactPhone}
            </a>
          </div>
        </div>

        <p className="mt-8 text-[10px] text-gray-300 font-medium">
          {settings.softwareName} {settings.version} &bull; Powered by Rizqara
        </p>
      </div>
    </div>
  );
}
