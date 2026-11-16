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
  CalendarDays
} from 'lucide-react';
import { BarChart3, ClipboardList, FileText, Home, Settings2, CalendarRange } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const {
    setSelectedDate,
    selectedDayRecord,
    tenDayPeriods,
    rollingTenDays,
    refreshData
  } = useDairy();

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [showChartModal, setShowChartModal] = useState<boolean>(false);
  const [billPeriod, setBillPeriod] = useState<TenDayPeriod | null>(null);
  const [activeSection, setActiveSection] = useState('overview');

  const goToSection = (section: string) => setActiveSection(section);

  const sectionLinks = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'daily-entry', label: 'Daily Collection', icon: Droplets },
    { id: 'daily-summary', label: 'Daily Summary', icon: Coins },
    { id: 'ten-day', label: '10-Day Billing', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'records', label: 'Milk Records', icon: ClipboardList },
    { id: 'monthly', label: 'Monthly Report', icon: CalendarRange },
  ];
  const activePageTitle = sectionLinks.find(({ id }) => id === activeSection)?.label || 'Overview';

  // Active 10-day period for quick KPI
  const current10DayPeriod = rollingTenDays || tenDayPeriods[0];

  const handleOpenBillForPeriod = (period: TenDayPeriod) => {
    setBillPeriod(period);
  };

  const handleOpenDefaultBill = () => {
    if (current10DayPeriod) {
      setBillPeriod(current10DayPeriod);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation & Controls */}
      <Header
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSupabase={() => setShowSupabaseModal(true)}
        onOpenBill={handleOpenDefaultBill}
        onOpenRateChart={() => setShowChartModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Dashboard pages">
          {sectionLinks.map(({ id, label }) => (
            <button key={id} onClick={() => goToSection(id)} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold ${activeSection === id ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{label}</button>
          ))}
        </div>
        <div className="flex items-start gap-6">
          <aside className="hidden lg:block w-56 shrink-0 sticky top-24 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Dashboard page navigation">
            <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            <nav className="space-y-1">
              {sectionLinks.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => goToSection(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${activeSection === id ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </nav>
            <div className="my-3 border-t border-slate-100" />
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Rate Management</p>
            <button onClick={() => setShowChartModal(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-800"><FileText className="h-4 w-4" />Rate Charts</button>
            <button onClick={() => setShowSettingsModal(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"><Settings2 className="h-4 w-4" />Rate Formula</button>
          </aside>
          <div className="min-w-0 flex-1 space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">DairyFlow Workspace</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{activePageTitle}</h2>
            </div>

        {/* Top KPI Metrics Row */}
        {activeSection === 'overview' && <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Selected Day Milk"
            value={selectedDayRecord?.totalQuantity ?? 0}
            unit="Litres"
            subtitle={`Morning: ${selectedDayRecord?.morning?.quantity ?? 0}L | Evening: ${selectedDayRecord?.evening?.quantity ?? 0}L`}
            icon={<Droplets className="h-5 w-5 text-sky-600" />}
            variant="sky"
          />

          <StatCard
            title="Selected Day Amount"
            value={`₹${(selectedDayRecord?.totalAmount ?? 0).toLocaleString('en-IN')}`}
            subtitle={`M: ₹${(selectedDayRecord?.morning?.amount ?? 0).toLocaleString('en-IN')} | E: ₹${(selectedDayRecord?.evening?.amount ?? 0).toLocaleString('en-IN')}`}
            icon={<Coins className="h-5 w-5 text-emerald-600" />}
            variant="emerald"
          />

          <StatCard
            title="Avg Rate / Litre"
            value={selectedDayRecord?.avgRate ? `₹${selectedDayRecord.avgRate.toFixed(2)}` : '₹0.00'}
            subtitle={`Weighted Fat: ${selectedDayRecord?.avgFat ?? 0}% | CLR: ${selectedDayRecord?.avgClr ?? 0}`}
            icon={<Gauge className="h-5 w-5 text-amber-600" />}
            variant="amber"
          />

          <StatCard
            title="10-Day Period Total"
            value={current10DayPeriod ? `₹${current10DayPeriod.totalAmount.toLocaleString('en-IN')}` : '₹0'}
            subtitle={current10DayPeriod ? `${current10DayPeriod.totalQuantity} L (${current10DayPeriod.periodLabel})` : 'No period data'}
            icon={<CalendarDays className="h-5 w-5 text-purple-600" />}
            variant="purple"
          />
        </div>
        <DailySummaryCard />
        </>}

        {/* 1. Daily Milk Entry Section (Morning & Evening side-by-side) */}
        {activeSection === 'daily-entry' && <section aria-labelledby="daily-entry-heading">
          <DailyEntrySection onOpenRateChart={() => setShowChartModal(true)} />
        </section>}

        {/* 2. Daily Combined Summary & Rate Calculation Card */}
        {activeSection === 'daily-summary' && <section aria-labelledby="daily-summary-heading">
          <DailySummaryCard />
        </section>}

        {/* 3. 10-Day Period Cumulative Total & Billing Cycles */}
        {activeSection === 'ten-day' && <section aria-labelledby="ten-day-heading">
          <TenDayPeriodCard onOpenBillForPeriod={handleOpenBillForPeriod} />
        </section>}

        {/* 4. Analytics & Trends Charts */}
        {activeSection === 'analytics' && <section aria-labelledby="analytics-heading">
          <AnalyticsCharts />
        </section>}

        {/* 5. Date-Wise Records Table & Historical Logs */}
        {activeSection === 'records' && <section aria-labelledby="records-table-heading">
          <RecordsTable onSelectDateForEdit={(date) => setSelectedDate(date)} />
        </section>}

        {activeSection === 'monthly' && <MonthlySummaryTable />}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} DairyFlow — Modern Dairy Management Dashboard</p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by React & Supabase PostgreSQL</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      {showChartModal && (
        <RateChartViewerModal
          onClose={() => setShowChartModal(false)}
          onSaved={() => refreshData()}
        />
      )}

      {showSettingsModal && (
        <RateSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {showSupabaseModal && (
        <SupabaseConfigModal onClose={() => setShowSupabaseModal(false)} />
      )}

      {billPeriod && (
        <PrintableBillModal
          period={billPeriod}
          onClose={() => setBillPeriod(null)}
        />
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
