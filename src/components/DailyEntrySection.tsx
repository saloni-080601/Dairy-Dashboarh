import React, { useState, useEffect } from 'react';
import { useDairy } from '../context/DairyContext';
import { MilkSession, MilkEntry, MilkType } from '../types/dairy';
import { calculateAmount } from '../lib/calculations';
import { lookupRateFromChart, calculateChartSNF } from '../lib/rateChartData';
import {
  Sun,
  Moon,
  Save,
  CheckCircle,
  TrendingUp,
  Droplets,
  Percent,
  Gauge,
  Trash2,
  Table,
  Check
} from 'lucide-react';

interface SessionCardProps {
  session: MilkSession;
  existingEntry?: MilkEntry;
  date: string;
  onOpenRateChart: () => void;
}

const SessionEntryCard: React.FC<SessionCardProps> = ({ session, existingEntry, date, onOpenRateChart }) => {
  const { addOrUpdateEntry, removeEntry } = useDairy();

  const isMorning = session === 'morning';

  const [fat, setFat] = useState<string>('');
  const [clr, setClr] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [milkType, setMilkType] = useState<MilkType>('auto');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);

  // Sync inputs whenever existingEntry or selected date changes
  useEffect(() => {
    if (existingEntry) {
      setFat(existingEntry.fat.toString());
      setClr(existingEntry.clr.toString());
      setQuantity(existingEntry.quantity.toString());
      setMilkType(existingEntry.milk_type || 'auto');
      setNotes(existingEntry.notes || '');
    } else {
      setFat('');
      setClr('');
      setQuantity('');
      setMilkType('auto');
      setNotes('');
    }
  }, [existingEntry, date]);

  // Live real-time calculations from user's exact Rate Chart
  const numFat = parseFloat(fat) || 0;
  const numClr = parseFloat(clr) || 0;
  const numQty = parseFloat(quantity) || 0;

  // Rate chart lookup
  const chartLookup = lookupRateFromChart(numFat, numClr, milkType);
  const liveSnf = calculateChartSNF(numFat, numClr);
  const liveRate = chartLookup.rate;
  const liveAmount = calculateAmount(numQty, liveRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numFat <= 0 || numClr <= 0 || numQty <= 0) {
      alert('Kripya valid Fat, CLR aur Quantity darj karein.');
      return;
    }

    setIsSaving(true);
    const success = await addOrUpdateEntry({
      entry_date: date,
      session,
      fat: numFat,
      clr: numClr,
      quantity: numQty,
      milk_type: chartLookup.milkType,
      notes: notes.trim(),
    });
    setIsSaving(false);

    if (success) {
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2500);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry) return;
    if (confirm(`Kya aap ${date} ki ${session} entry delete karna chahte hain?`)) {
      await removeEntry(existingEntry.id);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        isMorning
          ? 'bg-gradient-to-b from-amber-50/40 via-white to-white border-amber-200/90'
          : 'bg-gradient-to-b from-blue-50/40 via-white to-white border-blue-200/90'
      }`}
    >
      {/* Session Card Header */}
      <div
        className={`px-5 py-3.5 border-b flex items-center justify-between ${
          isMorning
            ? 'bg-amber-100/60 border-amber-200 text-amber-900'
            : 'bg-blue-100/60 border-blue-200 text-blue-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg ${
              isMorning ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isMorning ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight capitalize">
              {session} Collection
            </h3>
            <p className="text-[11px] opacity-75">
              {isMorning ? 'Morning Session (AM)' : 'Evening Session (PM)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {existingEntry ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle className="h-3 w-3 text-emerald-600" />
              Recorded
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-500 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200">
              Pending
            </span>
          )}

          {existingEntry && (
            <button
              onClick={handleDelete}
              title="Delete this entry"
              type="button"
              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">

        {/* Milk Type Selection (Gaay / Bhains) */}
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-700">Doodh Ka Prakaar:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMilkType('auto')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                milkType === 'auto'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Auto Detect
            </button>

            <button
              type="button"
              onClick={() => setMilkType('cow')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                milkType === 'cow'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              🐄 Gaay (3.2-5.5)
            </button>

            <button
              type="button"
              onClick={() => setMilkType('buffalo')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                milkType === 'buffalo'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              🐃 Bhains (8.0-10.0)
            </button>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Fat Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Percent className="h-3 w-3 text-slate-500" />
              Fat (1 Decimal)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="15.0"
                placeholder="Jaise 4.8 ya 8.5"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:font-normal placeholder:text-slate-400 font-mono"
              />
              <span className="absolute right-2.5 top-2.5 text-xs font-medium text-slate-400">
                %
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">Gaay 3.2-5.5 | Bhains 8.0-10.0</p>
          </div>

          {/* CLR Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Gauge className="h-3 w-3 text-slate-500" />
              CLR (Poora Number)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="20"
                max="35"
                placeholder="25 se 30"
                value={clr}
                onChange={(e) => setClr(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:font-normal placeholder:text-slate-400 font-mono"
              />
              <span className="absolute right-2.5 top-2.5 text-xs font-medium text-slate-400">
                CLR
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">Standard range: 25 - 30</p>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Droplets className="h-3 w-3 text-slate-500" />
              Quantity (Litres)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 25.0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:font-normal placeholder:text-slate-400 font-mono"
              />
              <span className="absolute right-2.5 top-2.5 text-xs font-medium text-slate-400">
                Ltr
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">Total litres</p>
          </div>

        </div>

        {/* Live Automatic Calculations Display Box */}
        <div
          className={`p-3.5 rounded-xl border ${
            isMorning
              ? 'bg-amber-50/70 border-amber-200/70'
              : 'bg-blue-50/70 border-blue-200/70'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Rate Chart Se Calculation
            </span>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                chartLookup.milkType === 'cow'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}>
                {chartLookup.milkType === 'cow' ? '🐄 Gaay Rate' : '🐃 Bhains Rate'}
              </span>

              <button
                type="button"
                onClick={onOpenRateChart}
                className="text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-sky-200 transition-colors"
                title="View full chart matrix"
              >
                <Table className="h-3 w-3" />
                <span>Chart Dekhein</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Calculated SNF */}
            <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-500 block">Calculated SNF</span>
              <span className="text-sm font-bold text-slate-800">
                {numFat > 0 && numClr > 0 ? `${liveSnf}%` : '--'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">CLR/4 + 0.2×Fat + 0.7</span>
            </div>

            {/* Calculated Rate / Ltr */}
            <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-500 block">Rate / Litre</span>
              <span
                className={`text-base font-extrabold ${
                  isMorning ? 'text-amber-700' : 'text-blue-700'
                }`}
              >
                {liveRate > 0 ? `₹${liveRate.toFixed(2)}` : '--'}
              </span>
              <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">
                {chartLookup.matchedInChart ? '✓ Chart Matched' : (chartLookup.notes || 'Auto Calculated')}
              </span>
            </div>

            {/* Calculated Amount */}
            <div className="bg-white/90 p-2 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-500 block">Session Amount</span>
              <span className="text-base font-black text-emerald-700">
                {liveAmount > 0 ? `₹${liveAmount.toLocaleString('en-IN')}` : '--'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Qty × Rate</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          {showSavedFeedback ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-pulse">
              <Check className="h-4 w-4" />
              {session} entry safalta se save ho gayi!
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {existingEntry ? 'Values badalkar update karein' : 'Fat & CLR dalein, rate apne aap aayega'}
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-all ${
              isMorning
                ? 'bg-amber-600 hover:bg-amber-700 active:scale-98 shadow-amber-600/30'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-blue-600/30'
            } disabled:opacity-50`}
          >
            <Save className="h-3.5 w-3.5" />
            <span>
              {isSaving
                ? 'Saving...'
                : existingEntry
                ? `Update ${session}`
                : `Save ${session}`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const DailyEntrySection: React.FC<{ onOpenRateChart: () => void }> = ({ onOpenRateChart }) => {
  const { selectedDate, selectedDayRecord } = useDairy();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Daily Milk Collection Entry</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              {selectedDate}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Gaay aur Bhains Rate Chart ke anusaar Fat aur CLR daal kar Rate aur Amount calculate karein.
          </p>
        </div>

        <button
          onClick={onOpenRateChart}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-bold rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 transition-colors shadow-2xs"
        >
          <Table className="h-3.5 w-3.5 text-sky-600" />
          <span>Full Rate Chart Dekhein / Edit Karein</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SessionEntryCard
          session="morning"
          existingEntry={selectedDayRecord?.morning}
          date={selectedDate}
          onOpenRateChart={onOpenRateChart}
        />
        <SessionEntryCard
          session="evening"
          existingEntry={selectedDayRecord?.evening}
          date={selectedDate}
          onOpenRateChart={onOpenRateChart}
        />
      </div>
    </div>
  );
};
