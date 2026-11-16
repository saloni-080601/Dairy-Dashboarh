import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'sky' | 'amber' | 'blue' | 'emerald' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  variant = 'sky'
}) => {
  const variantStyles = {
    sky: 'bg-white border-slate-200 text-sky-600',
    amber: 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200/80 text-amber-600',
    blue: 'bg-gradient-to-br from-blue-50/50 to-sky-50/30 border-blue-200/80 text-blue-600',
    emerald: 'bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-emerald-200/80 text-emerald-600',
    purple: 'bg-gradient-to-br from-purple-50/50 to-indigo-50/30 border-purple-200/80 text-purple-600',
  }[variant];

  return (
    <div className={`p-4 rounded-2xl border shadow-xs transition-all hover:shadow-md ${variantStyles}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className="p-2 rounded-xl bg-white/80 shadow-2xs backdrop-blur-xs">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>
      )}
    </div>
  );
};
