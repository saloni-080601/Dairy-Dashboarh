import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import {
  Calendar,
  CalendarRange,
  Plus,
  Trash2,
  Sun,
  Moon,
  Droplets,
  CheckCircle2,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { useDairy } from '../context/DairyContext';
import {
  createCowProfile,
  CowMilkRecord as ApiCowMilkRecord,
  fetchCowCollection,
  saveCowMilkRecord as saveCowMilkRecordApi,
  getSupabaseClient,
} from '../lib/supabase';
import { COW_GROUPS, COW_GROUP_DAYS } from '../lib/cowGroupData';

interface CowProfile {
  id: string;
  name: string;
}

interface CowMilkRecord extends Omit<ApiCowMilkRecord, 'cow_id'> {
  id: string;
  cowId: string;
}

function localDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

const litres = (value: number | null | undefined) => (value == null ? '—' : `${value.toFixed(1)} L`);

const STORAGE_KEY_COWS = 'dairy_cows_list';
const STORAGE_KEY_COW_RECORDS = 'dairy_cow_records';

export const CowGroupRecords: React.FC = () => {
  const { dailyRecords, rateSettings } = useDairy();
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');

  // All-months total average rate per litre calculated from milk records
  const overallAvgRate = useMemo(() => {
    let totalLitres = 0;
    let totalAmount = 0;
    for (const r of dailyRecords) {
      totalLitres += r.totalQuantity || 0;
      totalAmount += r.totalAmount || 0;
    }
    if (totalLitres > 0) {
      return Number((totalAmount / totalLitres).toFixed(2));
    }
    return rateSettings.standard_rate || 40.0;
  }, [dailyRecords, rateSettings]);

  // Month filter for History Tab
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Selected date for Daily Collection & Entry Tab
  const [selectedDayDate, setSelectedDayDate] = useState<string>(localDate);

  // Cow states
  const [cows, setCows] = useState<CowProfile[]>([]);
  const [selectedCow, setSelectedCow] = useState<string>('');
  const [cowName, setCowName] = useState('');
  const [cowRecords, setCowRecords] = useState<CowMilkRecord[]>([]);

  // Form states
  const [entryCowId, setEntryCowId] = useState('');
  const [entrySession, setEntrySession] = useState<'morning' | 'evening'>('morning');
  const [quantity, setQuantity] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showAddCow, setShowAddCow] = useState(false);

  // Load cows & records (Supabase with localStorage & default fallback)
  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      const result = await fetchCowCollection();
      if (!isActive) return;
      if (result.error) {
        setLoadError(result.error);
      } else {
        setLoadError('');
      }

      let loadedCows: CowProfile[] = [];
      let loadedRecords: CowMilkRecord[] = [];

      if (!result.error && result.cows.length > 0) {
        loadedCows = result.cows;
        loadedRecords = result.records.map(record => ({
          id: record.id,
          cowId: record.cow_id,
          date: record.date,
          session: record.session,
          quantity: record.quantity,
        }));
        localStorage.setItem(STORAGE_KEY_COWS, JSON.stringify(loadedCows));
        localStorage.setItem(STORAGE_KEY_COW_RECORDS, JSON.stringify(loadedRecords));
      } else {
        // Fallback to localStorage
        const savedCows = localStorage.getItem(STORAGE_KEY_COWS);
        const savedRecords = localStorage.getItem(STORAGE_KEY_COW_RECORDS);
        if (savedCows) {
          try { loadedCows = JSON.parse(savedCows); } catch { loadedCows = []; }
        }
        if (savedRecords) {
          try { loadedRecords = JSON.parse(savedRecords); } catch { loadedRecords = []; }
        }

        // Default seed from cowGroupData if still empty
        if (loadedCows.length === 0) {
          loadedCows = COW_GROUPS.map(name => ({ id: `sheet-${name}`, name }));
          localStorage.setItem(STORAGE_KEY_COWS, JSON.stringify(loadedCows));
        }

        if (loadedRecords.length === 0) {
          const seeded: CowMilkRecord[] = [];
          for (const d of COW_GROUP_DAYS) {
            for (const [groupName, vals] of Object.entries(d.groups)) {
              const cow = loadedCows.find(c => c.name === groupName);
              if (!cow) continue;
              if (vals.morning != null) {
                seeded.push({
                  id: `seed-${cow.id}-${d.date}-m`,
                  cowId: cow.id,
                  date: d.date,
                  session: 'morning',
                  quantity: vals.morning,
                });
              }
              if (vals.evening != null) {
                seeded.push({
                  id: `seed-${cow.id}-${d.date}-e`,
                  cowId: cow.id,
                  date: d.date,
                  session: 'evening',
                  quantity: vals.evening,
                });
              }
            }
          }
          loadedRecords = seeded;
          localStorage.setItem(STORAGE_KEY_COW_RECORDS, JSON.stringify(loadedRecords));
        }
      }

      setCows(loadedCows);
      setCowRecords(loadedRecords);
      if (loadedCows.length > 0) {
        setSelectedCow(current => (loadedCows.some(c => c.name === current) ? current : loadedCows[0].name));
        setEntryCowId(current => (loadedCows.some(c => c.id === current) ? current : loadedCows[0].id));
      }
      setIsLoading(false);
    };

    void load();
    return () => { isActive = false; };
  }, []);

  // -------------------------------------------------------------
  // TAB 1: Daily Collection Calculations (All cows on selected day)
  // -------------------------------------------------------------
  const dailyCowCollection = useMemo(() => {
    return cows.map(cow => {
      const morningRec = cowRecords.find(
        r => r.cowId === cow.id && r.date === selectedDayDate && r.session === 'morning'
      );
      const eveningRec = cowRecords.find(
        r => r.cowId === cow.id && r.date === selectedDayDate && r.session === 'evening'
      );
      const morningQty = morningRec ? morningRec.quantity : null;
      const eveningQty = eveningRec ? eveningRec.quantity : null;
      const totalQty = (morningQty ?? 0) + (eveningQty ?? 0);
      const hasMorning = morningQty !== null;
      const hasEvening = eveningQty !== null;

      let status: 'full' | 'morning_only' | 'evening_only' | 'pending' = 'pending';
      if (hasMorning && hasEvening) status = 'full';
      else if (hasMorning) status = 'morning_only';
      else if (hasEvening) status = 'evening_only';

      return {
        cow,
        morningQty,
        eveningQty,
        totalQty,
        hasMorning,
        hasEvening,
        status,
      };
    });
  }, [cows, cowRecords, selectedDayDate]);

  const dailyTotals = useMemo(() => {
    let morningTotal = 0;
    let eveningTotal = 0;
    let milkedCowsCount = 0;

    for (const item of dailyCowCollection) {
      if (item.morningQty !== null) morningTotal += item.morningQty;
      if (item.eveningQty !== null) eveningTotal += item.eveningQty;
      if (item.hasMorning || item.hasEvening) milkedCowsCount++;
    }

    return {
      morningTotal: Number(morningTotal.toFixed(1)),
      eveningTotal: Number(eveningTotal.toFixed(1)),
      dayTotal: Number((morningTotal + eveningTotal).toFixed(1)),
      milkedCowsCount,
      totalCowsCount: cows.length,
    };
  }, [dailyCowCollection, cows.length]);

  // -------------------------------------------------------------
  // TAB 2: History & Month Calculations
  // -------------------------------------------------------------
  const historyRows = useMemo(() => {
    const cowNameById = new Map(cows.map(cow => [cow.id, cow.name]));
    const entriesByDate = new Map<string, Map<string, { morning?: number; evening?: number }>>();

    cowRecords
      .filter(record => record.date.startsWith(month))
      .forEach(record => {
        const cName = cowNameById.get(record.cowId) || record.cowId.replace('sheet-', '');
        if (!cName) return;
        if (!entriesByDate.has(record.date)) entriesByDate.set(record.date, new Map());
        const cowsForDate = entriesByDate.get(record.date)!;
        if (!cowsForDate.has(cName)) cowsForDate.set(cName, {});
        cowsForDate.get(cName)![record.session] = record.quantity;
      });

    const dates = new Set(entriesByDate.keys());
    return [...dates]
      .sort((a, b) => b.localeCompare(a))
      .map(date => {
        const manual = entriesByDate.get(date);
        const selectedManual = manual?.get(selectedCow);
        const morning = selectedManual?.morning ?? null;
        const evening = selectedManual?.evening ?? null;
        let allMorning = 0;
        let allEvening = 0;
        manual?.forEach(sessions => {
          allMorning += sessions.morning ?? 0;
          allEvening += sessions.evening ?? 0;
        });
        return {
          date,
          morning,
          evening,
          cowTotal: (morning ?? 0) + (evening ?? 0),
          allMorning,
          allEvening,
          dayTotal: allMorning + allEvening,
        };
      });
  }, [month, cowRecords, cows, selectedCow]);

  const monthTotals = useMemo(
    () =>
      historyRows.reduce(
        (sum, row) => ({
          morning: sum.morning + (row.morning ?? 0),
          evening: sum.evening + (row.evening ?? 0),
          cowTotal: sum.cowTotal + row.cowTotal,
          allMorning: sum.allMorning + row.allMorning,
          allEvening: sum.allEvening + row.allEvening,
          allTotal: sum.allTotal + row.dayTotal,
        }),
        { morning: 0, evening: 0, cowTotal: 0, allMorning: 0, allEvening: 0, allTotal: 0 }
      ),
    [historyRows]
  );

  // Lifetime stats for the currently selected cow (from beginning to now)
  const cowLifetimeStats = useMemo(() => {
    const targetCow = cows.find(c => c.name === selectedCow);
    if (!targetCow) {
      return {
        morningTotal: 0,
        eveningTotal: 0,
        grandTotal: 0,
        milkingDaysCount: 0,
        avgDaily: 0,
        firstMilkingDate: null as string | null,
        lastMilkingDate: null as string | null,
      };
    }

    const recordsForCow = cowRecords.filter(r => r.cowId === targetCow.id);
    let mSum = 0;
    let eSum = 0;
    const daysSet = new Set<string>();

    for (const r of recordsForCow) {
      if (r.session === 'morning') mSum += r.quantity;
      if (r.session === 'evening') eSum += r.quantity;
      daysSet.add(r.date);
    }

    const grandTotal = mSum + eSum;
    const milkingDaysCount = daysSet.size;
    const avgDaily = milkingDaysCount > 0 ? Number((grandTotal / milkingDaysCount).toFixed(1)) : 0;
    const sortedDates = [...daysSet].sort();
    const firstMilkingDate = sortedDates[0] ?? null;
    const lastMilkingDate = sortedDates[sortedDates.length - 1] ?? null;

    return {
      morningTotal: Number(mSum.toFixed(1)),
      eveningTotal: Number(eSum.toFixed(1)),
      grandTotal: Number(grandTotal.toFixed(1)),
      milkingDaysCount,
      avgDaily,
      firstMilkingDate,
      lastMilkingDate,
    };
  }, [cows, cowRecords, selectedCow]);
 
  // Revenue calculations based on overall average rate per litre
  const cowRevenue = useMemo(() => {
    return Number((cowLifetimeStats.grandTotal * overallAvgRate).toFixed(2));
  }, [cowLifetimeStats.grandTotal, overallAvgRate]);

  const cowDailyRevenue = useMemo(() => {
    return Number((cowLifetimeStats.avgDaily * overallAvgRate).toFixed(2));
  }, [cowLifetimeStats.avgDaily, overallAvgRate]);

  // -------------------------------------------------------------
  // Actions: Save Cow, Save Milk Record, Delete Record
  // -------------------------------------------------------------
  const saveCow = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = cowName.trim().toUpperCase();
    if (!name) return;
    if (cows.some(cow => cow.name.toLowerCase() === name.toLowerCase())) {
      setFormMessage('Ye cow pehle se added hai.');
      return;
    }
    setIsSaving(true);
    const result = await createCowProfile(name);
    setIsSaving(false);

    const newCow: CowProfile = result.cow ?? { id: `local-cow-${Date.now()}`, name };
    const updatedCows = [...cows, newCow];
    setCows(updatedCows);
    localStorage.setItem(STORAGE_KEY_COWS, JSON.stringify(updatedCows));

    setEntryCowId(newCow.id);
    setSelectedCow(newCow.name);
    setCowName('');
    setShowAddCow(false);
    setFormMessage(`${newCow.name} successfully add ho gayi.`);
  };

  const saveCowMilk = async (event: React.FormEvent) => {
    event.preventDefault();
    const milkQuantity = Number(quantity);
    if (!Number.isFinite(milkQuantity) || milkQuantity <= 0) {
      setFormMessage('Milk quantity 0 se zyada enter karein.');
      return;
    }

    const targetCow = cows.find(cow => cow.id === entryCowId);
    if (!targetCow) {
      setFormMessage('Pehle cow select karein.');
      return;
    }

    setIsSaving(true);
    const result = await saveCowMilkRecordApi({
      cow_id: entryCowId,
      date: selectedDayDate,
      session: entrySession,
      quantity: milkQuantity,
    });
    setIsSaving(false);

    const saved: CowMilkRecord = result.record
      ? {
          id: result.record.id,
          cowId: result.record.cow_id,
          date: result.record.date,
          session: result.record.session,
          quantity: result.record.quantity,
        }
      : {
          id: `local-rec-${targetCow.id}-${selectedDayDate}-${entrySession}`,
          cowId: targetCow.id,
          date: selectedDayDate,
          session: entrySession,
          quantity: milkQuantity,
        };

    setCowRecords(current => {
      const filtered = current.filter(
        record => !(record.cowId === saved.cowId && record.date === saved.date && record.session === saved.session)
      );
      const updated = [saved, ...filtered];
      localStorage.setItem(STORAGE_KEY_COW_RECORDS, JSON.stringify(updated));
      return updated;
    });

    setSelectedCow(targetCow.name);
    setQuantity('');
    setFormMessage(`${targetCow.name} ka ${entrySession} milk (${milkQuantity} L) save ho gaya.`);
  };

  const handleQuickAddSession = (cow: CowProfile, session: 'morning' | 'evening', existingQty?: number | null) => {
    setEntryCowId(cow.id);
    setSelectedCow(cow.name);
    setEntrySession(session);
    setQuantity(existingQty ? String(existingQty) : '');
    // Scroll smoothly to form if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = async (cowId: string, date: string, session: 'morning' | 'evening') => {
    if (!window.confirm(`Kya aap ye ${session} record delete karna chahte hain?`)) return;

    setCowRecords(current => {
      const updated = current.filter(
        r => !(r.cowId === cowId && r.date === date && r.session === session)
      );
      localStorage.setItem(STORAGE_KEY_COW_RECORDS, JSON.stringify(updated));
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      await client.from('cow_milk_records').delete().match({ cow_id: cowId, date, session });
    }
    setFormMessage('Record delete ho gaya.');
  };

  const handlePrevDay = () => {
    try {
      const parsed = parseISO(selectedDayDate);
      setSelectedDayDate(format(subDays(parsed, 1), 'yyyy-MM-dd'));
    } catch {
      // Fallback
    }
  };

  const handleNextDay = () => {
    try {
      const parsed = parseISO(selectedDayDate);
      setSelectedDayDate(format(addDays(parsed, 1), 'yyyy-MM-dd'));
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-xl bg-ink-100 p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
            activeTab === 'daily'
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-600 hover:text-ink-900 hover:bg-white/50'
          }`}
        >
          <Calendar className="h-4 w-4 text-forest-800" />
          <span>Daily Collection &amp; Entry</span>
          <span className="hidden rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800 sm:inline">
            Form &amp; All Cows
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
            activeTab === 'history'
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-600 hover:text-ink-900 hover:bg-white/50'
          }`}
        >
          <CalendarRange className="h-4 w-4 text-forest-800" />
          <span>Cow Collection History &amp; Totals</span>
          <span className="hidden rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold text-ink-700 sm:inline">
            Monthly
          </span>
        </button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          Supabase sync note: {loadError}. Local cache mode active hai, aapka data browser me safely save rahega.
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DAILY COLLECTION & ENTRY (Entry Form + All Cows Daily Collection) */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Top Form Panel */}
          <div className="panel overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-ink-100 bg-forest-800 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-200">
                  Daily Logging
                </p>
                <h3 className="mt-0.5 text-base font-semibold tracking-tight text-white">
                  Cow Milk Entry Form
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-forest-100">
                  {cows.length} Cows registered
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddCow(!showAddCow)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-forest-900 transition hover:bg-forest-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddCow ? 'Close' : 'Add Cow'}</span>
                </button>
              </div>
            </div>

            {/* Quick Register Cow Drawer */}
            {showAddCow && (
              <div className="border-b border-ink-200 bg-forest-50/50 p-4">
                <div className="mx-auto max-w-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-forest-900">
                      Register new cow (e.g. G9, G10, Ganga)
                    </span>
                    <span className="text-[11px] text-ink-500">Auto-saved to list</span>
                  </div>
                  <form onSubmit={saveCow} className="flex gap-2">
                    <input
                      required
                      value={cowName}
                      onChange={e => setCowName(e.target.value)}
                      placeholder="Cow ID / Name (e.g. G9)"
                      className="field-input py-2 text-sm flex-1 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || isSaving}
                      className="btn-primary py-2 text-xs font-semibold shrink-0"
                    >
                      <Plus className="h-4 w-4" /> Save Cow
                    </button>
                  </form>
                </div>
              </div>
            )}

            <div className="p-5">
              <form onSubmit={saveCowMilk} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                  {/* Date Input */}
                  <div>
                    <label className="field-label flex items-center justify-between">
                      <span>Collection Date</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDayDate(localDate())}
                        className="text-[10px] font-semibold text-forest-700 hover:underline"
                      >
                        Today
                      </button>
                    </label>
                    <input
                      required
                      type="date"
                      value={selectedDayDate}
                      onChange={e => setSelectedDayDate(e.target.value)}
                      className="field-input font-sans text-xs"
                    />
                  </div>

                  {/* Cow Select */}
                  <div>
                    <label className="field-label">Select Cow</label>
                    <select
                      required
                      value={entryCowId}
                      onChange={e => {
                        setEntryCowId(e.target.value);
                        const c = cows.find(item => item.id === e.target.value);
                        if (c) setSelectedCow(c.name);
                      }}
                      className="field-input font-sans text-xs font-semibold"
                    >
                      <option value="">Select cow</option>
                      {cows.map(cow => (
                        <option key={cow.id} value={cow.id}>
                          {cow.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Session Toggle */}
                  <div>
                    <label className="field-label">Session</label>
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-100 p-1">
                      <button
                        type="button"
                        onClick={() => setEntrySession('morning')}
                        className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                          entrySession === 'morning'
                            ? 'bg-white text-ink-900 shadow-xs'
                            : 'text-ink-600 hover:text-ink-900'
                        }`}
                      >
                        <Sun className="h-3.5 w-3.5 text-amber-500" /> Morning
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntrySession('evening')}
                        className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                          entrySession === 'evening'
                            ? 'bg-white text-ink-900 shadow-xs'
                            : 'text-ink-600 hover:text-ink-900'
                        }`}
                      >
                        <Moon className="h-3.5 w-3.5 text-indigo-500" /> Evening
                      </button>
                    </div>
                  </div>

                  {/* Milk Quantity Input */}
                  <div>
                    <label className="field-label">Milk Quantity (L)</label>
                    <div className="relative">
                      <input
                        required
                        min="0.1"
                        step="0.1"
                        type="number"
                        inputMode="decimal"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        placeholder="e.g. 5.5"
                        className="field-input pr-9 font-mono text-base font-semibold"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400">
                        L
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Cow Select Pills */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      Quick select cow
                    </span>
                    <span className="text-[10px] text-ink-400">Tap to select cow for entry</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cows.map(cow => {
                      const isSelected = entryCowId === cow.id;
                      return (
                        <button
                          key={cow.id}
                          type="button"
                          onClick={() => {
                            setEntryCowId(cow.id);
                            setSelectedCow(cow.name);
                          }}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                            isSelected
                              ? 'bg-forest-800 text-white shadow-xs'
                              : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                          }`}
                        >
                          {cow.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button & feedback */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-ink-100">
                  <div className="text-xs">
                    {formMessage ? (
                      <span
                        className={`font-semibold ${
                          formMessage.includes('nahi') || formMessage.includes('error')
                            ? 'text-red-600'
                            : 'text-forest-800'
                        }`}
                      >
                        {formMessage}
                      </span>
                    ) : (
                      <span className="text-ink-400">
                        Entry will be recorded for {selectedDayDate} ({entrySession}).
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!cows.length || isLoading || isSaving}
                    className="btn-primary min-h-10 px-6 font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isSaving ? 'Saving…' : 'Save Milk Record'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DAILY COLLECTION TABLE: ALL COWS TOGETHER (G1, G2, G3...) */}
          {/* ========================================================= */}
          <div className="panel overflow-hidden">
            {/* Header with Date Navigation */}
            <div className="flex flex-col gap-3 border-b border-ink-100 bg-ink-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-forest-800" />
                  <h3 className="text-sm font-semibold tracking-tight text-ink-900 sm:text-base">
                    Daily Cow Collection (All Cows Together)
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">
                  {format(parseISO(selectedDayDate), 'EEEE, dd MMMM yyyy')} · G1, G2, G3... all cows summary
                </p>
              </div>

              {/* Day Navigation Controls */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="inline-flex items-center justify-center rounded-lg border border-ink-200 bg-white p-1.5 text-ink-700 hover:bg-ink-100 transition"
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <input
                  type="date"
                  value={selectedDayDate}
                  onChange={e => setSelectedDayDate(e.target.value)}
                  className="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-800 outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                />

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="inline-flex items-center justify-center rounded-lg border border-ink-200 bg-white p-1.5 text-ink-700 hover:bg-ink-100 transition"
                  title="Next Day"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDayDate(localDate())}
                  className="rounded-lg border border-forest-600 bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-800 hover:bg-forest-100 transition"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Daily Summary Metric Cards */}
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
              <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                  <Sun className="h-3.5 w-3.5" /> Morning Total
                </span>
                <p className="mt-2 font-mono text-2xl font-bold text-ink-900">
                  {litres(dailyTotals.morningTotal)}
                </p>
                <p className="mt-1 text-[11px] text-ink-500">All cows AM collection</p>
              </div>

              <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-700">
                  <Moon className="h-3.5 w-3.5" /> Evening Total
                </span>
                <p className="mt-2 font-mono text-2xl font-bold text-ink-900">
                  {litres(dailyTotals.eveningTotal)}
                </p>
                <p className="mt-1 text-[11px] text-ink-500">All cows PM collection</p>
              </div>

              <div className="rounded-lg bg-forest-800 p-3.5 text-white shadow-xs">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-forest-200">
                  <Sparkles className="h-3.5 w-3.5 text-forest-300" /> Day Grand Total
                </span>
                <p className="mt-2 font-mono text-2xl font-bold text-white">
                  {litres(dailyTotals.dayTotal)}
                </p>
                <p className="mt-1 text-[11px] text-forest-200">Morning + Evening sum</p>
              </div>

              <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
                  <Users className="h-3.5 w-3.5" /> Cows Milked
                </span>
                <p className="mt-2 font-mono text-2xl font-bold text-ink-900">
                  {dailyTotals.milkedCowsCount} <span className="text-xs text-ink-400 font-normal">/ {dailyTotals.totalCowsCount}</span>
                </p>
                <p className="mt-1 text-[11px] text-ink-500">Active cows on this date</p>
              </div>
            </div>

            {/* Daily Collection Table */}
            <div className="overflow-x-auto">
              <table className="data-table min-w-[720px] text-xs">
                <thead>
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th>Cow / Group</th>
                    <th>Morning Milk (L)</th>
                    <th>Evening Milk (L)</th>
                    <th className="font-bold text-forest-800">Day Total (L)</th>
                    <th>Status</th>
                    <th className="text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyCowCollection.map((row, index) => {
                    return (
                      <tr key={row.cow.id} className="hover:bg-ink-50/70 transition">
                        <td className="text-center font-mono text-ink-400">{index + 1}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-forest-100/70 px-2 py-0.5 font-bold text-forest-900 font-mono text-xs">
                              {row.cow.name}
                            </span>
                          </div>
                        </td>

                        {/* Morning */}
                        <td>
                          {row.morningQty !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-semibold text-ink-900">
                                {litres(row.morningQty)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(row.cow.id, selectedDayDate, 'morning')}
                                className="text-ink-300 hover:text-red-600 transition"
                                title="Delete morning record"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickAddSession(row.cow, 'morning')}
                              className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition"
                            >
                              <Plus className="h-3 w-3" /> Add AM
                            </button>
                          )}
                        </td>

                        {/* Evening */}
                        <td>
                          {row.eveningQty !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-semibold text-ink-900">
                                {litres(row.eveningQty)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(row.cow.id, selectedDayDate, 'evening')}
                                className="text-ink-300 hover:text-red-600 transition"
                                title="Delete evening record"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickAddSession(row.cow, 'evening')}
                              className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                            >
                              <Plus className="h-3 w-3" /> Add PM
                            </button>
                          )}
                        </td>

                        {/* Total for this cow */}
                        <td>
                          <span
                            className={`font-mono text-sm font-bold ${
                              row.totalQty > 0 ? 'text-forest-800' : 'text-ink-300'
                            }`}
                          >
                            {row.totalQty > 0 ? litres(row.totalQty) : '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          {row.status === 'full' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-800">
                              <CheckCircle2 className="h-3 w-3" /> Both Milked
                            </span>
                          )}
                          {row.status === 'morning_only' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                              <Clock className="h-3 w-3" /> AM Only
                            </span>
                          )}
                          {row.status === 'evening_only' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                              <Clock className="h-3 w-3" /> PM Only
                            </span>
                          )}
                          {row.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEntryCowId(row.cow.id);
                              setSelectedCow(row.cow.name);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs font-semibold text-forest-700 hover:text-forest-900 transition"
                          >
                            Enter Milk
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {dailyCowCollection.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-ink-400">
                        Koi cow add nahi hui hai. Upar Add Cow par click karein.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Day Total Footer */}
                {dailyCowCollection.length > 0 && (
                  <tfoot className="border-t-2 border-ink-200 bg-ink-50/90 font-bold text-ink-900">
                    <tr>
                      <td colSpan={2} className="uppercase tracking-wider text-ink-700">
                        All Cows Day Total
                      </td>
                      <td className="font-mono text-sm text-amber-900">
                        {litres(dailyTotals.morningTotal)}
                      </td>
                      <td className="font-mono text-sm text-indigo-900">
                        {litres(dailyTotals.eveningTotal)}
                      </td>
                      <td className="font-mono text-base text-forest-800 font-extrabold">
                        {litres(dailyTotals.dayTotal)}
                      </td>
                      <td colSpan={2} className="text-right text-[11px] font-normal text-ink-500">
                        {dailyTotals.milkedCowsCount} of {dailyTotals.totalCowsCount} cows recorded
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COW COLLECTION HISTORY & TOTALS (Month Report & Historical Data)   */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Controls & Lifetime Stats for Selected Cow */}
          <div className="panel p-5">
            <div className="flex flex-col gap-2 border-b border-ink-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                    Cow Lifetime Performance &amp; Revenue
                  </p>
                  <h3 className="text-base font-semibold tracking-tight text-ink-900">
                    {selectedCow} Collection &amp; Revenue Totals (Starting Se Ab Tak)
                  </h3>
                </div>
                <div className="self-start sm:self-auto rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-mono font-medium text-ink-700">
                  Milk Avg Rate: <strong className="text-forest-800">₹{overallAvgRate.toFixed(2)} / L</strong>
                </div>
              </div>
              <p className="text-xs text-ink-500">
                All-months milk records ke average rate (₹{overallAvgRate.toFixed(2)}/L) ke aadhar par {selectedCow} ka kul doodh aur revenue:
              </p>
            </div>

            {/* Quick Cow Filter Buttons */}
            <div className="pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  Select Cow / Group
                </span>
                <span className="text-xs font-medium text-forest-800">
                  Currently Viewing: <strong>{selectedCow}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cows.map(cow => {
                  const isSelected = selectedCow === cow.name;
                  return (
                    <button
                      key={cow.id}
                      type="button"
                      onClick={() => setSelectedCow(cow.name)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-forest-800 text-white shadow-xs'
                          : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                      }`}
                    >
                      {cow.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lifetime KPI Metric Cards with Revenue Calculation (Morning & Evening Cards Removed) */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                {/* Card 3: Daily Avg Milk */}
              <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-700">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" /> {selectedCow} Daily Avg Milk
                </span>
                <p className="mt-2 font-mono text-2xl font-bold text-ink-900">
                  {litres(cowLifetimeStats.avgDaily)}
                  <span className="text-xs font-normal text-ink-500">/day</span>
                </p>
                <p className="mt-1 text-[11px] text-ink-500">Average milk per milking day</p>
              </div>
              {/* Card 1: Total Milk */}
              <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-800">
                  <Droplets className="h-3.5 w-3.5" /> {selectedCow} Total Milk
                </span>
                <p className="mt-2 font-mono text-2xl font-bold text-ink-900">
                  {litres(cowLifetimeStats.grandTotal)}
                </p>
                <p className="mt-1 text-[11px] text-ink-500 truncate">
                  {cowLifetimeStats.milkingDaysCount} days milking
                  {cowLifetimeStats.firstMilkingDate
                    ? ` · Since ${format(parseISO(cowLifetimeStats.firstMilkingDate), 'dd-MMM-yyyy')}`
                    : ''}
                </p>
              </div>

              {/* Card 2: Total Revenue per Cow */}
              <div className="rounded-lg bg-forest-800 p-3.5 text-white shadow-xs">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-200">
                  <Coins className="h-3.5 w-3.5 text-forest-300" /> {selectedCow} Revenue
                </span>
                <p className="mt-2 font-mono text-2xl font-bold text-white">
                  ₹{cowRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-[11px] text-forest-200 truncate">
                  @ ₹{overallAvgRate.toFixed(2)}/L (Milk record avg rate)
                </p>
              </div>

            

              {/* Card 4: Daily Avg Revenue */}
              <div className="rounded-lg border border-forest-200 bg-forest-50/50 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-800">
                  <TrendingUp className="h-3.5 w-3.5" /> Daily Avg Revenue
                </span>
                <p className="mt-2 font-mono text-2xl font-bold text-forest-900">
                  ₹{cowDailyRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-forest-700">/day</span>
                </p>
                <p className="mt-1 text-[11px] text-forest-700 truncate">
                  Est. daily earning @ ₹{overallAvgRate.toFixed(2)}/L
                </p>
              </div>
            </div>
          </div>

          {/* Date-wise Detailed History Table (Month-wise) */}
          <div className="panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-ink-100 bg-ink-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold tracking-tight text-ink-900 sm:text-base">
                  Day-by-Day Collection History ({selectedCow})
                </h4>
                <p className="mt-0.5 text-xs text-ink-500">
                  Showing daily morning &amp; evening records for {format(parseISO(`${month}-01`), 'MMMM yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-semibold text-ink-600">Select Month:</span>
                <div className="relative">
                  <CalendarRange className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-400" />
                  <input
                    type="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    aria-label="Filter cow records by month"
                    className="rounded-lg border border-ink-200 bg-white py-1.5 pl-8 pr-3 text-xs font-semibold text-ink-800 outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table min-w-[720px] text-xs">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{selectedCow} Morning</th>
                    <th>{selectedCow} Evening</th>
                    <th className="font-bold text-forest-800">{selectedCow} Total</th>
                    <th>All Cows AM</th>
                    <th>All Cows PM</th>
                    <th className="font-bold text-ink-900">Day Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map(day => (
                    <tr key={day.date} className="hover:bg-ink-50/60 transition">
                      <td className="whitespace-nowrap font-medium text-ink-800">
                        {format(parseISO(day.date), 'dd-MMM-yyyy (EEE)')}
                      </td>
                      <td className="font-mono">{litres(day.morning)}</td>
                      <td className="font-mono">{litres(day.evening)}</td>
                      <td className="font-mono font-semibold text-forest-800">
                        {litres(day.cowTotal)}
                      </td>
                      <td className="font-mono text-ink-600">{litres(day.allMorning)}</td>
                      <td className="font-mono text-ink-600">{litres(day.allEvening)}</td>
                      <td className="font-mono font-bold text-ink-900">
                        {litres(day.dayTotal)}
                      </td>
                    </tr>
                  ))}
                  {historyRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                        Is month ke liye koi collection records nahi hain.
                      </td>
                    </tr>
                  )}
                </tbody>
                {historyRows.length > 0 && (
                  <tfoot className="border-t-2 border-ink-200 bg-ink-50/90 font-bold text-ink-900">
                    <tr>
                      <td>Month Total</td>
                      <td className="font-mono">{litres(monthTotals.morning)}</td>
                      <td className="font-mono">{litres(monthTotals.evening)}</td>
                      <td className="font-mono text-forest-800 font-extrabold">{litres(monthTotals.cowTotal)}</td>
                      <td className="font-mono">{litres(monthTotals.allMorning)}</td>
                      <td className="font-mono">{litres(monthTotals.allEvening)}</td>
                      <td className="font-mono text-forest-900 font-extrabold">{litres(monthTotals.allTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
