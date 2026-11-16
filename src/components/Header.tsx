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
    <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-800 text-white">
            <Milk className="h-4.5 w-4.5 h-4 w-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-ink-900">DairyFlow</h1>
            <p className="truncate text-xs text-ink-500">
              {rateSettings.dairy_name || 'Collection desk'}
              {rateSettings.center_code ? ` · ${rateSettings.center_code}` : ''}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onOpenSupabase}
            className="hidden items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 sm:flex"
            title={isSupabaseConnected ? 'Database connected' : 'Local storage mode'}
          >
            {isSupabaseConnected
              ? <CheckCircle2 className="h-3.5 w-3.5 text-forest-600" />
              : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
            <span className="hidden md:inline">{isSupabaseConnected ? 'Connected' : 'Local'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="btn-secondary py-1.5 text-xs"
            title="Rate formula settings"
          >
            <Sliders className="h-4 w-4 text-ink-500" />
            <span className="hidden lg:inline">Settings</span>
          </button>

          <button
            onClick={onOpenBill}
            className="btn-primary py-1.5 text-xs"
            title="Generate 10-day bill"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bill</span>
          </button>

          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="rounded-lg border border-ink-200 bg-white p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-forest-700' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
