import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'gold' | 'red' | 'amber';
  trend?: { value: number; label: string };
}

const colorConfig = {
  blue:   { bg: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-700',   icon: 'bg-blue-600',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-600',  light: 'bg-green-50',  text: 'text-green-700',  icon: 'bg-green-600',  border: 'border-green-100' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', icon: 'bg-orange-500', border: 'border-orange-100' },
  purple: { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-600', border: 'border-purple-100' },
  gold:   { bg: 'bg-amber-500',  light: 'bg-yellow-50', text: 'text-yellow-700', icon: 'bg-amber-500',  border: 'border-yellow-100' },
  red:    { bg: 'bg-red-600',    light: 'bg-red-50',    text: 'text-red-600',    icon: 'bg-red-600',    border: 'border-red-100' },
  amber:  { bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700',  icon: 'bg-amber-500',  border: 'border-amber-100' },
};

export function StatCard({ title, value, subtitle, icon, color = 'blue', trend }: StatCardProps) {
  const cfg = colorConfig[color];
  return (
    <div className={`bg-white rounded-2xl border ${cfg.border} p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`${cfg.icon} w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs px-2 py-1 rounded-full ${
            trend.value >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`} style={{ fontWeight: 600 }}>
            {trend.value >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className={`text-2xl mb-0.5 ${cfg.text}`} style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</p>
      <p className="text-gray-600 text-sm" style={{ fontWeight: 500 }}>{title}</p>
      {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          <span style={{ fontWeight: 500 }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}