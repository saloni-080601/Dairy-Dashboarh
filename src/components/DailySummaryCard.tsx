import React from 'react';
import { useDairy } from '../context/DairyContext';

const formatRupees = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

export const DailySummaryCard: React.FC = () => {
  const { selectedDate, selectedDayRecord } = useDairy();

  const morningEntries = selectedDayRecord?.morningEntries || [];
  const eveningEntries = selectedDayRecord?.eveningEntries || [];
  const allEntries = selectedDayRecord?.entries || [];

  const morning = {
    qty: selectedDayRecord?.morningQuantity || 0,
    amount: selectedDayRecord?.morningAmount || 0,
    rate: selectedDayRecord?.morningAvgRate || 0,
    fat: selectedDayRecord?.morningAvgFat || 0,
    clr: selectedDayRecord?.morningAvgClr || 0,
    entries: morningEntries.length,
  };
  const evening = {
    qty: selectedDayRecord?.eveningQuantity || 0,
    amount: selectedDayRecord?.eveningAmount || 0,
    rate: selectedDayRecord?.eveningAvgRate || 0,
    fat: selectedDayRecord?.eveningAvgFat || 0,
    clr: selectedDayRecord?.eveningAvgClr || 0,
    entries: eveningEntries.length,
  };
  const day = {
    qty: selectedDayRecord?.totalQuantity || 0,
    amount: selectedDayRecord?.totalAmount || 0,
    rate: selectedDayRecord?.avgRate || 0,
    fat: selectedDayRecord?.avgFat || 0,
    clr: selectedDayRecord?.avgClr || 0,
    snf: selectedDayRecord?.avgSnf || 0,
    entries: allEntries.length,
  };

  const morningPercent = day.qty > 0 ? Math.round((morning.qty / day.qty) * 100) : 0;
  const eveningPercent = day.qty > 0 ? 100 - morningPercent : 0;

  const rows = [
    { label: 'Milk', morning: `${morning.qty} L`, evening: `${evening.qty} L`, day: `${day.qty} L` },
    { label: 'Money', morning: formatRupees(morning.amount), evening: formatRupees(evening.amount), day: formatRupees(day.amount) },
    {
      label: 'Price / litre',
      morning: morning.rate > 0 ? `₹${morning.rate.toFixed(2)}` : '—',
      evening: evening.rate > 0 ? `₹${evening.rate.toFixed(2)}` : '—',
      day: day.rate > 0 ? `₹${day.rate.toFixed(2)}` : '—',
    },
    { label: 'Fat', morning: `${morning.fat || 0}%`, evening: `${evening.fat || 0}%`, day: `${day.fat}%` },
    { label: 'CLR', morning: String(morning.clr || 0), evening: String(evening.clr || 0), day: String(day.clr) },
    { label: 'Entries', morning: String(morning.entries), evening: String(evening.entries), day: String(day.entries) },
  ];

  return (
    <div className="space-y-3">
      <div className="panel">
        <div className="flex flex-col gap-4 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Selected day</p>
            <h3 className="mt-1 text-base font-semibold text-ink-900">{formatDate(selectedDate)}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Milk</p>
              <p className="mt-1 font-mono text-xl font-semibold text-ink-900">{day.qty} L</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Money</p>
              <p className="mt-1 font-mono text-xl font-semibold text-ink-900">{formatRupees(day.amount)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Price</p>
              <p className="mt-1 font-mono text-xl font-semibold text-ink-900">{day.rate > 0 ? `₹${day.rate.toFixed(2)}` : '—'}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-[520px]">
            <thead>
              <tr>
                <th> </th>
                <th className="text-right">Morning</th>
                <th className="text-right">Evening</th>
                <th className="text-right">Day total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="font-semibold text-ink-700">{row.label}</td>
                  <td className="text-right font-mono text-ink-800">{row.morning}</td>
                  <td className="text-right font-mono text-ink-800">{row.evening}</td>
                  <td className="text-right font-mono font-semibold text-ink-900">{row.day}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {day.qty > 0 && (
          <div className="border-t border-ink-100 px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-500">
              <span>Morning {morning.qty} L ({morningPercent}%)</span>
              <span>Evening {evening.qty} L ({eveningPercent}%)</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-ink-100">
              <div style={{ width: `${morningPercent}%` }} className="bg-ink-400" />
              <div style={{ width: `${eveningPercent}%` }} className="bg-forest-700" />
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-ink-900">Entries for this day</h3>
          <span className="text-xs text-ink-400">{allEntries.length} {allEntries.length === 1 ? 'entry' : 'entries'}</span>
        </div>
        {allEntries.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-400">No milk recorded for this day yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Animal</th>
                  <th className="text-right">Milk</th>
                  <th className="text-right">Fat</th>
                  <th className="text-right">CLR</th>
                  <th className="text-right">SNF</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {allEntries.map((entry, index) => (
                  <tr key={entry.id || index}>
                    <td className="font-semibold text-ink-900">
                      {entry.session === 'morning' ? 'Morning' : 'Evening'}
                      {entry.batch_label ? ` · ${entry.batch_label}` : ''}
                    </td>
                    <td className="text-ink-500">{entry.milk_type === 'buffalo' ? 'Buffalo' : 'Cow'}</td>
                    <td className="text-right font-mono">{entry.quantity} L</td>
                    <td className="text-right font-mono">{entry.fat}%</td>
                    <td className="text-right font-mono">{entry.clr}</td>
                    <td className="text-right font-mono text-ink-500">{entry.snf}%</td>
                    <td className="text-right font-mono">₹{Number(entry.rate_per_liter).toFixed(2)}</td>
                    <td className="text-right font-mono font-semibold">{formatRupees(entry.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-ink-200 bg-ink-50 font-semibold text-ink-900">
                <tr>
                  <td colSpan={2}>Day total</td>
                  <td className="text-right font-mono">{day.qty} L</td>
                  <td className="text-right font-mono">{day.fat}%</td>
                  <td className="text-right font-mono">{day.clr}</td>
                  <td className="text-right font-mono">{day.snf}%</td>
                  <td className="text-right font-mono">₹{day.rate.toFixed(2)}</td>
                  <td className="text-right font-mono">{formatRupees(day.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
