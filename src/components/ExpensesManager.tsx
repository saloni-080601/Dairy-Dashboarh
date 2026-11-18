import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Search,
  Download,
  Calendar,
  Layers,
  Building2,
  TrendingDown,
  Coins,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  PieChart as PieIcon,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { useDairy } from '../context/DairyContext';
import {
  DairyExpense,
  DairyExpenseInput,
  ExpenseCategoryType,
  ExpenseSubcategory,
  PaymentMode,
} from '../types/dairy';
import {
  fetchExpenses,
  saveExpense,
  deleteExpense,
  fetchCowCollection,
} from '../lib/supabase';
import {
  EXPENSE_SUBCATEGORIES,
  QUICK_EXPENSE_TEMPLATES,
  PAYMENT_MODES,
} from '../lib/expensesData';
import { COW_GROUPS } from '../lib/cowGroupData';

type FilterPeriod = 'this-month' | 'last-month' | 'last-30-days' | 'all-time' | 'custom';

export const ExpensesManager: React.FC = () => {
  const { dailyRecords } = useDairy();
  const [expenses, setExpenses] = useState<DairyExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<DairyExpense | null>(null);
  const [cowList, setCowList] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('this-month');
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'cow' | 'dairy'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [showCharts, setShowCharts] = useState<boolean>(true);

  // Form State
  const [formDate, setFormDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [formCategoryType, setFormCategoryType] = useState<ExpenseCategoryType>('cow');
  const [formSubcategory, setFormSubcategory] = useState<ExpenseSubcategory>('feed_fodder');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formTargetCow, setFormTargetCow] = useState<string>('All Cows / Farm');
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentMode>('online_upi');
  const [formReceiptNo, setFormReceiptNo] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load expenses & cows
  const loadExpensesData = useCallback(async () => {
    setLoading(true);
    try {
      const [expResult, cowsResult] = await Promise.all([
        fetchExpenses(),
        fetchCowCollection(),
      ]);

      setExpenses(expResult.data || []);

      const dynamicCows = (cowsResult.cows || []).map(c => c.name);
      const combined = Array.from(new Set(['All Cows / Farm', ...COW_GROUPS, ...dynamicCows]));
      setCowList(combined);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpensesData();
  }, [loadExpensesData]);

  // Determine date boundary for period filter
  const dateInterval = useMemo(() => {
    const now = new Date();
    if (selectedPeriod === 'this-month') {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
    if (selectedPeriod === 'last-month') {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    if (selectedPeriod === 'last-30-days') {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      return { start, end: now };
    }
    if (selectedPeriod === 'custom') {
      return {
        start: customStartDate ? parseISO(customStartDate) : startOfMonth(now),
        end: customEndDate ? parseISO(customEndDate) : now,
      };
    }
    return null; // all time
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Filtered expenses based on all filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Period filter
      if (dateInterval) {
        try {
          const expDate = parseISO(exp.date);
          if (!isWithinInterval(expDate, dateInterval)) return false;
        } catch {
          // ignore date parse error
        }
      }

      // Category Tab filter
      if (activeCategoryTab !== 'all' && exp.category_type !== activeCategoryTab) {
        return false;
      }

      // Subcategory filter
      if (selectedSubcategory !== 'all' && exp.subcategory !== selectedSubcategory) {
        return false;
      }

      // Payment mode filter
      if (selectedPaymentMode !== 'all' && exp.payment_mode !== selectedPaymentMode) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(q);
        const matchNotes = (exp.notes || '').toLowerCase().includes(q);
        const matchCow = (exp.target_cow || '').toLowerCase().includes(q);
        const matchSub = (EXPENSE_SUBCATEGORIES[exp.subcategory]?.labelEn || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchCow && !matchSub) return false;
      }

      return true;
    });
  }, [expenses, dateInterval, activeCategoryTab, selectedSubcategory, selectedPaymentMode, searchQuery]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    let total = 0;
    let cowTotal = 0;
    let dairyTotal = 0;

    filteredExpenses.forEach(exp => {
      total += exp.amount;
      if (exp.category_type === 'cow') {
        cowTotal += exp.amount;
      } else {
        dairyTotal += exp.amount;
      }
    });

    // Milk Revenue for matching period from dailyRecords
    let milkRevenue = 0;
    let milkLitres = 0;
    dailyRecords.forEach(rec => {
      if (dateInterval) {
        try {
          const rDate = parseISO(rec.date);
          if (isWithinInterval(rDate, dateInterval)) {
            milkRevenue += rec.totalAmount || 0;
            milkLitres += rec.totalQuantity || 0;
          }
        } catch {
          // ignore
        }
      } else {
        milkRevenue += rec.totalAmount || 0;
        milkLitres += rec.totalQuantity || 0;
      }
    });

    const netProfit = milkRevenue - total;
    const profitMargin = milkRevenue > 0 ? (netProfit / milkRevenue) * 100 : 0;
    const cowPercentage = total > 0 ? (cowTotal / total) * 100 : 0;
    const dairyPercentage = total > 0 ? (dairyTotal / total) * 100 : 0;

    return {
      total,
      cowTotal,
      dairyTotal,
      milkRevenue,
      milkLitres,
      netProfit,
      profitMargin,
      cowPercentage,
      dairyPercentage,
      count: filteredExpenses.length,
    };
  }, [filteredExpenses, dailyRecords, dateInterval]);

  // Subcategory Breakdown for Bar Chart
  const subcategoryChartData = useMemo(() => {
    const map: Record<string, { key: ExpenseSubcategory; name: string; amount: number; color: string }> = {};

    filteredExpenses.forEach(exp => {
      const meta = EXPENSE_SUBCATEGORIES[exp.subcategory];
      const key = exp.subcategory;
      if (!map[key]) {
        map[key] = {
          key,
          name: meta ? meta.labelEn : key,
          amount: 0,
          color: meta ? meta.color : '#64748b',
        };
      }
      map[key].amount += exp.amount;
    });

    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Pie chart data: Cow vs Dairy Operations
  const ratioPieData = useMemo(() => {
    return [
      { name: 'Cow Care (Feeds & Meds)', value: metrics.cowTotal, color: '#15803d' },
      { name: 'Dairy Operations', value: metrics.dairyTotal, color: '#0284c7' },
    ].filter(item => item.value > 0);
  }, [metrics.cowTotal, metrics.dairyTotal]);

  // Open modal for add
  const handleOpenAddModal = (presetCategory: ExpenseCategoryType = 'cow') => {
    setEditingExpense(null);
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormCategoryType(presetCategory);
    setFormSubcategory(presetCategory === 'cow' ? 'feed_fodder' : 'labor_salary');
    setFormTitle('');
    setFormAmount('');
    setFormTargetCow(presetCategory === 'cow' ? 'All Cows / Farm' : '');
    setFormPaymentMode('online_upi');
    setFormReceiptNo('');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (exp: DairyExpense) => {
    setEditingExpense(exp);
    setFormDate(exp.date);
    setFormCategoryType(exp.category_type);
    setFormSubcategory(exp.subcategory);
    setFormTitle(exp.title);
    setFormAmount(String(exp.amount));
    setFormTargetCow(exp.target_cow || '');
    setFormPaymentMode(exp.payment_mode || 'cash');
    setFormReceiptNo(exp.receipt_no || '');
    setFormNotes(exp.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Quick apply template
  const handleApplyTemplate = (tmpl: typeof QUICK_EXPENSE_TEMPLATES[0]) => {
    setFormCategoryType(tmpl.category_type);
    setFormSubcategory(tmpl.subcategory);
    setFormTitle(tmpl.title);
    if (!formAmount) {
      setFormAmount(String(tmpl.defaultAmount));
    }
    if (tmpl.category_type === 'cow' && !formTargetCow) {
      setFormTargetCow('All Cows / Farm');
    }
  };

  // Save form
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }
    if (!formTitle.trim()) {
      setFormError('Please enter an expense title or description');
      return;
    }

    setIsSaving(true);
    try {
      const payload: DairyExpenseInput = {
        id: editingExpense?.id,
        date: formDate,
        category_type: formCategoryType,
        subcategory: formSubcategory,
        title: formTitle.trim(),
        amount: amountNum,
        target_cow: formCategoryType === 'cow' ? formTargetCow : '',
        payment_mode: formPaymentMode,
        receipt_no: formReceiptNo.trim(),
        notes: formNotes.trim(),
      };

      const res = await saveExpense(payload);
      if (res.success && res.data) {
        setIsModalOpen(false);
        await loadExpensesData();
      } else {
        setFormError(res.error || 'Failed to save expense');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setDeleteConfirmId(null);
      await loadExpensesData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ['Date', 'Category Type', 'Subcategory', 'Title', 'Target Cow', 'Amount (INR)', 'Payment Mode', 'Receipt No', 'Notes'];
    const rows = filteredExpenses.map(exp => [
      exp.date,
      exp.category_type === 'cow' ? 'Cow Expense' : 'Dairy Operation',
      EXPENSE_SUBCATEGORIES[exp.subcategory]?.labelEn || exp.subcategory,
      `"${exp.title.replace(/"/g, '""')}"`,
      `"${exp.target_cow || ''}"`,
      exp.amount,
      exp.payment_mode,
      `"${exp.receipt_no || ''}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dairy-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-ink-200/90 bg-white p-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Receipt className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-ink-900 sm:text-lg">
              Dairy & Cow Expenses Desk
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-ink-500 sm:text-sm">
            Track cattle feeds, health, breeding, and dairy operational costs vs milk earnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Dropdown */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value as FilterPeriod)}
              className="appearance-none rounded-lg border border-ink-200 bg-ink-50/70 py-2 pl-3 pr-8 text-xs font-semibold text-ink-800 transition hover:border-ink-300 focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600 sm:text-sm cursor-pointer"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="all-time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Download CSV report"
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            <Download className="h-3.5 w-3.5 text-ink-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => handleOpenAddModal('cow')}
            className="flex items-center gap-1.5 rounded-lg bg-forest-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-forest-900 active:scale-95 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {selectedPeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-ink-50/60 p-3 text-xs sm:text-sm">
          <Calendar className="h-4 w-4 text-ink-500" />
          <span className="font-semibold text-ink-700">Select Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-800 focus:border-forest-600 focus:outline-none"
            />
            <span className="text-ink-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-800 focus:border-forest-600 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total Expense */}
        <div className="relative overflow-hidden rounded-xl border border-red-200/80 bg-white p-4 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Total Expenses
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-ink-900 sm:text-3xl">
              ₹{metrics.total.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {metrics.count} expenses recorded
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </div>

        {/* Cow Expenses */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-200/80 bg-white p-4 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Cow Care Expenses
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">
              ₹{metrics.cowTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
            <span className="font-semibold">{metrics.cowPercentage.toFixed(0)}%</span> of total · Feed, Vet & AI
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" />
        </div>

        {/* Dairy Operations */}
        <div className="relative overflow-hidden rounded-xl border border-sky-200/80 bg-white p-4 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
              Dairy Operations
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
              ₹{metrics.dairyTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-sky-700">
            <span className="font-semibold">{metrics.dairyPercentage.toFixed(0)}%</span> of total · Wages, Power & Tools
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-600" />
        </div>

        {/* Net Profit & Revenue */}
        <div className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-panel ${
          metrics.netProfit >= 0 ? 'border-forest-200/80' : 'border-rose-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Net Profit / Margin
            </span>
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              metrics.netProfit >= 0 ? 'bg-forest-50 text-forest-700' : 'bg-rose-50 text-rose-700'
            }`}>
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-black tracking-tight sm:text-3xl ${
              metrics.netProfit >= 0 ? 'text-forest-800' : 'text-rose-600'
            }`}>
              ₹{metrics.netProfit.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Milk Sales: ₹{metrics.milkRevenue.toLocaleString('en-IN')} ({metrics.profitMargin.toFixed(0)}% margin)
          </p>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${
            metrics.netProfit >= 0 ? 'bg-forest-600' : 'bg-rose-500'
          }`} />
        </div>
      </div>



      {/* Category Tabs & Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Main 3 Tabs */}
          <div className="flex gap-1 rounded-lg bg-ink-100 p-1 sm:w-auto">
            <button
              onClick={() => setActiveCategoryTab('all')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                activeCategoryTab === 'all'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <span>All Expenses</span>
              <span className="rounded-full bg-ink-200 px-1.5 py-0.2 text-[10px] text-ink-700">
                {expenses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveCategoryTab('cow')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                activeCategoryTab === 'cow'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <span>Cow Expenses</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeCategoryTab === 'cow' ? 'bg-emerald-900 text-emerald-100' : 'bg-ink-200 text-ink-700'
              }`}>
                {expenses.filter(e => e.category_type === 'cow').length}
              </span>
            </button>
            <button
              onClick={() => setActiveCategoryTab('dairy')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                activeCategoryTab === 'dairy'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <span>Dairy Operations</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeCategoryTab === 'dairy' ? 'bg-sky-900 text-sky-100' : 'bg-ink-200 text-ink-700'
              }`}>
                {expenses.filter(e => e.category_type === 'dairy').length}
              </span>
            </button>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddModal('cow')}
              className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Cow Expense</span>
            </button>
            <button
              onClick={() => handleOpenAddModal('dairy')}
              className="flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-100"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Dairy Expense</span>
            </button>
          </div>
        </div>

        {/* Search & Sub-Filter Row */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200/80 bg-white p-2 shadow-sm">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search expenses by title, notes, cow tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-ink-200 bg-ink-50/50 py-1.5 pl-8 pr-3 text-xs text-ink-900 placeholder:text-ink-400 focus:border-forest-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Subcategory Filter */}
          <div className="relative">
            <select
              value={selectedSubcategory}
              onChange={e => setSelectedSubcategory(e.target.value)}
              className="appearance-none rounded-md border border-ink-200 bg-ink-50/50 py-1.5 pl-2.5 pr-7 text-xs font-semibold text-ink-700 focus:border-forest-600 focus:outline-none"
            >
              <option value="all">All Subcategories</option>
              {Object.values(EXPENSE_SUBCATEGORIES)
                .filter(sub => activeCategoryTab === 'all' || sub.category === activeCategoryTab)
                .map(sub => (
                  <option key={sub.key} value={sub.key}>
                    {sub.labelEn}
                  </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-400" />
          </div>

          {/* Payment Mode Filter */}
          <div className="relative">
            <select
              value={selectedPaymentMode}
              onChange={e => setSelectedPaymentMode(e.target.value)}
              className="appearance-none rounded-md border border-ink-200 bg-ink-50/50 py-1.5 pl-2.5 pr-7 text-xs font-semibold text-ink-700 focus:border-forest-600 focus:outline-none"
            >
              <option value="all">All Payment Modes</option>
              {PAYMENT_MODES.map(pm => (
                <option key={pm.value} value={pm.value}>
                  {pm.labelEn}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-400" />
          </div>

          {(searchQuery || selectedSubcategory !== 'all' || selectedPaymentMode !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubcategory('all');
                setSelectedPaymentMode('all');
              }}
              className="text-xs font-semibold text-rose-600 hover:underline px-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Expense List Table */}
      <div className="overflow-hidden rounded-xl border border-ink-200/90 bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/70 text-ink-600">
                <th className="py-3 pl-4 pr-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Expense Description</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Target Cow</th>
                <th className="px-3 py-3 font-semibold">Payment Mode</th>
                <th className="px-3 py-3 text-right font-semibold">Amount</th>
                <th className="py-3 pl-3 pr-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-400">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-ink-400" />
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-400">
                    <Receipt className="mx-auto mb-2 h-8 w-8 text-ink-300" />
                    <p className="font-semibold text-ink-700">No expenses found</p>
                    <p className="mt-1 text-xs">Record an expense using the button above.</p>
                    <button
                      onClick={() => handleOpenAddModal('cow')}
                      className="mt-3 inline-flex items-center gap-1 rounded-lg bg-forest-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-forest-900"
                    >
                      <Plus className="h-3.5 w-3.5" /> + Add First Expense
                    </button>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => {
                  const meta = EXPENSE_SUBCATEGORIES[exp.subcategory];
                  const isCow = exp.category_type === 'cow';

                  return (
                    <tr
                      key={exp.id}
                      className="transition hover:bg-ink-50/50"
                    >
                      {/* Date */}
                      <td className="whitespace-nowrap py-3 pl-4 pr-3 font-medium text-ink-700">
                        {exp.date ? format(parseISO(exp.date), 'dd MMM yyyy') : '—'}
                      </td>

                      {/* Title & Notes */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-ink-900">{exp.title}</div>
                        {exp.notes && (
                          <div className="mt-0.5 text-xs text-ink-500 line-clamp-1">
                            {exp.notes}
                          </div>
                        )}
                        {exp.receipt_no && (
                          <div className="mt-0.5 inline-block text-[10px] text-ink-400">
                            Receipt: {exp.receipt_no}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="whitespace-nowrap px-3 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            color: meta?.color || '#334155',
                            backgroundColor: meta?.bgColor || '#f1f5f9',
                            border: `1px solid ${meta?.borderColor || '#cbd5e1'}`,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: meta?.color || '#64748b' }}
                          />
                          {meta?.labelEn || exp.subcategory}
                        </span>
                      </td>

                      {/* Target Cow */}
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-ink-700">
                        {isCow && exp.target_cow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 border border-emerald-200">
                            🐄 {exp.target_cow}
                          </span>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="inline-flex items-center rounded bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
                          {PAYMENT_MODES.find(p => p.value === exp.payment_mode)?.labelEn || exp.payment_mode}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <span className="font-black text-ink-950 sm:text-base">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap py-3 pl-3 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            title="Edit Expense"
                            className="rounded p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {deleteConfirmId === exp.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded bg-ink-200 px-1.5 py-0.5 text-[10px] text-ink-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(exp.id)}
                              title="Delete Expense"
                              className="rounded p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-ink-300 bg-ink-50/90 font-bold text-ink-900">
                  <td colSpan={5} className="py-3 pl-4 pr-3 text-left">
                    Total ({filteredExpenses.length} Records)
                  </td>
                  <td className="px-3 py-3 text-right text-base text-red-700 font-black">
                    ₹{metrics.total.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl sm:p-6 my-8">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100 text-forest-800">
                  <Receipt className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-ink-900 sm:text-lg">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Templates Chips (Only when creating new) */}
            {!editingExpense && (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Quick Suggestions (1-Tap Fill):
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {QUICK_EXPENSE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="rounded-md border border-ink-200 bg-ink-50/70 px-2 py-1 text-[11px] font-medium text-ink-700 transition hover:bg-forest-50 hover:border-forest-300 hover:text-forest-900"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              {/* Category Type Toggle: Cow vs Dairy Operations */}
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Expense Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategoryType('cow');
                      setFormSubcategory('feed_fodder');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-bold transition ${
                      formCategoryType === 'cow'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <span>🐄 Cow Care Expense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategoryType('dairy');
                      setFormSubcategory('labor_salary');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-bold transition ${
                      formCategoryType === 'dairy'
                        ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <span>🏭 Dairy Operation Expense</span>
                  </button>
                </div>
              </div>

              {/* Subcategory & Date Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Subcategory *
                  </label>
                  <select
                    value={formSubcategory}
                    onChange={e => setFormSubcategory(e.target.value as ExpenseSubcategory)}
                    className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-xs font-semibold text-ink-800 focus:border-forest-600 focus:outline-none"
                  >
                    {Object.values(EXPENSE_SUBCATEGORIES)
                      .filter(s => s.category === formCategoryType)
                      .map(s => (
                        <option key={s.key} value={s.key}>
                          {s.labelEn}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-xs text-ink-800 focus:border-forest-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Title & Amount Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Expense Title / Item Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mustard Cake 2 bags, Vet Doctor fee, Electricity bill..."
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-forest-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-ink-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      className="w-full rounded-lg border border-ink-300 bg-white py-2 pl-7 pr-3 text-xs font-bold text-ink-900 focus:border-forest-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Cow Tag (if cow expense) & Payment Mode */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {formCategoryType === 'cow' ? (
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Target Cow / Herd
                    </label>
                    <select
                      value={formTargetCow}
                      onChange={e => setFormTargetCow(e.target.value)}
                      className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-xs font-semibold text-ink-800 focus:border-forest-600 focus:outline-none"
                    >
                      {cowList.map(cow => (
                        <option key={cow} value={cow}>
                          {cow === 'All Cows / Farm' ? 'All Cows / Entire Farm' : `Cow: ${cow}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Receipt / Invoice No. (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EB-2026-90"
                      value={formReceiptNo}
                      onChange={e => setFormReceiptNo(e.target.value)}
                      className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-xs text-ink-900 focus:border-forest-600 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formPaymentMode}
                    onChange={e => setFormPaymentMode(e.target.value as PaymentMode)}
                    className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-xs font-semibold text-ink-800 focus:border-forest-600 focus:outline-none"
                  >
                    {PAYMENT_MODES.map(pm => (
                      <option key={pm.value} value={pm.value}>
                        {pm.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Notes / Supplier Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks or vendor/shop name..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full rounded-lg border border-ink-300 bg-white p-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-forest-600 focus:outline-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-forest-800 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-forest-900 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{editingExpense ? 'Save Changes' : 'Save Expense'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          {/* Visual Analytics Section */}
      <div className="rounded-xl border border-ink-200/80 bg-white p-4 shadow-panel">
        <div className="flex items-center justify-between border-b border-ink-100 pb-3">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-forest-700" />
            <h4 className="text-sm font-bold text-ink-800">
              Expense Analytics & Breakdown
            </h4>
          </div>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="text-xs font-semibold text-ink-500 hover:text-ink-800"
          >
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
        </div>

        {showCharts && (
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Subcategory Bar Chart */}
            <div className="lg:col-span-8">
              <p className="mb-2 text-xs font-semibold text-ink-500">
                Category-wise Spending (in ₹)
              </p>
              {subcategoryChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subcategoryChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={130}
                      />
                      <Tooltip
                        formatter={(val: any) => [
                          `₹${Number(val || 0).toLocaleString('en-IN')}`,
                          'Amount',
                        ]}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {subcategoryChartData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-xs text-ink-400">
                  No expenses recorded in this period
                </div>
              )}
            </div>

            {/* Ratio Donut Chart: Cow vs Dairy Ops */}
            <div className="flex flex-col items-center justify-center lg:col-span-4 lg:border-l lg:border-ink-100 lg:pl-6">
              <p className="mb-2 text-center text-xs font-semibold text-ink-500">
                Cow Expenses vs Dairy Operations
              </p>
              {ratioPieData.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ratioPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {ratioPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [
                          `₹${Number(val || 0).toLocaleString('en-IN')}`,
                          'Amount',
                        ]}
                      />
                      <Legend verticalAlign="bottom" height={36} iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-xs text-ink-400">
                  No data available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
