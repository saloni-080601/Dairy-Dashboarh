import React, { useState } from 'react';
import { DairyProvider, useDairy } from './context/DairyContext';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { DailyEntrySection } from './components/DailyEntrySection';
import { DailySummaryCard } from './components/DailySummaryCard';
import { TenDayPeriodCard } from './components/TenDayPeriodCard';
import { RecordsTable } from './components/RecordsTable';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { PrintableBillModal } from './components/PrintableBillModal';
import { RateSettingsModal } from './components/RateSettingsModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { RateChartViewerModal } from './components/RateChartViewerModal';
import { MonthlySummaryTable } from './components/MonthlySummaryTable';
import { TenDayPeriod } from './types/dairy';
import {
  Droplets,
  Coins,
  Gauge,
  CalendarDays,
  BarChart3,
  ClipboardList,
  CalendarRange,
  TrendingUp,
  Database,
  Home,
  Settings2,
  FileText,
} from 'lucide-react';

// ─── Merged "Records & Billing" page with internal tabs ──────────────────────
interface RecordsBillingPageProps {
  onOpenBillForPeriod: (period: TenDayPeriod) => void;
  onSelectDateForEdit: (date: string) => void;
}

const RecordsBillingPage: React.FC<RecordsBillingPageProps> = ({
  onOpenBillForPeriod,
  onSelectDateForEdit,
}) => {
  const [tab, setTab] = useState<'ten-day' | 'records' | 'monthly'>('ten-day');

  const tabs = [
    { id: 'ten-day' as const, label: '10-Day Billing', icon: CalendarDays },
    { id: 'records' as const, label: 'Milk Records', icon: ClipboardList },
    { id: 'monthly' as const, label: 'Monthly Report', icon: CalendarRange },
  ];

  return (
    <div className="space-y-5">
      {/* Tab Bar */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 shadow-inner">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
              tab === id
                ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'ten-day' && (
        <TenDayPeriodCard onOpenBillForPeriod={onOpenBillForPeriod} />
      )}
      {tab === 'records' && (
        <RecordsTable onSelectDateForEdit={onSelectDateForEdit} />
      )}
      {tab === 'monthly' && <MonthlySummaryTable />}
    </div>
  );
};

// ─── Merged "Overview + Analytics" page ──────────────────────────────────────
interface OverviewPageProps {
  onOpenDefaultBill: () => void;
}

const OverviewPage: React.FC<OverviewPageProps> = () => {
  const { selectedDayRecord, tenDayPeriods, rollingTenDays } = useDairy();
  const current10DayPeriod = rollingTenDays || tenDayPeriods[0];
  const [tab, setTab] = useState<'summary' | 'analytics'>('summary');

  return (
    <div className="space-y-5">
      {/* KPI Cards – always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Today's Milk"
          value={selectedDayRecord?.totalQuantity ?? 0}
          unit="L"
          subtitle={`AM: ${selectedDayRecord?.morning?.quantity ?? 0}L · PM: ${selectedDayRecord?.evening?.quantity ?? 0}L`}
          icon={<Droplets className="h-5 w-5 text-sky-600" />}
          variant="sky"
        />
        <StatCard
          title="Today's Earning"
          value={`₹${(selectedDayRecord?.totalAmount ?? 0).toLocaleString('en-IN')}`}
          subtitle={`AM: ₹${(selectedDayRecord?.morning?.amount ?? 0).toLocaleString('en-IN')} · PM: ₹${(selectedDayRecord?.evening?.amount ?? 0).toLocaleString('en-IN')}`}
          icon={<Coins className="h-5 w-5 text-emerald-600" />}
          variant="emerald"
        />
        <StatCard
          title="Avg Rate / Litre"
          value={selectedDayRecord?.avgRate ? `₹${selectedDayRecord.avgRate.toFixed(2)}` : '₹0.00'}
          subtitle={`Fat: ${selectedDayRecord?.avgFat ?? 0}% · CLR: ${selectedDayRecord?.avgClr ?? 0}`}
          icon={<Gauge className="h-5 w-5 text-amber-600" />}
          variant="amber"
        />
        <StatCard
          title="10-Day Total"
          value={current10DayPeriod ? `₹${current10DayPeriod.totalAmount.toLocaleString('en-IN')}` : '₹0'}
          subtitle={current10DayPeriod ? `${current10DayPeriod.totalQuantity} L · ${current10DayPeriod.periodLabel}` : 'No period data'}
          icon={<CalendarDays className="h-5 w-5 text-purple-600" />}
          variant="purple"
        />
      </div>

      {/* Inner tab: Daily Summary | Analytics */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 shadow-inner w-full sm:w-auto sm:inline-flex">
        <button
          onClick={() => setTab('summary')}
          className={`flex flex-1 sm:flex-none items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all duration-200 ${
            tab === 'summary'
              ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          Daily Summary
        </button>
        <button
          onClick={() => setTab('analytics')}
          className={`flex flex-1 sm:flex-none items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all duration-200 ${
            tab === 'analytics'
              ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Analytics
        </button>
      </div>

      {/* Tab content */}
      {tab === 'summary' && <DailySummaryCard />}
      {tab === 'analytics' && <AnalyticsCharts />}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const DashboardContent: React.FC = () => {
  const { setSelectedDate, tenDayPeriods, rollingTenDays, refreshData } = useDairy();

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [showChartModal, setShowChartModal] = useState<boolean>(false);
  const [billPeriod, setBillPeriod] = useState<TenDayPeriod | null>(null);
  const [activeSection, setActiveSection] = useState('daily-entry');

  const current10DayPeriod = rollingTenDays || tenDayPeriods[0];

  const handleOpenBillForPeriod = (period: TenDayPeriod) => setBillPeriod(period);
  const handleOpenDefaultBill = () => {
    if (current10DayPeriod) setBillPeriod(current10DayPeriod);
  };

  // Merged nav — only 3 top-level pages now
  const sectionLinks = [
    { id: 'overview',     label: 'Overview',         icon: Home },
    { id: 'daily-entry',  label: 'Daily Collection',  icon: Droplets },
    { id: 'records',      label: 'Records & Billing', icon: BarChart3 },
  ];


  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8f5]">
      <Header
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSupabase={() => setShowSupabaseModal(true)}
        onOpenBill={handleOpenDefaultBill}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
        {/* Simple page navigation */}
        <div
          className="-mx-3 mb-4 flex gap-1 overflow-x-auto border-y border-slate-200 bg-white p-1.5 sm:mx-0 sm:mb-6 sm:rounded-xl sm:border sm:shadow-sm lg:hidden"
          aria-label="Dashboard pages"
        >
          {sectionLinks.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                activeSection === id
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 items-start gap-6">
          <aside
            className="sticky top-24 hidden w-60 shrink-0 flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_35px_-22px_rgba(15,23,42,.22)] lg:flex"
            aria-label="Dashboard page navigation"
          >
            <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Workspace</p>
            <nav className="space-y-1">
              {sectionLinks.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    activeSection === id ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />{label}
                </button>
              ))}
            </nav>
            <div className="my-3 border-t border-slate-100" />
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Rate Management</p>
            <button onClick={() => setShowChartModal(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <FileText className="h-4 w-4 shrink-0" />Rate Charts
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <Settings2 className="h-4 w-4 shrink-0" />Rate Formula
            </button>
          </aside>
          {/* Main content */}
          <div className="min-w-0 w-full flex-1 space-y-5">
            {/* Page heading */}
            {/* ── Overview (KPIs + Daily Summary + Analytics tabs) ── */}
            {activeSection === 'overview' && (
              <OverviewPage onOpenDefaultBill={handleOpenDefaultBill} />
            )}

            {/* ── Daily Collection Entry ── */}
            {activeSection === 'daily-entry' && (
              <section aria-labelledby="daily-entry-heading">
                <DailyEntrySection />
              </section>
            )}

            {/* ── Records & Billing (10-Day | Milk Records | Monthly tabs) ── */}
            {activeSection === 'records' && (
              <RecordsBillingPage
                onOpenBillForPeriod={handleOpenBillForPeriod}
                onSelectDateForEdit={(date) => {
                  setSelectedDate(date);
                  setActiveSection('daily-entry');
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} DairyFlow — Modern Dairy Management Dashboard</p>
          <p className="text-slate-400">Powered by React &amp; Supabase PostgreSQL</p>
        </div>
      </footer>

      {/* Modals */}
      {showChartModal && (
        <RateChartViewerModal onClose={() => setShowChartModal(false)} onSaved={() => refreshData()} />
      )}
      {showSettingsModal && <RateSettingsModal onClose={() => setShowSettingsModal(false)} />}
      {showSupabaseModal && <SupabaseConfigModal onClose={() => setShowSupabaseModal(false)} />}
      {billPeriod && (
        <PrintableBillModal period={billPeriod} onClose={() => setBillPeriod(null)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <DairyProvider>
      <DashboardContent />
    </DairyProvider>
  );
}
