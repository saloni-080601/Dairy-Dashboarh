import React, { useEffect, useMemo, useState } from 'react';
import { format, getDaysInMonth, parseISO } from 'date-fns';
import { DairyProvider, useDairy } from './context/DairyContext';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { DailyEntrySection } from './components/DailyEntrySection';
import { DailySummaryCard } from './components/DailySummaryCard';
import { TenDayPeriodCard } from './components/TenDayPeriodCard';
import { OverviewTenDayGroups } from './components/OverviewTenDayGroups';
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
  Wallet,
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
    { id: 'ten-day' as const, label: '10-day bill', icon: CalendarDays },
    { id: 'records' as const, label: 'Daily records', icon: ClipboardList },
    { id: 'monthly' as const, label: 'Monthly total', icon: CalendarRange },
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
  const { dailyRecords, selectedDate } = useDairy();
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
        `${range} ${format(monthStart, 'MMM yyyy')}`,
        cycle,
        startDate,
        endDate,
        records
      );
    });
  }, [dailyRecords, monthKey, monthStart, daysInMonth]);

  const monthSummary = useMemo(() => {
    return currentMonthPeriods.reduce(
      (sum, period) => ({
        litres: sum.litres + period.totalQuantity,
        amount: sum.amount + period.totalAmount,
        days: sum.days + period.daysWithEntries,
      }),
      { litres: 0, amount: 0, days: 0 }
    );
  }, [currentMonthPeriods]);

  const recordDays = dailyRecords.length;
  const averagePerDay = recordDays ? lifetimeRevenue.total / recordDays : 0;
  const monthRate = monthSummary.litres ? monthSummary.amount / monthSummary.litres : 0;

  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-labelledby="today-heading">
        <div>
          <h3 id="today-heading" className="text-sm font-semibold text-ink-900">Today</h3>
          <p className="text-xs text-ink-500">One day, with morning and evening side by side. The list below is every batch saved for that day.</p>
        </div>
        <DailySummaryCard />
      </section>

      <section className="space-y-3" aria-labelledby="month-heading">
        <div>
          <h3 id="month-heading" className="text-sm font-semibold text-ink-900">This month · {monthLabel}</h3>
          <p className="text-xs text-ink-500">Payment is split into three cycles: 1–10, 11–20, and 21 through the end of the month.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Month milk"
            value={monthSummary.litres.toLocaleString('en-IN')}
            unit="L"
            subtitle={`${monthSummary.days} collection days`}
            icon={<Droplets className="h-4 w-4" />}
          />
          <StatCard
            title="Month money"
            value={`₹${monthSummary.amount.toLocaleString('en-IN')}`}
            subtitle="All three cycles combined"
            icon={<Coins className="h-4 w-4" />}
          />
          <StatCard
            title="Average price"
            value={monthRate ? `₹${monthRate.toFixed(2)}` : '₹0.00'}
            subtitle="Per litre this month"
            icon={<Gauge className="h-4 w-4" />}
          />
          <StatCard
            title="Cycle for this date"
            value={todayCycle === 1 ? '1–10' : todayCycle === 2 ? '11–20' : `21–${daysInMonth}`}
            subtitle={`${monthShort} · cycle ${todayCycle} of 3`}
            icon={<CalendarDays className="h-4 w-4" />}
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
      </section>

      <section className="space-y-3" aria-labelledby="all-records-heading">
        <div>
          <h3 id="all-records-heading" className="text-sm font-semibold text-ink-900">All records</h3>
          <p className="text-xs text-ink-500">
            {lifetimeRevenue.firstRecordDate
              ? `Everything saved since ${format(parseISO(lifetimeRevenue.firstRecordDate), 'd MMM yyyy')}.`
              : 'Totals appear here after the first collection is saved.'}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            title="Total earned"
            value={`₹${lifetimeRevenue.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Milk income only"
            icon={<Wallet className="h-4 w-4" />}
          />
          <StatCard
            title="Days recorded"
            value={recordDays}
            subtitle="Days with at least one entry"
            icon={<CalendarDays className="h-4 w-4" />}
          />
          <StatCard
            title="Average per day"
            value={`₹${averagePerDay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            subtitle="Total earned ÷ days recorded"
            icon={<Coins className="h-4 w-4" />}
          />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="trend-heading">
        <div>
          <h3 id="trend-heading" className="text-sm font-semibold text-ink-900">Recent trend</h3>
          <p className="text-xs text-ink-500">The last 12 recorded days, morning and evening kept apart.</p>
        </div>
        <AnalyticsCharts />
      </section>
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
    { id: 'daily-entry', label: 'Add milk', short: 'Milk', icon: Droplets },
    { id: 'cow-groups', label: 'Cows & buffaloes', short: 'Animals', icon: Users },
    { id: 'calves', label: 'Calves', short: 'Calves', icon: Baby },
    { id: 'records', label: 'Bills & records', short: 'Bills', icon: BarChart3 },
    { id: 'expenses', label: 'Expenses', short: 'Costs', icon: Receipt },
    { id: 'overview', label: 'Today', short: 'Today', icon: Home },
  ].filter(section => isAdmin || ENTRY_SECTIONS.has(section.id));

  const currentSection = isAdmin || ENTRY_SECTIONS.has(activeSection) ? activeSection : 'daily-entry';

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    'daily-entry': { title: 'Daily milk', subtitle: 'Enter litres, fat, and lactometer reading. The price is calculated for you.' },
    overview: { title: 'Today', subtitle: 'Start with this day, then the month’s three bills, then everything recorded so far.' },
    records: { title: 'Bills and records', subtitle: '10-day bill, day-by-day records, and the monthly total.' },
    'cow-groups': { title: 'Cows and buffaloes', subtitle: 'Milk from each animal, morning and evening kept separate.' },
    calves: { title: 'Calves', subtitle: 'Calf name, mother, pregnancy, and date of birth.' },
    expenses: { title: 'Expenses', subtitle: 'Feed, medicine, and other costs, next to milk income.' },
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
          {sectionLinks.map(({ id, short, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigateToSection(id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
              currentSection === id ? 'bg-forest-800 text-white' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {short}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 items-start gap-6">
          <aside
            className="sticky top-24 hidden w-56 shrink-0 flex-col rounded-xl border border-ink-200/80 bg-white p-3 shadow-panel lg:flex"
            aria-label="Dashboard page navigation"
          >
            <p className="px-3 pb-2 pt-1 text-xs font-semibold text-ink-400">Pages</p>
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
                <p className="px-3 pb-1 text-xs font-semibold text-ink-400">Rate</p>
                <button onClick={() => setShowChartModal(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-600 hover:bg-ink-50">
                  <FileText className="h-4 w-4 shrink-0" />Rate chart
                </button>
                <button onClick={() => setShowSettingsModal(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-ink-600 hover:bg-ink-50">
                  <Settings2 className="h-4 w-4 shrink-0" />Price formula
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
          <p>Milk, price, and bills in one place</p>
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
