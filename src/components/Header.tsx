import React from 'react';
import { useDairy } from '../context/DairyContext';
import { Sliders, Printer, Milk, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenSupabase: () => void;
  onOpenBill: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenSupabase,
  onOpenBill,
}) => {
  const {
    isSupabaseConnected,
    isLoading,
    refreshData,
    rateSettings,
  } = useDairy();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      {/* ── Top bar ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3.5">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm shadow-emerald-900/20">
              <Milk className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900 sm:text-lg">DairyFlow</h1>
              <p className="mt-0.5 max-w-[42vw] truncate text-[11px] font-medium text-slate-500 sm:max-w-none">
                {rateSettings.dairy_name || 'Dairy Management System'}
                {rateSettings.center_code && (
                  <span className="ml-1 text-slate-400">· {rateSettings.center_code}</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Database status */}
            <button
              onClick={onOpenSupabase}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:flex"
              title={isSupabaseConnected ? 'Database connected' : 'Local storage mode'}
            >
              {isSupabaseConnected
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
              <span className="hidden md:inline">{isSupabaseConnected ? 'Connected' : 'Local mode'}</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              title="Rate Formula Settings"
            >
              <Sliders className="h-4 w-4 text-slate-500" />
              <span className="hidden lg:inline">Settings</span>
            </button>

            {/* Bill */}
            <button
              onClick={onOpenBill}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900"
              title="Generate 10-Day Bill"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bill</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
