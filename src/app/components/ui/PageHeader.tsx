import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: string;
}

export function PageHeader({ title, subtitle, action, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-gray-900 truncate" style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.4px' }}>{title}</h1>
          {badge && (
            <span className="text-[11px] px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full flex-shrink-0" style={{ fontWeight: 600 }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-gray-500 text-sm mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
