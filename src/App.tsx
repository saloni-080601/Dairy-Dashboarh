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
  Home,
  Settings2,
  FileText,
} from 'lucide-react';

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
    { id: 'ten-day' as const, label: '10-day billing', icon: CalendarDays },
    { id: 'records' as const, label: 'Milk records', icon: ClipboardList },
    { id: 'monthly' as const, label: 'Monthly report', icon: CalendarRange },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
              tab === id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

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

const OverviewPage: React.FC = () => {
  const { selectedDayRecord, tenDayPeriods, rollingTenDays } = useDairy();
  const current10DayPeriod = rollingTenDays || tenDayPeriods[0];
  const [tab, setTab] = useState<'summary' | 'analytics'>('summary');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Today's milk"
          value={selectedDayRecord?.totalQuantity ?? 0}
          unit="L"
          subtitle={`AM ${selectedDayRecord?.morning?.quantity ?? 0} L · PM ${selectedDayRecord?.evening?.quantity ?? 0} L`}
          icon={<Droplets className="h-4 w-4" />}
        />
        <StatCard
          title="Today's earning"
          value={`₹${(selectedDayRecord?.totalAmount ?? 0).toLocaleString('en-IN')}`}
          subtitle={`AM ₹${(selectedDayRecord?.morning?.amount ?? 0).toLocaleString('en-IN')} · PM ₹${(selectedDayRecord?.evening?.amount ?? 0).toLocaleString('en-IN')}`}
          icon={<Coins className="h-4 w-4" />}
        />
        <StatCard
          title="Avg rate / litre"
          value={selectedDayRecord?.avgRate ? `₹${selectedDayRecord.avgRate.toFixed(2)}` : '₹0.00'}
          subtitle={`Fat ${selectedDayRecord?.avgFat ?? 0}% · CLR ${selectedDayRecord?.avgClr ?? 0}`}
          icon={<Gauge className="h-4 w-4" />}
        />
        <StatCard
          title="10-day total"
          value={current10DayPeriod ? `₹${current10DayPeriod.totalAmount.toLocaleString('en-IN')}` : '₹0'}
          subtitle={current10DayPeriod ? `${current10DayPeriod.totalQuantity} L · ${current10DayPeriod.periodLabel}` : 'No period data'}
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>

      <div className="flex w-full gap-1 rounded-lg bg-ink-100 p-1 sm:w-auto sm:inline-flex">
        <button
          onClick={() => setTab('summary')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition sm:flex-none ${
            tab === 'summary' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
          }`}
        >
          Daily summary
        </button>
        <button
          onClick={() => setTab('analytics')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition sm:flex-none ${
            tab === 'analytics' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
          }`}
        >
          Analytics
        </button>
      </div>

      {tab === 'summary' && <DailySummaryCard />}
      {tab === 'analytics' && <AnalyticsCharts />}
    </div>
  );
};

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

  const sectionLinks = [
    { id: 'daily-entry', label: 'Daily collection', icon: Droplets },
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'records', label: 'Records & billing', icon: BarChart3 },
  ];

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    'daily-entry': { title: 'Daily collection', subtitle: 'Enter quantity, fat and CLR. Rate is calculated automatically.' },
    overview: { title: 'Overview', subtitle: 'Today’s milk, earnings and quality at a glance.' },
    records: { title: 'Records & billing', subtitle: 'History, 10-day cycles and monthly totals.' },
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSupabase={() => setShowSupabaseModal(true)}
        onOpenBill={handleOpenDefaultBill}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div
          className="-mx-3 mb-4 flex gap-1 overflow-x-auto border-y border-ink-200 bg-white p-1 sm:mx-0 sm:mb-6 sm:rounded-xl sm:border lg:hidden"
          aria-label="Dashboard pages"
        >
          {sectionLinks.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                activeSection === id ? 'bg-forest-800 text-white' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 items-start gap-6">
          <aside
            className="sticky top-24 hidden w-56 shrink-0 flex-col rounded-xl border border-ink-200/80 bg-white p-3 shadow-panel lg:flex"
            aria-label="Dashboard page navigation"
          >
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Workspace</p>
            <nav className="space-y-0.5">
              {sectionLinks.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    activeSection === id ? 'bg-forest-800 text-white' : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />{label}
                </button>
              ))}
            </nav>
            <div className="my-3 border-t border-ink-100" />
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Rates</p>
            <button onClick={() => setShowChartModal(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-600 hover:bg-ink-50">
              <FileText className="h-4 w-4 shrink-0" />Rate charts
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-600 hover:bg-ink-50">
              <Settings2 className="h-4 w-4 shrink-0" />Rate formula
            </button>
          </aside>

          <div className="min-w-0 w-full flex-1 space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink-900">{pageTitles[activeSection].title}</h2>
              <p className="mt-0.5 text-sm text-ink-500">{pageTitles[activeSection].subtitle}</p>
            </div>

            {activeSection === 'overview' && <OverviewPage />}

            {activeSection === 'daily-entry' && (
              <section aria-labelledby="daily-entry-heading">
                <DailyEntrySection />
              </section>
            )}

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

      <footer className="no-print border-t border-ink-200 bg-white py-4 text-center text-xs text-ink-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
          <p>© {new Date().getFullYear()} DairyFlow</p>
          <p>Collection, rates and billing in one desk</p>
        </div>
      </footer>

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
