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
}) => {
  return (
    <div className="panel p-4">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">{title}</p>
        <div className="rounded-md bg-ink-50 p-1.5 text-forest-800">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold tracking-tight text-ink-900">{value}</span>
        {unit && <span className="text-xs font-medium text-ink-400">{unit}</span>}
      </div>
      {subtitle && (
        <p className="mt-1 truncate text-xs text-ink-500">{subtitle}</p>
      )}
    </div>
  );
};
