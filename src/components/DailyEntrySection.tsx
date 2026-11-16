import React, { useState } from 'react';
import { useDairy } from '../context/DairyContext';
import { MilkSession, MilkEntry, MilkType } from '../types/dairy';
import { calculateAmount } from '../lib/calculations';
import { lookupRateFromChart, calculateChartSNF } from '../lib/rateChartData';
import {
  Sun,
  Moon,
  Plus,
  Save,
  Droplets,
  Percent,
  Gauge,
  Trash2,
  Check,
  Edit2,
  X,
  Layers,
  Calendar
} from 'lucide-react';

const formatRupees = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface SessionBlockProps {
  session: MilkSession;
  entries: MilkEntry[];
  date: string;
}

const SessionBlock: React.FC<SessionBlockProps> = ({
  session,
  entries,
  date,
}) => {
  const { addOrUpdateEntry, removeEntry } = useDairy();
  const isMorning = session === 'morning';

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fat, setFat] = useState<string>('');
  const [clr, setClr] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [milkType, setMilkType] = useState<MilkType>('auto');
  const [batchLabel, setBatchLabel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);

  // Live real-time calculations from user's exact Rate Chart
  const numFat = parseFloat(fat) || 0;
  const numClr = parseFloat(clr) || 0;
  const numQty = parseFloat(quantity) || 0;

  // Rate chart lookup (e.g. Fat 4.0 & CLR 26 -> 37.98)
  const chartLookup = lookupRateFromChart(numFat, numClr, milkType);
  const liveRate = chartLookup.rate;
  const liveSnf = calculateChartSNF(numFat, numClr);
  const liveAmount = calculateAmount(numQty, liveRate);

  const resetForm = () => {
    setEditingId(null);
    setFat('');
    setClr('');
    setQuantity('');
    setMilkType('auto');
    setBatchLabel('');
    setNotes('');
  };

  const handleStartEdit = (entry: MilkEntry) => {
    setEditingId(entry.id);
    setFat(entry.fat.toString());
    setClr(entry.clr.toString());
    setQuantity(entry.quantity.toString());
    setMilkType(entry.milk_type || 'auto');
    setBatchLabel(entry.batch_label || '');
    setNotes(entry.notes || '');
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numFat <= 0 || numClr <= 0 || numQty <= 0) {
      alert('Kripya valid Fat, CLR aur Quantity darj karein.');
      return;
    }

    setIsSaving(true);
    const success = await addOrUpdateEntry({
      id: editingId || undefined,
      entry_date: date,
      session,
      fat: numFat,
      clr: numClr,
      quantity: numQty,
      rate_per_liter: liveRate,
      milk_type: chartLookup.milkType,
      batch_label: batchLabel.trim() || `Batch ${entries.length + 1}`,
      notes: notes.trim(),
    });
    setIsSaving(false);

    if (success) {
      resetForm();
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2500);
    }
  };

  const handleDelete = async (entry: MilkEntry, index: number) => {
    if (confirm(`Kya aap ${session} Batch #${index + 1} (${entry.quantity}L) delete karna chahte hain?`)) {
      if (editingId === entry.id) {
        resetForm();
      }
      await removeEntry(entry.id);
    }
  };

  // Subtotals for this session
  const sessionTotalQty = entries.reduce((sum, e) => sum + e.quantity, 0);
  const sessionTotalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const sessionAvgRate = sessionTotalQty > 0 ? sessionTotalAmount / sessionTotalQty : 0;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,.35)] transition-shadow hover:shadow-md ${
        isMorning
          ? 'border-t-4 border-t-amber-400'
          : 'border-t-4 border-t-emerald-700'
      }`}
    >
      {/* Session Card Header */}
      <div
        className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between gap-2 ${
          isMorning
            ? 'bg-amber-50/80 border-slate-100 text-slate-900'
            : 'bg-emerald-50/70 border-slate-100 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-xl ${
              isMorning ? 'bg-amber-500 text-white' : 'bg-emerald-800 text-white'
            }`}
          >
            {isMorning ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight capitalize flex items-center gap-1.5">
              <span>{session} Collection</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/70 border border-current">
                {entries.length} {entries.length === 1 ? 'Dispatch' : 'Dispatches'}
              </span>
            </h3>
            <p className="text-[11px] opacity-75">
              {isMorning ? 'Subah Ka Doodh (Morning AM)' : 'Shaam Ka Doodh (Evening PM)'}
            </p>
          </div>
        </div>

        {sessionTotalQty > 0 && (
          <div className="text-right">
            <span className="text-xs font-black block">
              {sessionTotalQty.toFixed(1)} Ltr
            </span>
            <span className="text-[10px] font-bold opacity-80 block">
              {formatRupees(sessionTotalAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Main Form for Adding or Editing a Batch */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            {editingId ? (
              <>
                <Edit2 className="h-3.5 w-3.5 text-sky-600" />
              <span>Edit Entry</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                <span>Add Milk Entry</span>
              </>
            )}
          </span>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        {/* Milk Type Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-700">Prakaar:</span>
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
              Auto
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
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              🐃 Bhains (8.0-10.0)
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {/* Fat Input */}
          <div className="order-2">
            <label className="mb-1 flex max-w-sm items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1">
                <Percent className="h-3 w-3 text-slate-500" />
                Fat %
              </span>
              <span className="text-[10px] font-normal text-slate-400">e.g. 4.0</span>
            </label>
            <div className="relative w-full max-w-sm sm:max-w-none">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="15.0"
                inputMode="decimal"
               
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-semibold transition-all focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
              <span className="absolute right-2.5 top-2.5 text-xs font-medium text-slate-400">
                %
              </span>
            </div>
          </div>

          {/* CLR Input */}
          <div className="order-3">
            <label className="mb-1 flex max-w-sm items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3 text-slate-500" />
                CLR (Lacto)
              </span>
              <span className="text-[10px] font-normal text-slate-400">25–30</span>
            </label>
            <div className="relative w-full max-w-sm sm:max-w-none">
              <input
                type="number"
                step="1"
                min="20"
                max="35"
                inputMode="numeric"
              
                value={clr}
                onChange={(e) => setClr(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-semibold transition-all focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
              <span className="absolute right-2.5 top-2.5 text-xs font-medium text-slate-400">
                CLR
              </span>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="order-1">
            <label className="mb-1 flex max-w-sm items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3 text-slate-500" />
                Quantity (L)
              </span>
              <span className="text-[10px] font-normal text-slate-400">e.g. 40 L</span>
            </label>
            <div className="relative w-full max-w-sm sm:max-w-none">
              <input
                type="number"
                step="0.1"
                min="0.1"
                inputMode="decimal"
          
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-semibold transition-all focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              />
              <span className="absolute right-2.5 top-2.5 text-xs font-medium text-slate-400">
                Ltr
              </span>
            </div>
          </div>
        </div>

        <div className={`rounded-xl border px-4 py-3 ${isMorning ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <p className={`text-xs font-medium ${isMorning ? 'text-amber-900' : 'text-emerald-900'}`}>
            ₹{liveRate.toFixed(2)} / L × {numQty || 0} L · {chartLookup.milkType === 'cow' ? 'Cow' : 'Buffalo'} · SNF {liveSnf}%
          </p>
          <p className={`mt-0.5 text-3xl font-extrabold tracking-tight ${isMorning ? 'text-amber-950' : 'text-emerald-950'}`}>
            {formatRupees(liveAmount)}
          </p>
        </div>

        {/* Optional Batch Label / Note */}
        {/* <div className="flex gap-2">
          <input
            type="text"
            placeholder="Batch Label (jaise Tanker 1, Gaay #2, Batch A)"
            value={batchLabel}
            onChange={(e) => setBatchLabel(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs transition-all placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
          />
        </div> */}

        {/* Submit Button */}
        <div className="space-y-2 pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all ${
              isMorning
                ? 'bg-amber-600 hover:bg-amber-700 active:scale-98 shadow-amber-600/30'
                : 'bg-emerald-800 hover:bg-emerald-900 active:scale-98 shadow-emerald-800/20'
            } disabled:opacity-50`}
          >
            {editingId ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span>
              {isSaving
                ? 'Saving...'
                : editingId
                ? 'Update Batch'
                : `Save to ${isMorning ? 'Morning' : 'Evening'} · ${formatRupees(liveAmount)}`}
            </span>
          </button>
          {showSavedFeedback && (
            <p className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700" role="status">
              <Check className="h-3.5 w-3.5" /> {session} entry saved
            </p>
          )}
        </div>
      </form>

      {/* Recorded Batches List for this Session */}
      <div className="border-t border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>Recorded Batches ({entries.length})</span>
          </span>
          {sessionTotalQty > 0 && (
            <span className="text-[11px] font-semibold text-slate-600">
              Avg Rate: <strong className="text-slate-900">₹{sessionAvgRate.toFixed(2)}/L</strong>
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-4 bg-white/70 rounded-xl border border-dashed border-slate-300">
            <p className="text-xs text-slate-500">
              Is session ki koi entry nahi hai.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Upar diye form se Fat, CLR aur Quantity daalkar jodein.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border transition-all ${
                  editingId === entry.id
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/15'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {entry.batch_label || `Dispatch #${idx + 1}`}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          entry.milk_type === 'buffalo'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entry.milk_type === 'buffalo' ? '🐃 Bhains' : '🐄 Gaay'}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {entry.quantity} Litres
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>Fat: <strong className="text-slate-800">{entry.fat}%</strong></span>
                      <span>CLR: <strong className="text-slate-800">{entry.clr}</strong></span>
                      <span>SNF: <strong className="text-slate-800">{entry.snf}%</strong></span>
                      <span className="text-emerald-700 font-bold">
                        Rate: ₹{Number(entry.rate_per_liter).toFixed(2)}/L
                      </span>
                    </div>

                    {entry.notes && (
                      <p className="mt-1 text-[11px] text-slate-500 italic">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                    <div className="text-sm font-black text-emerald-800">
                      {formatRupees(entry.amount)}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(entry)}
                        title="Edit this batch"
                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry, idx)}
                        title="Delete this batch"
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const DailyEntrySection: React.FC = () => {
  const { selectedDate, setSelectedDate, selectedDayRecord } = useDairy();
  const [isDateConfirmed, setIsDateConfirmed] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MilkSession | null>(null);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSession(null);
  };

  const sessionOptions = [
    {
      id: 'morning' as const,
      label: 'Morning Collection',
      time: 'AM',
      icon: Sun,
      quantity: selectedDayRecord?.morningQuantity || 0,
      entries: selectedDayRecord?.morningEntries || [],
      theme: 'amber',
    },
    {
      id: 'evening' as const,
      label: 'Evening Collection',
      time: 'PM',
      icon: Moon,
      quantity: selectedDayRecord?.eveningQuantity || 0,
      entries: selectedDayRecord?.eveningEntries || [],
      theme: 'emerald',
    },
  ];

  return (
    <div className="space-y-4">
      {!isDateConfirmed ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-slate-600">
            <span>Select collection date</span>
            <span className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <Calendar className="h-4 w-4 text-emerald-700" />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => handleDateChange(event.target.value)}
                className="min-w-0 bg-transparent text-sm text-slate-800 outline-none"
                aria-label="Select collection date"
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => setIsDateConfirmed(true)}
            className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
          >
            Continue
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setIsDateConfirmed(false); setSelectedSession(null); }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-800"
          aria-label="Edit collection date"
        >
          <Calendar className="h-3.5 w-3.5 text-emerald-700" />
          {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${selectedDate}T00:00:00`))}
          <Edit2 className="h-3 w-3 text-slate-400" />
        </button>
      )}

      {isDateConfirmed && <>
        {!selectedSession && <section aria-label="Choose a collection session" className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Morning or Evening?</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {sessionOptions.map(({ id, label, time, icon: Icon, quantity, entries, theme }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedSession(id)}
                className={`group flex min-h-28 items-center justify-between rounded-2xl border p-4 text-left transition-all sm:p-5 ${
                  selectedSession === id
                    ? theme === 'amber' ? 'border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-200' : 'border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-800'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{time}</span>
                    <span className="mt-0.5 block text-sm font-bold text-slate-900">{label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{entries.length ? `${entries.length} saved ${entries.length === 1 ? 'entry' : 'entries'}` : 'No entries yet'}</span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-lg font-bold tracking-tight text-slate-900">{quantity.toLocaleString('en-IN')} L</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500 group-hover:text-emerald-800">{selectedSession === id ? 'Selected' : 'Choose session'} →</span>
                </span>
              </button>
            ))}
          </div>
        </section>}
        {selectedSession && (
          <section className="space-y-3" aria-label={`${selectedSession} collection form`}>
            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-800"
              aria-label="Edit collection session"
            >
              {selectedSession === 'morning' ? <Sun className="h-3.5 w-3.5 text-amber-600" /> : <Moon className="h-3.5 w-3.5 text-emerald-700" />}
              {selectedSession === 'morning' ? 'Morning collection' : 'Evening collection'}
              <Edit2 className="h-3 w-3 text-slate-400" />
            </button>
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${selectedSession === 'morning' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
              <Edit2 className="h-4 w-4" />
              <h3 className="text-sm font-bold">Adding to {selectedSession === 'morning' ? 'Morning' : 'Evening'} collection</h3>
            </div>
            {selectedSession === 'morning' ? (
              <SessionBlock session="morning" entries={selectedDayRecord?.morningEntries || []} date={selectedDate} />
            ) : (
              <SessionBlock session="evening" entries={selectedDayRecord?.eveningEntries || []} date={selectedDate} />
            )}
          </section>
        )}
      </>}
    </div>
  );
};
