import React, { useEffect, useMemo, useState } from 'react';
import { format, getDaysInMonth, parseISO } from 'date-fns';
import { DairyProvider, useDairy } from './context/DairyContext';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { DailyEntrySection } from './components/DailyEntrySection';
import { DailySummaryCard } from './components/DailySummaryCard';
import { TenDayPeriodCard } from './components/TenDayPeriodCard';
import { TenDayStatCard, OverviewTenDayGroups } from './components/OverviewTenDayGroups';
import { RecordsTable } from './components/RecordsTable';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { PrintableBillModal } from './components/PrintableBillModal';
import { RateSettingsModal } from './components/RateSettingsModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { RateChartViewerModal } from './components/RateChartViewerModal';
import { LoginPage } from './components/LoginPage';
import { CowGroupRecords } from './components/CowGroupRecords';
import { MonthlySummaryTable } from './components/MonthlySummaryTable';
import { ExpensesManager } from './components/ExpensesManager';
import { CalfManager } from './components/CalfManager';
import { TenDayPeriod } from './types/dairy';
import { getSupabaseClient } from './lib/supabase';
import { buildPeriodObject } from './lib/calculations';
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
  Users,
  Receipt,
  Baby,
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

interface OverviewPageProps {
  onOpenBillForPeriod?: (period: TenDayPeriod) => void;
}

const SECTION_PATHS: Record<string, string> = {
  'daily-entry': '/daily-collection',
  overview: '/overview',
  'cow-groups': '/cow-groups',
  calves: '/calves',
  records: '/records',
  expenses: '/expenses',
};
const ENTRY_SECTIONS = new Set(['daily-entry', 'cow-groups']);

function getSectionFromPath(pathname: string): string {
  return Object.entries(SECTION_PATHS).find(([, path]) => path === pathname)?.[0] ?? 'daily-entry';
}

const OverviewPage: React.FC<OverviewPageProps> = ({ onOpenBillForPeriod }) => {
  const { selectedDayRecord, dailyRecords, selectedDate } = useDairy();
  const [tab, setTab] = useState<'summary' | 'analytics'>('summary');
  const lifetimeRevenue = useMemo(() => {
    const total = dailyRecords.reduce((sum, record) => sum + (record.totalAmount ?? 0), 0);
    const firstRecordDate = dailyRecords.reduce<string | null>(
      (earliest, record) => earliest === null || record.date < earliest ? record.date : earliest,
      null
    );
    return { total, firstRecordDate };
  }, [dailyRecords]);

  const { monthKey, monthStart, daysInMonth, monthLabel, monthShort, todayCycle } = useMemo(() => {
    let baseDate = new Date();
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      baseDate = new Date(y, m - 1, d);
    }
    const mKey = format(baseDate, 'yyyy-MM');
    const mStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const dInMonth = getDaysInMonth(mStart);
    const mLabel = format(baseDate, 'MMMM yyyy');
    const mShort = format(baseDate, 'MMM');
    const day = baseDate.getDate();
    const cycle: 1 | 2 | 3 = day <= 10 ? 1 : day <= 20 ? 2 : 3;

    return {
      monthKey: mKey,
      monthStart: mStart,
      daysInMonth: dInMonth,
      monthLabel: mLabel,
      monthShort: mShort,
      todayCycle: cycle,
    };
  }, [selectedDate]);

  const [selectedCycle, setSelectedCycle] = useState<1 | 2 | 3>(todayCycle);

  useEffect(() => {
    setSelectedCycle(todayCycle);
  }, [todayCycle, monthKey]);

  const currentMonthPeriods = useMemo(() => {
    const monthRecords = dailyRecords.filter(record => record.date.startsWith(monthKey));

    return ([1, 2, 3] as const).map((cycle): TenDayPeriod => {
      const startDay = cycle === 1 ? 1 : cycle === 2 ? 11 : 21;
      const endDay = cycle === 1 ? 10 : cycle === 2 ? 20 : daysInMonth;
      const startDate = `${monthKey}-${String(startDay).padStart(2, '0')}`;
      const endDate = `${monthKey}-${String(endDay).padStart(2, '0')}`;
      const records = monthRecords.filter(record => record.date >= startDate && record.date <= endDate);
      const range = cycle === 1 ? '01 - 10' : cycle === 2 ? '11 - 20' : `21 - ${daysInMonth}`;

      return buildPeriodObject(
        `${monthKey}-c${cycle}`,
        `Cycle ${cycle}: ${range} ${format(monthStart, 'MMM yyyy')}`,
        cycle,
        startDate,
        endDate,
        records
      );
    });
  }, [dailyRecords, monthKey, monthStart, daysInMonth]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
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
          title="Total revenue"
          value={`₹${lifetimeRevenue.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={lifetimeRevenue.firstRecordDate
            ? `All time · Since ${format(parseISO(lifetimeRevenue.firstRecordDate), 'dd MMM yyyy')}`
            : 'All recorded milk entries'}
          icon={<Coins className="h-4 w-4" />}
        />
        <TenDayStatCard
          periods={currentMonthPeriods}
          selectedCycle={selectedCycle}
          onSelectCycle={setSelectedCycle}
          daysInMonth={daysInMonth}
          monthShort={monthShort}
          activeCycle={todayCycle}
        />
      </div>

      <OverviewTenDayGroups
        periods={currentMonthPeriods}
        selectedCycle={selectedCycle}
        onSelectCycle={setSelectedCycle}
        daysInMonth={daysInMonth}
        monthLabel={monthLabel}
        monthShort={monthShort}
        activeCycle={todayCycle}
        onOpenBillForPeriod={onOpenBillForPeriod}
      />

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
  const { setSelectedDate, tenDayPeriods, refreshData } = useDairy();
  type AuthRole = 'admin' | 'entry';

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [showChartModal, setShowChartModal] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<AuthRole>('entry');
  const [authReady, setAuthReady] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);
  const [billPeriod, setBillPeriod] = useState<TenDayPeriod | null>(null);
  const [activeSection, setActiveSection] = useState(() => getSectionFromPath(window.location.pathname));
  const isAdmin = authRole === 'admin';

  useEffect(() => {
    const syncSectionFromPath = () => setActiveSection(getSectionFromPath(window.location.pathname));
    window.addEventListener('popstate', syncSectionFromPath);
    return () => window.removeEventListener('popstate', syncSectionFromPath);
  }, []);

  const navigateToSection = (section: string) => {
    if (!isAdmin && !ENTRY_SECTIONS.has(section)) section = 'daily-entry';
    const path = SECTION_PATHS[section];
    if (!path) return;
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setActiveSection(section);
  };

  useEffect(() => {
    if (!authReady || !authEmail || isAdmin || ENTRY_SECTIONS.has(activeSection)) return;
    window.history.replaceState({}, '', SECTION_PATHS['daily-entry']);
    setActiveSection('daily-entry');
  }, [authReady, authEmail, isAdmin, activeSection]);

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();
    if (!client) {
      setAuthEmail(null);
      setAuthRole('entry');
      setAuthReady(true);
      return;
    }

    setAuthReady(false);
    client.auth.getSession().then(({ data }) => {
      if (active) {
        const user = data.session?.user;
        setAuthEmail(user?.email ?? null);
        setAuthRole(user?.app_metadata?.role === 'admin' ? 'admin' : 'entry');
        setAuthReady(true);
      }
    }).catch(() => {
      if (active) setAuthReady(true);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (active) {
        const user = session?.user;
        setAuthEmail(user?.email ?? null);
        setAuthRole(user?.app_metadata?.role === 'admin' ? 'admin' : 'entry');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authVersion]);

  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    setAuthEmail(null);
    setAuthRole('entry');
  };

  const handleSupabaseModalClose = () => {
    setShowSupabaseModal(false);
    setAuthVersion(version => version + 1);
  };

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>;
  }

  if (!authEmail) {
    return (
      <>
        <LoginPage onLogin={() => setAuthVersion(version => version + 1)} onOpenSupabase={() => setShowSupabaseModal(true)} />
        {showSupabaseModal && <SupabaseConfigModal onClose={handleSupabaseModalClose} />}
      </>
    );
  }

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentCycle = now.getDate() <= 10 ? 1 : now.getDate() <= 20 ? 2 : 3;
  const currentBillingPeriod = tenDayPeriods.find(
    period => period.startDate.startsWith(currentMonthKey) && period.cycleNumber === currentCycle
  );

  const handleOpenBillForPeriod = (period: TenDayPeriod) => setBillPeriod(period);
  const handleOpenDefaultBill = () => {
    if (currentBillingPeriod) setBillPeriod(currentBillingPeriod);
  };

  const sectionLinks = [
    { id: 'daily-entry', label: 'Daily collection', icon: Droplets },
    { id: 'cow-groups', label: 'Cow group data', icon: Users },
    { id: 'calves', label: 'Calves & Breeding', icon: Baby },
    { id: 'records', label: 'Records & billing', icon: BarChart3 },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'overview', label: 'Overview', icon: Home },
  ].filter(section => isAdmin || ENTRY_SECTIONS.has(section.id));

  const currentSection = isAdmin || ENTRY_SECTIONS.has(activeSection) ? activeSection : 'daily-entry';

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    'daily-entry': { title: 'Daily collection', subtitle: 'Enter quantity, fat and CLR. Rate is calculated automatically.' },
    overview: { title: 'Overview', subtitle: 'Today’s milk, earnings and quality at a glance.' },
    records: { title: 'Records & billing', subtitle: 'History, 10-day cycles and monthly totals.' },
    'cow-groups': { title: 'Cow group data', subtitle: 'Group-wise morning and evening milk records.' },
    calves: { title: 'Calves & Breeding Management', subtitle: 'Track offspring, calf feeding, heat cycles, and expected calving dates.' },
    expenses: { title: 'Dairy & Cow Expenses', subtitle: 'Track cattle feed, healthcare, AI breeding, and dairy operational costs vs revenue.' },
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header
        isAdmin={isAdmin}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSupabase={() => setShowSupabaseModal(true)}
        onOpenBill={handleOpenDefaultBill}
        onLogout={handleLogout}
        userEmail={authEmail}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div
          className="-mx-3 mb-4 flex gap-1 overflow-x-auto border-y border-ink-200 bg-white p-1 sm:mx-0 sm:mb-6 sm:rounded-xl sm:border lg:hidden"
          aria-label="Dashboard pages"
        >
          {sectionLinks.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigateToSection(id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
              currentSection === id ? 'bg-forest-800 text-white' : 'text-ink-600 hover:bg-ink-50'
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
                  onClick={() => navigateToSection(id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    currentSection === id ? 'bg-forest-800 text-white' : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />{label}
                </button>
              ))}
            </nav>
            {isAdmin && (
              <>
                <div className="my-3 border-t border-ink-100" />
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Rates</p>
                <button onClick={() => setShowChartModal(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-600 hover:bg-ink-50">
                  <FileText className="h-4 w-4 shrink-0" />Rate charts
                </button>
                <button onClick={() => setShowSettingsModal(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-600 hover:bg-ink-50">
                  <Settings2 className="h-4 w-4 shrink-0" />Rate formula
                </button>
              </>
            )}
          </aside>

          <div className="min-w-0 w-full flex-1 space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink-900">{pageTitles[currentSection].title}</h2>
              <p className="mt-0.5 text-sm text-ink-500">{pageTitles[currentSection].subtitle}</p>
            </div>

            {currentSection === 'overview' && (
              <OverviewPage onOpenBillForPeriod={handleOpenBillForPeriod} />
            )}

            {currentSection === 'daily-entry' && (
              <section aria-labelledby="daily-entry-heading">
                <DailyEntrySection />
              </section>
            )}

            {currentSection === 'records' && (
              <RecordsBillingPage
                onOpenBillForPeriod={handleOpenBillForPeriod}
                onSelectDateForEdit={(date) => {
                  setSelectedDate(date);
                  navigateToSection('daily-entry');
                }}
              />
            )}

            {currentSection === 'cow-groups' && <CowGroupRecords />}

            {currentSection === 'calves' && <CalfManager />}

            {currentSection === 'expenses' && <ExpensesManager />}
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
      {showSupabaseModal && <SupabaseConfigModal onClose={handleSupabaseModalClose} />}
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
