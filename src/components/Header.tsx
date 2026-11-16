import React from 'react';
import { useDairy } from '../context/DairyContext';
import {
  Calendar,
  Database,
  Sliders,
  Printer,
  ChevronLeft,
  ChevronRight,
  Milk,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Table
} from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenSupabase: () => void;
  onOpenBill: () => void;
  onOpenRateChart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenSupabase,
  onOpenBill,
  onOpenRateChart,
}) => {
  const {
    selectedDate,
    setSelectedDate,
    isSupabaseConnected,
    isLoading,
    refreshData,
    rateSettings
  } = useDairy();

  const handlePrevDay = () => {
    const current = parseISO(selectedDate);
    setSelectedDate(format(subDays(current, 1), 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const current = parseISO(selectedDate);
    setSelectedDate(format(addDays(current, 1), 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Logo & Dairy Title */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Milk className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">DairyFlow</h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-800 border border-sky-200">
                  Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {rateSettings.dairy_name || 'Dairy Management System'}
                {rateSettings.center_code && (
                  <span className="ml-1 text-slate-400">({rateSettings.center_code})</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Date Selector Bar */}
          <div className="flex items-center bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 px-3">
              <Calendar className="h-4 w-4 text-sky-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={handleToday}
              className="ml-1 text-xs font-semibold px-2.5 py-1 bg-white hover:bg-slate-50 text-sky-700 rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              Today
            </button>
          </div>

          {/* Action Buttons & Status Badges */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Supabase status toggle badge */}
            <button
              onClick={onOpenSupabase}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title={isSupabaseConnected ? 'Supabase Connected' : 'Local Storage Mode - Click to connect Supabase'}
            >
              <Database className="h-3.5 w-3.5" />
              <span>{isSupabaseConnected ? 'Supabase Live' : 'Local Mode (Supabase)'}</span>
              {isSupabaseConnected ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              )}
            </button>

            {/* Rate Chart Viewer */}
            <button
              onClick={onOpenRateChart}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-2xs transition-colors"
              title="View & Edit Gaay/Bhains Rate Chart"
            >
              <Table className="h-3.5 w-3.5 text-amber-700" />
              <span>Rate Chart</span>
            </button>

            {/* Rate Settings */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
              title="Configure Milk Rate Formula"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Rate Formula</span>
            </button>

            {/* Print 10-Day Bill */}
            <button
              onClick={onOpenBill}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/30 transition-colors"
              title="Generate 10-Day Bill / Slip"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>10-Day Bill</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
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
