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
  Trash2,
  Check,
  Edit2,
  X,
} from 'lucide-react';

const formatRupees = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

interface SessionFormProps {
  session: MilkSession;
  entries: MilkEntry[];
  date: string;
}

const SessionForm: React.FC<SessionFormProps> = ({ session, entries, date }) => {
  const { addOrUpdateEntry, removeEntry } = useDairy();
  const isMorning = session === 'morning';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [fat, setFat] = useState<string>('');
  const [clr, setClr] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [milkType, setMilkType] = useState<MilkType>('auto');
  const [batchLabel, setBatchLabel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const numFat = parseFloat(fat) || 0;
  const numClr = parseFloat(clr) || 0;
  const numQty = parseFloat(quantity) || 0;

  const chartLookup = lookupRateFromChart(numFat, numClr, milkType);
  const liveRate = chartLookup.rate;
  const liveSnf = calculateChartSNF(numFat, numClr);
  const liveAmount = calculateAmount(numQty, liveRate);
  const canSave = numFat > 0 && numClr > 0 && numQty > 0;

  const resetForm = () => {
    setEditingId(null);
    setFat('');
    setClr('');
    setQuantity('');
    setMilkType('auto');
    setBatchLabel('');
    setNotes('');
    setError('');
  };

  const handleStartEdit = (entry: MilkEntry) => {
    setEditingId(entry.id);
    setFat(entry.fat.toString());
    setClr(entry.clr.toString());
    setQuantity(entry.quantity.toString());
    setMilkType(entry.milk_type || 'auto');
    setBatchLabel(entry.batch_label || '');
    setNotes(entry.notes || '');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      setError('Enter litres, fat, and lactometer reading, then save.');
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
    } else {
      setError('Could not save. Please try again.');
    }
  };

  const handleDelete = async (entry: MilkEntry) => {
    if (confirm(`Delete this entry? ${entry.quantity} L`)) {
      if (editingId === entry.id) resetForm();
      await removeEntry(entry.id);
    }
  };

  const sessionTotalQty = entries.reduce((sum, e) => sum + e.quantity, 0);
  const sessionTotalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const sessionAvgRate = sessionTotalQty > 0 ? sessionTotalAmount / sessionTotalQty : 0;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={handleSubmit} className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-ink-400">
              {editingId ? 'Edit entry' : 'New entry'}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-ink-900">
              {isMorning ? 'Morning milk' : 'Evening milk'}
            </h3>
          </div>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-secondary py-1.5 text-xs">
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {([
            { id: 'auto' as const, label: 'Auto' },
            { id: 'cow' as const, label: 'Cow' },
            { id: 'buffalo' as const, label: 'Buffalo' },
          ]).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMilkType(option.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                milkType === option.id
                  ? 'bg-ink-900 text-white'
                  : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="-mt-3 mb-5 text-xs text-ink-400">Auto picks cow or buffalo from the fat. Choose Cow or Buffalo if you already know.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="field-label">Milk</span>
            <span className="field-hint">Litres collected</span>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="40.0"
                required
                className="field-input pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">L</span>
            </div>
          </label>
          <label className="block">
            <span className="field-label">Fat %</span>
            <span className="field-hint">Fat in the milk</span>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="15.0"
                inputMode="decimal"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="4.0"
                required
                className="field-input pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">%</span>
            </div>
          </label>
          <label className="block">
            <span className="field-label">CLR</span>
            <span className="field-hint">Lactometer reading</span>
            <input
              type="number"
              step="1"
              min="20"
              max="35"
              inputMode="numeric"
              value={clr}
              onChange={(e) => setClr(e.target.value)}
              placeholder="28"
              required
              className="field-input"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" disabled={isSaving} className="btn-primary min-h-11 flex-1">
            {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isSaving ? 'Saving…' : editingId ? 'Update entry' : 'Save entry'}
          </button>
          {showSavedFeedback && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-forest-700" role="status">
              <Check className="h-4 w-4" /> Saved
            </p>
          )}
        </div>
      </form>

      <aside className="panel flex flex-col justify-between p-5">
        <div>
          <p className="text-xs font-semibold text-ink-400">Amount for this entry</p>
          <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-ink-900">
            {canSave ? formatRupees(liveAmount) : '₹0.00'}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {canSave
              ? `₹${liveRate.toFixed(2)} / L · SNF ${liveSnf}% · ${chartLookup.milkType === 'cow' ? 'Cow' : 'Buffalo'}`
              : 'Fill in litres, fat, and CLR to see the price.'}
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-ink-400">{isMorning ? 'Morning milk' : 'Evening milk'}</p>
            <p className="mt-1 font-mono font-semibold text-ink-900">{sessionTotalQty.toFixed(1)} L</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-400">Session total</p>
            <p className="mt-1 font-mono font-semibold text-ink-900">{formatRupees(sessionTotalAmount)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold text-ink-400">Average rate</p>
            <p className="mt-1 font-mono font-semibold text-ink-900">
              {sessionAvgRate > 0 ? `₹${sessionAvgRate.toFixed(2)} / L` : '—'}
            </p>
          </div>
        </div>
      </aside>

      <div className="panel xl:col-span-2">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h4 className="text-sm font-semibold text-ink-900">Saved for this session</h4>
          <span className="text-xs text-ink-500">{entries.length} entry</span>
        </div>
        {entries.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-400">
            Nothing saved yet. Enter litres, fat, and CLR, then save.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Entry</th>
                  <th className="text-right">Milk</th>
                  <th className="text-right">Fat</th>
                  <th className="text-right">CLR</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={entry.id} className={editingId === entry.id ? 'bg-forest-50' : 'bg-white'}>
                    <td>
                      <span className="font-semibold text-ink-900">{entry.batch_label || `Batch ${idx + 1}`}</span>
                      <span className="ml-2 text-xs text-ink-400">
                        {entry.milk_type === 'buffalo' ? 'Buffalo' : 'Cow'}
                      </span>
                    </td>
                    <td className="text-right font-mono">{entry.quantity} L</td>
                    <td className="text-right font-mono">{entry.fat}%</td>
                    <td className="text-right font-mono">{entry.clr}</td>
                    <td className="text-right font-mono">₹{Number(entry.rate_per_liter).toFixed(2)}</td>
                    <td className="text-right font-mono font-semibold">{formatRupees(entry.amount)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(entry)}
                        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-forest-800"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const DailyEntrySection: React.FC = () => {
  const { selectedDate, setSelectedDate, selectedDayRecord } = useDairy();
  const [selectedSession, setSelectedSession] = useState<MilkSession>('morning');

  const sessions: { id: MilkSession; label: string; icon: typeof Sun; qty: number }[] = [
    {
      id: 'morning',
      label: 'Morning',
      icon: Sun,
      qty: selectedDayRecord?.morningQuantity || 0,
    },
    {
      id: 'evening',
      label: 'Evening',
      icon: Moon,
      qty: selectedDayRecord?.eveningQuantity || 0,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <label className="block min-w-[220px]">
          <span className="field-label">Date</span>
          <span className="field-hint">The day this milk was collected</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="field-input"
            aria-label="Select collection date"
          />
          <p className="mt-1.5 text-xs text-ink-400">{formatDate(selectedDate)}</p>
        </label>

        <div className="flex-1 sm:max-w-md">
          <span className="field-label">Morning or evening</span>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-100 p-1">
            {sessions.map(({ id, label, icon: Icon, qty }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedSession(id)}
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  selectedSession === id
                    ? 'bg-ink-800 text-white shadow-md ring-1 ring-ink-900/10'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className={`font-mono text-xs ${selectedSession === id ? 'text-white/70' : 'text-ink-400'}`}>{qty} L</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSession === 'morning' ? (
        <SessionForm session="morning" entries={selectedDayRecord?.morningEntries || []} date={selectedDate} />
      ) : (
        <SessionForm session="evening" entries={selectedDayRecord?.eveningEntries || []} date={selectedDate} />
      )}
    </div>
  );
};
